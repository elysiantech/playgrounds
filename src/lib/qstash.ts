import { Client } from "@upstash/qstash";
import localtunnel from 'localtunnel'

const globalForQstash = global as unknown as { qstash: Client, localWebhook: localtunnel.Tunnel | undefined};
export const qstash = globalForQstash.qstash || new Client({ token: process.env.QSTASH_TOKEN! });

if (!globalForQstash.localWebhook && process.env.NODE_ENV === 'development') {
    // LocalTunnel is required for local development using webhooks
    (async () => {
      try {
        const tunnel = await localtunnel({ port: 3000, subdomain: 'tanso3d' });
        console.log(`Tunnel started: ${tunnel.url}`);
  
        // Handle tunnel lifecycle events
        tunnel.on('close', () => {
          console.error('Tunnel closed. Consider restarting.');
        });
  
        tunnel.on('error', (err) => {
          console.error(`Tunnel error: ${err.message}`);
        });
  
        // Cache tunnel instance globally
        globalForQstash.localWebhook = tunnel;
      } catch (err) {
        console.error(`Failed to create tunnel: ${err}`);
      }
    })();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function publishWebhookEvent(url: string, body: any, headers: any, params: string) {
    let callbackUrl = `${process.env.NEXTAUTH_URL}/api/ai/callback?${params}`
    if (process.env.NODE_ENV === 'development') {
        callbackUrl = `${globalForQstash.localWebhook!.url}/api/ai/callback?${params}`
    }
    const response = await qstash.publishJSON({
        url, body, headers,
        retries: 1,
        callback: callbackUrl,
        failureCallback: callbackUrl,
    });
    if (!response.messageId) {
        console.error("Failed to publish webhook event to QStash", response);
    }

    return response;
}