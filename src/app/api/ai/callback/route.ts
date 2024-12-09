import { NextResponse, NextRequest } from 'next/server'
import prisma from "@/lib/prisma";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

// export const runtime = 'edge';

export const config = {
    runtime: 'edge', // Use Edge runtime for long-lived connections
};

const globalForClient = global as unknown as { clients: Set<ReadableStreamDefaultController<Uint8Array>> };
globalForClient.clients = globalForClient.clients || new Set<ReadableStreamDefaultController<Uint8Array>>();


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
    
    await notifyClient(id!, JSON.stringify(newImage))
    return NextResponse.json({ message: 'Callback successfull' })
});

export async function GET(req: NextRequest) {
    // const { searchParams } = req.nextUrl;
    // const sessionId  = searchParams.get('sessionId');
    const clients = globalForClient.clients ;
    const stream = new ReadableStream({
        start(controller) {
            clients.add(controller);
            const encoder = new TextEncoder();

            // Keep connection alive
            const interval = setInterval(() => {
                controller.enqueue(encoder.encode(`data: ping\n\n`));
            }, 30000); // Send a ping message ping 30 seconds
        
              // Store the controller in the clients map
            req.signal.addEventListener("abort", () => {
                console.log('stream canceled')
                clearInterval(interval);
                clients.delete(controller);// Remove client on disconnect
            });

            return () => {
                console.log('controller closed')
                clearInterval(interval);
                clients.delete(controller);
            }
        },
    })

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    })
}

async function notifyClient(sessionId:string, message:string){
    const clients = globalForClient.clients ;
    console.log(`post clients has ${clients.size} entries`)
    const encoder = new TextEncoder();
    clients.forEach(client => {
        client.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
    });
}

