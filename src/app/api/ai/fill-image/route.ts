import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"
import { GenerateImageParams } from '@/lib/types';
import { getLocalUrl , getRemoteUrl} from '@/lib/storage'

  
export async function POST(request: Request) {
  // Get the user's session
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request parameters
    const params: GenerateImageParams = await request.json();
    if (!params.refImage || !params.maskImage)
        return NextResponse.json({ error: "Need ref and mask image" }, { status: 401 });
    params.refImage = await getLocalUrl(params.refImage)
    params.maskImage = await getLocalUrl(params.maskImage)
    
    const id = uuidv4();
    const userId = session.user.id
    const model = 'fal-ai/flux-pro/v1/fill'
    const maxSteps = params.model === "Flux.1-Schnell" ? 4 : 50;
    const steps = Math.min(params.steps || maxSteps, maxSteps); // Ensure steps don't exceed max
    // const { width, height } = aspectRatioMap[params.aspectRatio ?? '4:3']
    
    const body = {
      prompt: params.prompt || '',
      image_url:  await getRemoteUrl(params.refImage),
      mask_url: await getRemoteUrl(params.maskImage),
      sync_mode: true,
      num_inference_steps: steps,
      enable_safety_checker: true,
      seed: Number(params.seed),
      output_format: 'jpeg', //'png'
      num_images: 1,
      image_prompt_strength: (params.prompt && params.refImage) ? (params.creativity - 1) / 9 : undefined,
    };

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

    const newImage = await prisma.image.create({
        data: {
          id: id,
          url: undefined,
          metadata: { maskImage: params.maskImage },
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
