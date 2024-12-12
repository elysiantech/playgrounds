import Pusher from "pusher";

const globalForPusher = global as unknown as { pusher: Pusher };

export const pusher = globalForPusher.pusher || new Pusher({
    appId: process.env.PUSHER_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    host: process.env.NEXTAUTH_URL!,
    // useTLS:true,
});

export default pusher;
