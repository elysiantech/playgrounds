import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import pusher from '@/lib/pusher';
import { getLocalUrl } from '@/lib/storage'


export const POST = async (req: NextRequest) => {
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
    const sessionId  = searchParams.get('sessionId');

    try {
        const { payload } = await req.json();
        let url: string | undefined;
        let metadata: Record<string, any> = {};
        
        if (payload.images && payload.images.length > 0) {
            ({ url } = payload.images[0]);
        } else if (payload.video) {
            ({ url, ...metadata } = payload.video);
        } 
        if (url){
            const media_path = await getLocalUrl(url)

            const updateEntry = await prisma.image.update({
                where: { id: id as string },
                data: {
                    url: media_path,
                    metadata: { 
                        handler:'fal', 
                        ...(Object.keys(metadata).length ? metadata: undefined)
                    }, 
                },
            });
            const message = JSON.stringify(updateEntry)
            await pusher.trigger(sessionId as string, 'imageUpdated', message);
            return NextResponse.json(message)
        }
        // no media produced
        const newImage = await prisma.image.delete({where: { id: id as string }});
        const message = JSON.stringify(newImage)
        await pusher.trigger(sessionId as string, 'imageDeleted', message);
        return NextResponse.json(message)
    } catch {
        return NextResponse.json({})
    }
};