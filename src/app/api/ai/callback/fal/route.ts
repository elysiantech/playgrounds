import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import pusher from '@/lib/pusher';
import { getLocalUrl } from '@/lib/storage'


export const POST = async (req: NextRequest) => {
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
    const sessionId  = searchParams.get('sessionId');
    const {payload} = await req.json(); 

    try {
        const image_path = await getLocalUrl(payload.images[0].url)
        if (image_path){
            const newImage = await prisma.image.update({
                where: { id: id as string },
                data: {
                    url: image_path,
                },
            });
            const message = JSON.stringify(newImage)
            await pusher.trigger(sessionId as string, 'imageUpdated', message);
            return NextResponse.json(message)
        }
        // no image productd
        const newImage = await prisma.image.delete({where: { id: id as string }});
        const message = JSON.stringify(newImage)
        await pusher.trigger(sessionId as string, 'imageDeleted', message);
        return NextResponse.json(message)
    } catch {
        return NextResponse.json({})
    }
};