import { NextResponse } from 'next/server';
import { getUrlFromS3 } from '@/lib/aws';

interface GenerateImageParams {
  prompt?: string;
  creativity: number;
  steps: number;
  seed: number;
  refImage?: string; // Assuming refImage is passed as a base64 string
  model: string;
  numberOfImages: number;
}

export async function POST(request: Request) {
  const params: GenerateImageParams = await request.json();

  // This is a placeholder implementation
  // return NextResponse.json({ image:{ url: `https://picsum.photos/seed/${params.seed + 1}/300/300`, metadata:{}}});

  const newPayload = {
    prompt: params.prompt,
    num_inference_steps: undefined,
    image_path: params.refImage,
    prompt_strength: (params.prompt && params.refImage) ? (params.creativity - 1) / 9 : undefined,
    seed: params.seed,
  };
  const modelTypes:Record<string,string> = {
    'Flux.1-dev': "Flux",
    'Flux.1-Schnell': "FluxSchnell",
    'Flux.1-Redux': "Flux",
    'SD':"StableDiffusion", 
    'SDXL':"StableDiffusionXL"
  };
  
  let taskType = `taskType=textToImage`; // textToImage, remixImage, imageToModel
  taskType = `className=${ modelTypes[params.model] || "FluxSchnell" }`;
  const url = `${process.env.BACKEND_URL}/start-task?${taskType}&waitUntilComplete=true`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPayload)
  })
  const task = await response.json()
  return NextResponse.json({
    image: {
      url: await getUrlFromS3(task.metadata?.image_path),
      metadata: task.metadata,
    }
  });
}

