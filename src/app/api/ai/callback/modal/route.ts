import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import pusher from '@/lib/pusher';

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

export const POST = verifySignatureAppRouter(async (req: NextRequest) =>{
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
    const sessionId  = searchParams.get('sessionId');
    const body = await req.json(); 
    
    try {
        const buffer = Buffer.from(body.body, "base64").toString()
        const status = body?.status
        
        if (status === 200){
            const result = JSON.parse(buffer);
            if (result.image_path) {
                const newImage = await prisma.image.update({
                    where: { id: id as string },
                    data: {
                        url: result.image_path,
                    },
                });
                const message = JSON.stringify(newImage)
                await pusher.trigger(sessionId as string, 'imageUpdated', message);
                return NextResponse.json(message)
            }
        }
        // no image productd
        const newImage = await prisma.image.delete({where: { id: id as string }});
        const message = JSON.stringify(newImage)
        await pusher.trigger(sessionId as string, 'imageDeleted', message);
        return NextResponse.json(message)
    } catch {
        return NextResponse.json({})
    }
});

