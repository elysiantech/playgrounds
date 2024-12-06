import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// import { Client } from "@upstash/qstash";
// import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const { factor } = await req.json(); // e.g., factor = 2 or 4 for resolution increase

        if (!factor || ![2, 4, 8].includes(factor)) {
            return NextResponse.json({ error: "Invalid upscale factor" }, { status: 400 });
        }

        // Fetch the original image from the database
        const originalImage = await prisma.image.findUnique({ where: { id } });
        if (!originalImage) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }
        const url =`${process.env.BACKEND_URL}`.replace(/--(.*?)\.modal\.run/, `--stable-diffusion-realesrganupscaler-web-predict.modal.run`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_path: `s3://${originalImage.url}` }),
        });
        const result = await response.json();
        const upscaledImageUrl = result.image_path

        // Create a new image record in the database
        const newImage = await prisma.image.create({
            data: {
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

// const qstash = new Client({token: process.env.QSTASH_TOKEN!});
// export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
//     const id = (await params).id;
//     const { factor } = await req.json(); // e.g., factor = 2 or 4 for resolution increase
//     if (!factor || ![2, 4, 8].includes(factor)) {
//         return NextResponse.json({ error: "Invalid upscale factor" }, { status: 400 });
//     }

//     const originalImage = await prisma.image.findUnique({ where: { id } });
//     if (!originalImage) {
//         return NextResponse.json({ error: "Image not found" }, { status: 404 });
//     }

//     const newId = uuidv4()
//     const url =`${process.env.BACKEND_URL}`.replace(/--(.*?)\.modal\.run/, `--stable-diffusion-realesrganupscaler-web-predict.modal.run`);    
//     const response = await qstash.publishJSON({
//         url,
//         body: { image_path: `s3://${originalImage!.url}` },
//         retries:0,
//         callback:  `${process.env.NEXTAUTH_URL}/api/callback?id=${newId}`,
//     });
//     if (!response.messageId)
//         return NextResponse.json({ error: "Failed to queue request" }, { status: 500 });
    
//     // Create a new image record in the database
//     const newImage = await prisma.image.create({
//         data: {
//             id: newId,
//             url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' dy='.3em' fill='%23999'%3EUpscaling...%3C/text%3E%3C/svg%3E`,
//             metadata: {
//                 originalImage: originalImage.url,
//                 resolution: `x${factor}`,
//             },
//             prompt: originalImage.prompt,
//             model: originalImage.model,
//             creativity: originalImage.creativity,
//             steps: originalImage.steps,
//             seed: originalImage.seed,
//             refImage: originalImage.refImage,
//             userId: originalImage.userId,
//         },
//     });
    
//     // return NextResponse.json({messageId:response.messageId})
//     return NextResponse.json(newImage);
// }