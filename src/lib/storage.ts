import { S3Client, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "stream";

const MIME_TYPE: { [key: string]: string } = {
  '.gif': 'image/gif',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.php': 'text/plain',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip'
};

export interface StorageProvider {
  getObject: (key: string) => Promise<{ stream: Readable; contentType: string }>;
  putObject: (key: string, content: Buffer | string) => Promise<void>;
  deleteObject: (key: string) => Promise<void>;
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
}

let storageProvider: StorageProvider;

switch (process.env.STORAGE_PROVIDER) {
  case "aws":
  case "cloudflare":
    storageProvider = new S3StorageProvider();
    break;
  case "vercel":
    storageProvider = new VercelBlobStorageProvider();
    break;
  default:
    throw new Error("Invalid STORAGE_PROVIDER specified in environment variables");
}

export default storageProvider;
