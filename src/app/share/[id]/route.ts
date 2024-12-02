import { NextResponse, NextRequest } from "next/server";
import sharp from "sharp";
import { readFromS3 } from '@/lib/aws'
import { Readable } from "stream";

export async function GET(req: NextRequest, { params }: {  params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const key = id.includes(".") ? id : `${id}.html`;
  const { searchParams } = new URL(req.url);
  const width = searchParams.get("width") ? parseInt(searchParams.get("width") || "0", 10) : null;
  const height = searchParams.get("height") ? parseInt(searchParams.get("height") || "0", 10) : null;

  try {
    const { stream, contentType } = await readFromS3(key);
    const headers =  {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable", // Cache forever for resized images
    }

    // If width or height is specified, resize the image using sharp
    if (width || height) {
      if (!contentType.startsWith("image/")) {
        throw new Error("Requested file is not an image");
      }

      const buffer = await streamToBuffer(stream);

      const resizedImage = await sharp(buffer)
        .resize(width || undefined, height || undefined) // Only resize dimensions provided
        .toBuffer();

      const etag = `"${key}-${width || "original"}-${height || "original"}"`;
      return new NextResponse(resizedImage, { headers: {...headers, "Etag":etag}});
    }

    return new NextResponse(stream as unknown as ReadableStream, { headers})
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}

// Utility to convert a ReadableStream to a Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
}