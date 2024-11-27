import { NextResponse } from 'next/server';
import { getUrlFromS3, uploadBase64ToS3 } from '@/lib/aws';
import { v4 as uuidv4 } from 'uuid';

interface GenerateImageParams {
  prompt?: string;
  creativity: number;
  steps: number;
  seed: number;
  refImage?: string; // Assuming refImage is passed as a base64 string
  model: string;
  numberOfImages: number;
}

async function together (request: Request) {
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

  const payload = {
    model,
    prompt: params.prompt || '',
    width: 1024, 
    height: 768, 
    steps: steps,
    seed: params.seed,
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


    // Upload to S3 and get the URL
    const filename = `${uuidv4()}.png`;
    const imageUrl = await uploadBase64ToS3(base64Image, filename);

    // Return the image URL
    return NextResponse.json({
      image: {
        url: imageUrl,
        metadata: result.data[0]?.metadata || {},
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: `Failed to generate image - ${error}` }, { status: 500 });
  }
}

async function backend(request: Request) {
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

  // Construct the payload for the backend
  const newPayload = {
    prompt: params.prompt,
    num_inference_steps: steps,
    image_path: params.refImage, // Reference image path (if any)
    prompt_strength: (params.prompt && params.refImage)
      ? (params.creativity - 1) / 9
      : undefined,
    seed: params.seed,
    width: 1024, 
    height: 1024,
  };

  // Backend API endpoint
  const url = `${process.env.BACKEND_URL}/start-task?className=${className}&waitUntilComplete=true`;

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
    const task = await response.json();

    // Construct the response with the S3 image URL
    return NextResponse.json({
      image: {
        url: await getUrlFromS3(task.metadata?.image_path),
        metadata: task.metadata,
      },
    });
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
