import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import pusher from '@/lib/pusher';

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

export const POST = verifySignatureAppRouter(async (req: NextRequest) =>{
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
    const sessionId  = searchParams.get('sessionId');
    
    try {
        const body = await req.json(); 
        const buffer = Buffer.from(body.body, "base64").toString()
        const status = body?.status
        
        if (status >= 200 && status < 300){
            const payload = JSON.parse(buffer);
            let url: string | undefined;
            let metadata: Record<string, any> = {};

            if (payload.image_path) {
                ({image_path:url, ...metadata  } = payload.image_path);
            } else if (payload.video_path) {
                ({ video_path:url, ...metadata } = payload);
            } 
            if (url){
                // url already from s3
                const updateEntry = await prisma.image.update({
                    where: { id: id as string },
                    data: {
                        url,
                        metadata: { 
                            handler:'modal', 
                            ...(Object.keys(metadata).length ? metadata: undefined)
                        }, 
                    },
                });
                const message = JSON.stringify(updateEntry)
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

