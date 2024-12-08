import { NextResponse } from 'next/server';
import storage  from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"
import { GenerateImageParams } from '@/lib/types';

const aspectRatios: { [key: string]: { width: number; height: number } } = {
  "1:1": { width: 768, height: 768 },
  "4:3": { width: 1024, height: 768 },
  "16:9": { width: 1344, height: 736 },
  "5:4": { width: 1120, height: 896 },
  "9:16": { width: 736, height: 1344 },
};

async function together (request: Request) {
  // Get the user's session
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" },{ status: 401 });
  }

  const params: GenerateImageParams = await request.json();

  const modelTypes: Record<string, string> = {
    'Flux.1-dev': 'black-forest-labs/FLUX.1-dev',
    'Flux.1-Schnell': 'black-forest-labs/FLUX.1-schnell-Free',
    'Flux.1-Redux': 'black-forest-labs/FLUX.1-redux',
  };

  // Map model and set default if not found
  const model = modelTypes[params.model] || 'black-forest-labs/FLUX.1-schnell-Free';
  const maxSteps = params.model === "Flux.1-Schnell" ? 4 : 50;
  const steps = Math.min(params.steps || maxSteps, maxSteps); // Ensure steps don't exceed max
  const { width, height } = aspectRatios[ params.aspectRatio?? '4:3']

  const payload = {
    model,
    prompt: params.prompt || '',
    width, 
    height, 
    steps: steps,
    seed: Number(params.seed),
    n: 1, // Number of images to generate
    response_format: 'b64_json', // Request base64 response
  };

  try {
    // Fetch image from Together API
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.log(errorDetails)
      return NextResponse.json({ error: `Failed to generate image - ${errorDetails}` }, { status: response.status });
    }

    const result = await response.json();
    const base64Image = result.data[0]?.b64_json; // Extract base64 image data

    if (!base64Image) {
      return NextResponse.json({ error: 'No image data returned' }, { status: 500 });
    }

    // Upload to bucket
    const filename = `${uuidv4()}.png`;
    const buffer = Buffer.from(base64Image, "base64");
    await storage.putObject(filename, buffer);

    // Store in database
    const newImage = await prisma.image.create({
      data: {
        url:filename,
        metadata: result.data[0]?.metadata || {},
        userId:session.user.id,
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
    console.error('Error generating image:', error);
    return NextResponse.json({ error: `Failed to generate image - ${error}` }, { status: 500 });
  }
}

async function backend(request: Request) {
  // Get the user's session
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" },{ status: 401 });
  }

  // Parse request parameters
  const params: GenerateImageParams = await request.json();

  // Map model names to class names
  const modelTypes: Record<string, string> = {
    'Flux.1-dev': "Flux",
    'Flux.1-Schnell': "FluxSchnell",
    'Flux.1-Redux': "Flux",
  };

  // Determine the class name from the model, with a default fallback
  const className = modelTypes[params.model] || "FluxSchnell";
  const maxSteps = className === "FluxSchnell" ? 4 : 50;
  const steps = Math.min(params.steps || maxSteps, maxSteps); // Ensure steps don't exceed max
  const { width, height } = aspectRatios[ params.aspectRatio?? '4:3']

  // Construct the payload for the backend
  const newPayload = {
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

  // Backend API endpoint
  const url =`${process.env.BACKEND_URL}`.replace(/--(.*?)\.modal\.run/, `--blackforestlabs-${className.toLocaleLowerCase()}-web-predict.modal.run`);
  try {
    // Send a POST request to the backend
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayload),
    });

    // Handle errors in the backend response
    if (!response.ok) {
      const errorDetails = await response.text();
      return NextResponse.json(
        { error: `Failed to generate image - ${errorDetails}` },
        { status: response.status }
      );
    }

    // Parse the backend response
    const result = await response.json();
    // Store in database
    const newImage = await prisma.image.create({
      data: {
        url:result.image_path,
        metadata: {},
        userId:session.user.id,
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
      { error: `Failed to generate image - ${error}`},
      { status: 500 }
    );
  }
}

export async function POST(request: Request){
  
  if (true)
    return await together(request)
  else 
    return await backend(request)
}
