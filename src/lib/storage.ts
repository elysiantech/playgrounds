import { S3Client, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { v4 as uuidv4 } from 'uuid';


const MIME_TYPE: { [key: string]: string } = {
  // Images
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  // Text
  '.htm': 'text/html',
  '.html': 'text/html',
  '.php': 'text/plain',
  '.json': 'application/json',
  // Archives
  '.zip': 'application/zip',
};

// Reverse-map MIME types to extensions
const EXTENSIONS: { [key: string]: string } = Object.entries(MIME_TYPE).reduce(
  (acc, [ext, mime]) => {
    acc[mime] = ext.replace('.', ''); // Remove the leading dot for extensions
    return acc;
  },
  {} as { [key: string]: string }
);


export interface StorageProvider {
  getObject: (key: string) => Promise<{ stream: Readable; contentType: string }>;
  putObject: (key: string, content: Buffer | string) => Promise<void>;
  deleteObject: (key: string) => Promise<void>;
  getUrl: (key: string) => Promise<string>;
}


class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.AWS_ENDPOINT || undefined,
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.AWS_BUCKET!;
  }

  async getObject(key: string): Promise<{ stream: Readable; contentType: string }> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    const response: GetObjectCommandOutput = await this.client.send(command);

    if (!response.Body || !response.ContentType) {
      throw new Error("Failed to fetch object or content type is missing");
    }

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType,
    };
  }

  async putObject(key: string, content: Buffer | string) {
    const fileExtension = key.substring(key.lastIndexOf("."));
    const mimeType = MIME_TYPE[fileExtension] || "application/octet-stream"; // Fallback to octet-stream

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: content,
      ContentType: `${mimeType}; charset=utf-8`,
    });
    await this.client.send(command);
  }
  
  async deleteObject(key: string) {
      const command = new DeleteObjectCommand({ Bucket: this.bucketName, Key: key });
      await this.client.send(command);
  }
  async getUrl(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    return await getSignedUrl(this.client, command, { expiresIn: 3600 }); // URL valid for 1 hour
    // return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
}

class VercelBlobStorageProvider implements StorageProvider {
  private authToken: string;

  constructor() {
    this.authToken = process.env.VERCEL_AUTH_TOKEN!;
  }

  async getObject(key: string): Promise<{ stream: Readable; contentType: string }> {
    const response = await fetch(key);

    if (!response.ok || !response.headers.get("content-type")) {
      throw new Error("Failed to fetch object or content type is missing");
    }

    return {
      stream: response.body as unknown as Readable,
      contentType: response.headers.get("content-type")!,
    };
  }

  async putObject(key: string, content: Buffer | string) {
    const response = await fetch(`https://api.vercel.com/v1/blob/upload?path=${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.authToken}` },
      body: content,
    });
    const data = await response.json();
    return data.url; // Return the blob URL
  }

  async deleteObject(blobId: string) {
    await fetch(`https://api.vercel.com/v1/blob/${blobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  async getUrl(key: string) {
    return `https://api.vercel.com/v1/blob/${key}`;
  }
}

let storage: StorageProvider;

switch (process.env.STORAGE_PROVIDER) {
  case "aws":
  case "cloudflare":
    storage = new S3StorageProvider();
    break;
  case "vercel":
    storage = new VercelBlobStorageProvider();
    break;
  default:
    throw new Error(`Invalid STORAGE_PROVIDER ${process.env.STORAGE_PROVIDER} specified in environment variables`);
}

export default storage;



export async function processBase64Image(content: string): Promise<string> {
  const [mimePart, base64Image] = content.split(",");
  const mimeMatch = mimePart.match(/data:([a-zA-Z\/]+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
  const extension = Object.keys(MIME_TYPE).find((ext) => MIME_TYPE[ext] === mimeType) || ".png";
  const filename = `${uuidv4()}.${extension}`;
  const buffer = Buffer.from(base64Image, "base64");
  await storage.putObject(filename, buffer);
  return filename;
}

export const getLocalUrl = async (param?: string): Promise<string | undefined> => {
    if (!param) return undefined;
    if (param.startsWith('http')) {
        const res = await fetch(param)
        if (!res.ok) return undefined;
        const contentType = res.headers.get('Content-Type');
        if (!contentType) return undefined;
        const extension = EXTENSIONS[contentType];
        if (!extension) return undefined;
        const url = `${uuidv4()}.${extension}`;
        await storage.putObject(url, Buffer.from( await res.arrayBuffer() ))
        return url;
    } else if (param.startsWith('data:image')){
        return  await processBase64Image(param)
    } else return param;
};

export const getRemoteUrl = async (param?: string): Promise<string | undefined> => {
    if (!param) return undefined;
    if (param.startsWith('http')) return param;
    return param.startsWith('data:image')
      ? storage.getUrl(await processBase64Image(param))
      : storage.getUrl(param);
};
