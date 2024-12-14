import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import pusher from '@/lib/pusher';
import storage from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: NextRequest) => {
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
    const sessionId  = searchParams.get('sessionId');
    const {payload} = await req.json(); 

    // Upload to bucket
    const base64Image = payload.images[0].url.split(",")[1];
    if (base64Image){
        const image_path = `${uuidv4()}.jpeg`;
        const buffer = Buffer.from(base64Image, "base64");
        await storage.putObject(image_path, buffer);
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
    const newImage = await prisma.image.delete({where: { id: id as string }});
    const message = JSON.stringify(newImage)
    await pusher.trigger(sessionId as string, 'imageDeleted', message);
    return NextResponse.json(message)
};