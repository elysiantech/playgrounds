import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

const clients = new Map<string, { enqueue: (data: string) => void; close: () => void }>();

export const POST = verifySignatureAppRouter(async (req: NextRequest) =>{
// export async function POST (req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const id  = searchParams.get('id');
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
    if (clients.has(messageId)) {
        const controller = clients.get(messageId);
        controller!.enqueue(JSON.stringify(newImage));
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
            
            const interval = setInterval(() => {
                controller.enqueue(new TextEncoder().encode(`data: ping\n\n`));
            }, 5000); // Send a ping message ping 5 seconds

            const enqueue = (data: string) => { controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));};
            const close = () => {
                clearInterval(interval);
                controller.close();
                clients.delete(messageId as string); 
            };
        
              // Store the controller in the clients map
            clients.set(messageId as string, { enqueue, close });
            return () => {
                close()
            }
            return close
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

export const config = {
    runtime: 'edge', // Use Edge runtime for long-lived connections
};

