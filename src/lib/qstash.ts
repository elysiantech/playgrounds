import { Client } from "@upstash/qstash";

const globalForQstash = global as unknown as { qstash: Client};
export const qstash = globalForQstash.qstash || new Client({ token: process.env.QSTASH_TOKEN! });
