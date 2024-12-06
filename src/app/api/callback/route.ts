import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import { Image as ImageModel } from '@prisma/client';
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

const clients = new Map<string, { enqueue: (data: ImageModel) => void; close: () => void }>();

export const POST = verifySignatureAppRouter(async (req: NextRequest) =>{
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
    const body = await req.json(); 

    const messageId = body?.sourceMessageId
    const result = JSON.parse(Buffer.from(body.body, "base64").toString("ascii"));

    if (!messageId || !result.image_path) {
        return NextResponse.json({ message: 'Invalid payload' })
    }

    if (clients.has(messageId)) {
        const upscaledImageUrl = result.image_path
        const newImage = await prisma.image.update({
            where: { id: id as string },
            data: {
                url: upscaledImageUrl,
            },
        });
        console.log(`Updating message request ${messageId} with result ${upscaledImageUrl}`)
        const controller = clients.get(messageId);
        controller!.enqueue(newImage);
        controller!.close();
        clients.delete(messageId);
    }
    return NextResponse.json({ message: 'Image processed successfully' })
});

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const messageId  = searchParams.get('messageId');

    const stream = new ReadableStream({
        start(controller) {
            clients.set(messageId as string, controller);

            return () => {
                clients.delete(messageId as string);
            }
        }
    })

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    })
}

