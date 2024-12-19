import { NextResponse } from 'next/server';
import storage from '@/lib/storage'
import {processBase64Image} from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"
import { GenerateImageParams, aspectRatios } from '@/lib/types';
import { qstash } from "@/lib/qstash";

interface BackendHandler {
  processRequest(id:string, userId:string, model: string, params: GenerateImageParams): Promise<{ image_path: string | undefined }>;
}

const aspectRatioMap = Object.fromEntries(
  aspectRatios.map((ar) => [ar.ratio, { width: ar.width, height: ar.height }])
);

const togetherHandler: BackendHandler = {
  processRequest: async (id:string, userId:string, model: string, params: GenerateImageParams) => {
    const maxSteps = params.model === "Flux.1-Schnell" ? 4 : 50;
    const steps = Math.min(params.steps || maxSteps, maxSteps); // Ensure steps don't exceed max
    const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3']

    const body = {
      model,
      prompt: params.prompt || '',
      width,
      height,
      steps: steps,
      seed: Number(params.seed),
      n: 1, // Number of images to generate
      response_format: 'b64_json', // Request base64 response
    };

    const url = `https://api.together.xyz/v1/images/generations`;
    const headers = { Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`, 'Content-Type': 'application/json'}
    const response = await fetch(url, {
      method: 'POST',
      headers, 
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.log(errorDetails)
      throw new Error(`Failed to generate image - ${errorDetails}`)
    }

    const result = await response.json();
    const base64Image = result.data[0]?.b64_json; // Extract base64 image data
    if (!base64Image)
      throw new Error(`Failed to generate image`)

    // Upload to bucket
    const image_path = await processBase64Image(`data:image/png;base64,${base64Image}`);
    // image_path = `${uuidv4()}.png`;
    // const buffer = Buffer.from(base64Image, "base64");
    // await storage.putObject(image_path, buffer);
    return { image_path: image_path }
  }
}

const falHandler: BackendHandler = {
  processRequest: async (id:string, userId:string, model: string, params: GenerateImageParams) => {
    const maxSteps = params.model === "Flux.1-Schnell" ? 4 : 50;
    const steps = Math.min(params.steps || maxSteps, maxSteps); // Ensure steps don't exceed max
    const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3']
    
    const body = {
      prompt: params.prompt || '',
      image_size: { width, height },
      sync_mode: true,
      num_inference_steps: steps,
      enable_safety_checker: true,
      seed: Number(params.seed),
      output_format: 'jpeg', //'png'
      num_images: 1,
      image_url: params.refImage ?? undefined,
      image_prompt_strength: (params.prompt && params.refImage) ? (params.creativity - 1) / 9 : undefined,
    };

    if (body.image_url && !body.image_url.startsWith('http')){
      // export a bucket url for fal
      body.image_url = await storage.getUrl(body.image_url);
    }
    
    const headers =  { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' }
    const webHookParams = new URLSearchParams({ id:id, sessionId:userId}).toString()
    const webHookUrl = `${process.env.BASE_URL}/api/ai/callback/fal?${webHookParams}`
    const url = `https://queue.fal.run/${model}?fal_webhook=${encodeURIComponent(webHookUrl)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.log(errorDetails)
      throw new Error(`Failed to generate image - ${errorDetails}`)
    }
    return { image_path: undefined}
  }
}


const modalHandler: BackendHandler = {
  processRequest: async (id:string, userId:string, model: string, params: GenerateImageParams) => {
    const maxSteps = params.model === "FluxSchnell" ? 4 : 50;
    const steps = Math.min(params.steps || maxSteps, maxSteps); // Ensure steps don't exceed max
    const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3']
    const url = `${process.env.BACKEND_URL}`.replace(/--(.*?)\.modal\.run/, `--${model}-web-predict.modal.run`);
    
    // Construct the payload for the backend
    const body = {
      prompt: params.prompt,
      num_inference_steps: steps,
      image_path: params.refImage, // Reference image path (if any)
      prompt_strength: (params.prompt && params.refImage)
        ? (params.creativity - 1) / 9
        : undefined,
      seed: Number(params.seed),
      width,
      height,
    };

    const headers = { 'Content-Type': 'application/json' };
    const webHookParams = new URLSearchParams({ id:id, sessionId:userId, source:"modal"}).toString()
    const webHookUrl = `${process.env.BASE_URL}/api/ai/callback/modal?${webHookParams}`
    const response = await qstash.publishJSON({url, body, headers,
            retries: 1,
            callback: webHookUrl,
            failureCallback: webHookUrl,
    });
    if (!response.messageId) {
        throw new Error('Backend request failed');
    }
    return { image_path: undefined}
    // Send a POST request to the backend
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify(body),
    // });

    // if (!response.ok) {
    //   const errorDetails = await response.text();
    //   console.log(errorDetails)
    //   throw new Error(`Failed to generate image - ${errorDetails}`)
    // }
    // // Parse the backend response
    // const result = await response.json();
    // return { image_path: result.image_path }
  }
}

function routeModel(params: GenerateImageParams): { handler: BackendHandler; modelName: string } {
  const { model, refImage } = params;
  let handler: BackendHandler;
  let modelName: string;
  
  switch (model) {
    case 'Flux.1-Schnell':
      handler = togetherHandler;
      modelName = 'black-forest-labs/FLUX.1-schnell-Free';
      if (refImage) {
        handler = modalHandler; //togetherHandler
        modelName = 'blackforestlabs-fluxschnell'; //'black-forest-labs/FLUX.1-redux'
      }
      break;
    case 'Flux.1-dev':
      handler = togetherHandler;
      modelName = 'black-forest-labs/FLUX.1-dev'
      if (refImage){
        handler = falHandler;
        modelName = 'fal-ai/flux/dev/image-to-image'
      }
      break;
    case 'Flux.1-Pro':
      handler = falHandler;
      modelName = 'fal-ai/flux-pro';
      if (refImage){
        modelName = 'fal-ai/flux-pro/v1/redux'; //'fal-ai/flux-lora'
      }
      break;
    default:
      throw new Error(`Unsupported model type: ${model}`);
  }
  return { handler, modelName }
}

export async function POST(request: Request) {
  // Get the user's session
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request parameters
    const params: GenerateImageParams = await request.json();
    
    const { handler, modelName } = routeModel(params);
    const newId = uuidv4();
    const userId = session.user.id
    
    if (params.refImage && params.refImage.startsWith("data:image")) {
      params.refImage = await processBase64Image(params.refImage)
    }
    
    // call appropriate model backend
    const result = await handler.processRequest(newId, userId, modelName, params);
    // Store in database
    const newImage = await prisma.image.create({
      data: {
        id: newId,
        url: result.image_path!,
        metadata: {},
        userId: session.user.id,
        prompt: params.prompt || '',
        model: params.model,
        creativity: params.creativity,
        steps: params.steps,
        aspectRatio: params.aspectRatio,
        seed: String(params.seed),
        refImage: params.refImage,
      },
    });

    // Return new Image
    return NextResponse.json(newImage);
  } catch (error) {
    console.error('Error starting task:', error);
    return NextResponse.json(
      { error: `Failed to generate image - ${error}` },
      { status: 500 }
    );
  }

}
