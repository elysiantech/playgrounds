import { auth } from "@/lib/auth"
import { NextResponse } from 'next/server';
import { GenerateVideoParams, aspectRatios } from '@/lib/types';
import { getLocalUrl , getRemoteUrl} from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "@/lib/prisma";
import { qstash } from "@/lib/qstash";

type HandlerConfig = {
  body: object;
  url: string;
  headers: Record<string, string>;
  transformResponse?: (response: any) => any; 
  webhookUrl?: string;
};

type HandlerType =  'fal' | 'modal'

const buildHandlerConfig = async (
    handler: HandlerType,
    id: string,
    userId: string,
    model: string,
    params: GenerateVideoParams
  ): Promise<HandlerConfig> => {
    const aspectRatioMap = Object.fromEntries( aspectRatios.map((ar) => [ar.ratio, { width: ar.width, height: ar.height }]));
    const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3'];
    const promptStrength = params.prompt && params.refImage ? (params.creativity - 1) / 9 : undefined
    const refImageUrl = await getRemoteUrl(params.refImage);
    
    switch (handler) {
      case 'fal': {
        const webhookUrl = `${process.env.BASE_URL}/api/ai/callback/fal?id=${id}&sessionId=${userId}`;
        return {
          body: {
            prompt: params.prompt || '',
            seed: Number(params.seed),
            //aspect_ratio: params.model !== 'CogVideoX-5B' ? params.aspectRatio : undefined,  
            image_url: refImageUrl,
            duration: params.duration,
          },
          url: `https://queue.fal.run/${model}?fal_webhook=${encodeURIComponent(webhookUrl)}`,
          headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
        };
      }
  
      case 'modal': {
        return {
          body: {
            prompt: params.prompt || '',
            seed: Number(params.seed),
          },
          url: process.env.BACKEND_URL!.replace(/--(.*?)\.modal\.run/, `--${model}-web-predict.modal.run`),
          headers: { 'Content-Type': 'application/json' },
          transformResponse: undefined,
          webhookUrl: `${process.env.BASE_URL}/api/ai/callback/modal?id=${id}&sessionId=${userId}&source=modal`,
        };
      }

      default:
        throw new Error(`Unsupported handler type: ${handler}`);
    }
  };

function routeModel(params: GenerateVideoParams): {handler:HandlerType, model: string } {
    const isimageToVideo = params.refImage? true:false;
    const taskType = isimageToVideo ? 'imageToVideo' : 'textToVideo';
    const modelMap: Record<string, { textToVideo: undefined | { handler: HandlerType; model: string }; imageToVideo: undefined | { handler: HandlerType; model: string };}> = {
      'MiniMax': {
        textToVideo: { handler: 'fal', model: 'fal-ai/minimax/video-01' },
        imageToVideo: { handler: 'fal', model: 'fal-ai/minimax/video-01/image-to-video' },
      },
      'Kling-1': {
        textToVideo: { handler: 'fal', model: 'fal-ai/kling-video/v1/standard/text-to-video' },
        imageToVideo: { handler: 'fal', model: 'fal-ai/kling-video/v1/standard/image-to-video' },
      },
      'CogVideoX-5B': {
        textToVideo: { handler: 'fal', model: 'fal-ai/cogvideox-5b' },
        imageToVideo: { handler: 'fal', model: 'fal-ai/cogvideox-5b/image-to-video' },
      },
      'Hapier-v2': {
        textToVideo: { handler: 'fal', model: 'fal-ai/haiper-video-v2' },
        imageToVideo:{ handler: 'fal', model:'fal-ai/haiper-video-v2/image-to-video'},
      }
    };
    const modelConfig = modelMap[params.model]?.[taskType];
    if (modelConfig) return modelConfig;  

    throw new Error(`Unsupported model type: ${params.model} for ${taskType}`);
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
        const params: GenerateVideoParams = await request.json();
        params.refImage = await getLocalUrl(params.refImage) // uploads to storage
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
        return NextResponse.json({ error: `Failed to generate video - ${error}` }, { status: 500 }
    );
  }
}