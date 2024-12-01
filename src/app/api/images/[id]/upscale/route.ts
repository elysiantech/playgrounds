import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

        const url = `${process.env.BACKEND_URL}/start-task?className=RealEsrganUpscaler&waitUntilComplete=true`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_path: `s3://${originalImage.url}` }),
        });
        const task = await response.json();
        const upscaledImageUrl = task.metadata?.image_path

        // Create a new image record in the database
        const newImage = await prisma.image.create({
            data: {
                url: upscaledImageUrl,
                metadata: {
                    originalImage: id,
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
