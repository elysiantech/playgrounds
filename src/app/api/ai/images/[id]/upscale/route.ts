import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { publishWebhookEvent } from "@/lib/qstash";
import { generatePlaceholderImage } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
    
        const id = (await params).id;
        const { factor } = await req.json(); // e.g., factor = 2 or 4 for resolution increase
        if (!factor || ![2, 4, 8].includes(factor)) {
            return NextResponse.json({ error: "Invalid upscale factor" }, { status: 400 });
        }

        const originalImage = await prisma.image.findUnique({ where: { id } });
        if (!originalImage) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }
        const url =`${process.env.BACKEND_URL}`.replace(
            /--(.*?)\.modal\.run/, 
            `--stable-diffusion-realesrganupscaler-web-predict.modal.run`
        );    
    
        const newId = uuidv4()
        const body = { image_path: `s3://${originalImage!.url}` }
        const headers= { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY!}`, 'Content-Type': 'application/json'}
        const webHookParams = new URLSearchParams({ id:newId, sessionId:originalImage!.userId}).toString()
        const response = await publishWebhookEvent(url, body, headers, webHookParams);
        const upscaledImageUrl = generatePlaceholderImage('Upscaling...', '', 512,512 )
        if (!response.messageId) {
            throw new Error('Backend request failed');
        }
        // const response = await fetch(url, {
        //         method: 'POST',
        //         body: JSON.stringify(body),
        //         headers,
        //     });
        // if (!response.ok) {
        //     throw new Error('Backend request failed');
        // }
        // const result = await response.json();
        // const upscaledImageUrl = result.image_path
    
        // Create a new image record in the database
        const newImage = await prisma.image.create({
            data: {
                id: newId,
                url: upscaledImageUrl,
                metadata: {
                    originalImage: originalImage.url,
                    resolution: `x${factor}`,
                },
                prompt: originalImage.prompt,
                model: originalImage.model,
                creativity: originalImage.creativity,
                steps: originalImage.steps,
                seed: originalImage.seed,
                aspectRatio: originalImage.aspectRatio,
                refImage: originalImage.refImage,
                userId: originalImage.userId,
            },
        });
        
        return NextResponse.json(newImage);
    } catch (error) {
        console.error("Error upscaling image:", error);
        return NextResponse.json(
            { error: "Failed to upscale image" },
            { status: 500 }
        );
    }
}