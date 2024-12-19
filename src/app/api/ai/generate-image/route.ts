import { auth } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { GenerateImageParams, aspectRatios } from '@/lib/types';
import storage from '@/lib/storage'
import { getLocalUrl , getRemoteUrl} from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "@/lib/prisma";
import { qstash } from "@/lib/qstash";

type HandlerConfig = {
  body: object;
  url: string;
  headers: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformResponse?: (response: any) => any; 
  webhookUrl?: string;
};

type HandlerType = 'together' | 'fal' | 'modal' | 'replicate'

const buildHandlerConfig = async (
    handler: HandlerType,
    id: string,
    userId: string,
    model: string,
    params: GenerateImageParams
  ): Promise<HandlerConfig> => {
    const aspectRatioMap = Object.fromEntries( aspectRatios.map((ar) => [ar.ratio, { width: ar.width, height: ar.height }]));
    const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3'];
    const steps = Math.min(params.steps || 50, params.model === "Flux.1-Schnell" ? 4 : 50);
    const promptStrength = params.prompt && params.refImage ? (params.creativity - 1) / 9 : undefined
    const refImageUrl = await getRemoteUrl(params.refImage);
    const maskImageUrl = await getRemoteUrl(params.maskImage);

    const baseBody = {
      prompt: params.prompt || '',
      seed: Number(params.seed),
      width,
      height,
      
    };
  
    switch (handler) {
      case 'together':
        return {
          body: { ...baseBody, model, n: 1, steps, response_format: 'b64_json' },
          url: `https://api.together.xyz/v1/images/generations`,
          headers: { Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`, 'Content-Type': 'application/json' },
          transformResponse: async (response) => {
            const base64Image = response.data[0]?.b64_json;
            const url = await getLocalUrl(`data:image/png;base64,${base64Image}`);
            return {  image_path:url, metadata: { id:response.id} }
          }
        };
  
      case 'fal': {
        const webhookUrl = `${process.env.BASE_URL}/api/ai/callback/fal?id=${id}&sessionId=${userId}`;
        return {
          body: {
            ...baseBody,
            image_size: { width, height },
            output_format: 'jpeg',
            num_images: 1,
            steps,
            image_url: refImageUrl,
            mask_url: maskImageUrl,
            image_prompt_strength: promptStrength,
          },
          url: `https://queue.fal.run/${model}?fal_webhook=${encodeURIComponent(webhookUrl)}`,
          headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
        };
      }
  
      case 'modal': {
        return {
          body: {
            ...baseBody,
            num_inference_steps: steps,
            image_path: refImageUrl,
            prompt_strength: promptStrength,
          },
          url: process.env.BACKEND_URL!.replace(/--(.*?)\.modal\.run/, `--${model}-web-predict.modal.run`),
          headers: { 'Content-Type': 'application/json' },
          transformResponse: undefined,
          webhookUrl: `${process.env.BASE_URL}/api/ai/callback/modal?id=${id}&sessionId=${userId}&source=modal`,
        };
      }

      case 'replicate': {
        return {
            body:{
                prompt:params.prompt!,
                image:refImageUrl,
                mask:maskImageUrl,
                steps,
                guidance:3,
                output_format:'jpg',
                safety_tolerance:2,
                prompt_upsampling:false,
            },
            url:`https://api/replicate.com/v1/models/${model}/predictions`,
            headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, 'Prefer':'wait', 'Content-Type': 'application/json' },
            webhookUrl: `${process.env.BASE_URL}/api/ai/callback/modal?id=${id}&sessionId=${userId}`,
            transformResponse: async (response) => {
                const res = await fetch(response.output)
                if (!res.ok) throw new Error(`Failed to fetch image from ${response.output}`);
                const url = `${uuidv4()}.jpg`
                await storage.putObject(url, Buffer.from( await res.arrayBuffer() ))
                return { image_path:url, metadata:{ id: response.id } }
            }
        };
    }
      default:
        throw new Error(`Unsupported handler type: ${handler}`);
    }
  };

function routeModel(params: GenerateImageParams): {handler:HandlerType, model: string } {
    const isImageToImage = params.refImage? true:false;
    const taskType = isImageToImage ? 'imageToImage' : 'textToImage';
    const modelMap: Record<string, { textToImage: undefined | { handler: HandlerType; model: string }; imageToImage: undefined | { handler: HandlerType; model: string };}> = {
      'Flux.1-Schnell': {
        textToImage: { handler: 'together', model: 'black-forest-labs/FLUX.1-schnell-Free' },
        imageToImage: { handler: 'modal', model: 'blackforestlabs-fluxschnell' },
      },
      'Flux.1-dev': {
        textToImage: { handler: 'together', model: 'black-forest-labs/FLUX.1-dev' },
        imageToImage: { handler: 'fal', model: 'fal-ai/flux/dev/image-to-image' },
      },
      'Flux.1-Pro': {
        textToImage: { handler: 'fal', model: 'fal-ai/flux-pro' },
        imageToImage: { handler: 'fal', model: 'fal-ai/flux-pro/v1/redux' },
      },
      'Recraft 20B': {
        textToImage: { handler: 'fal', model: 'fal-ai/recraft-20b' },
        imageToImage: undefined,
      },
      'Nvidia Sana': {
        textToImage: { handler: 'fal', model: 'fal-ai/sana' },
        imageToImage: undefined,
      },
    };
    const modelConfig = modelMap[params.model]?.[taskType];
    if (modelConfig) return modelConfig;  

    throw new Error(`Unsupported model type: ${params.model}`);
}

export async function POST(request: Request) {
    // Get the user's session
    const session = await auth();
    if (!session || !session.user || !session.user.id) 
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
    try {
      // Parse request parameters
        const id = uuidv4();
        const userId = session.user.id  
        const params: GenerateImageParams = await request.json();
        params.refImage = await getLocalUrl(params.refImage) // uploads to storage
        params.maskImage = await getLocalUrl(params.maskImage) // uploads to storage
        const { handler, model } = routeModel(params);
        const {url, body, headers, webhookUrl:callback, transformResponse} = await buildHandlerConfig(handler, id, userId, model, params)
        let content;
        if (callback){
            const response = await qstash.publishJSON({url, body, headers, callback, retries:1, failureCallback:callback})
            if (!response.messageId) throw new Error('Publish request failed');
            content = response;
        } else { 
            const response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body),});
            if (!response.ok)throw new Error(`Request failed - ${await response.text()}`);
            content = await response.json()
        }
        const results = (transformResponse)? await transformResponse(content) : { image_path: undefined, metadata: {}}
        
        const newImage = await prisma.image.create({
            data: {
                id,
                userId,
                url: results.image_path!,
                metadata: {handler, ...results.metadata},        
                prompt: params.prompt || '',
                model: params.model,
                creativity: params.creativity,
                steps: params.steps,
                aspectRatio: params.aspectRatio,
                seed: String(params.seed),
                refImage: params.refImage,
                //maskImage: params.maskImage,
            },
        });
        // Return new Image
        return NextResponse.json(newImage);
    } catch (error) {
        return NextResponse.json({ error: `Failed to generate image - ${error}` }, { status: 500 }
    );
  }
}