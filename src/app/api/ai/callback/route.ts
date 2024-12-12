import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import pusher from '@/lib/pusher';

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

export const POST = verifySignatureAppRouter(async (req: NextRequest) =>{
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
    // const sessionId  = searchParams.get('sessionId');
    const body = await req.json(); 

    const messageId = body?.sourceMessageId
    const buffer = Buffer.from(body.body, "base64").toString()
    const result = JSON.parse(buffer);

    if (!messageId || !result.image_path) {
        return NextResponse.json({ message: 'Invalid payload' })
    }

    const upscaledImageUrl = result.image_path
    const newImage = await prisma.image.update({
        where: { id: id as string },
        data: {
            url: upscaledImageUrl,
        },
    });
    const message = JSON.stringify(newImage)
    
    await pusher.trigger('default', 'imageUpdated', message);
    return NextResponse.json(message)
});

