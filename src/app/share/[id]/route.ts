import { NextResponse, NextRequest } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import storage  from '@/lib/storage'
import { Readable } from "stream";

export async function GET(req: NextRequest, { params }: {  params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!id.includes(".")) {
    try {
      const htmlContent = await generateSharePage(id);
      return new NextResponse(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      console.error("Error generating share page:", error);
      return new NextResponse("Error generating share page", { status: 500 });
    }
  }

  const key = id;
  const { searchParams } = new URL(req.url);
  const width = searchParams.get("width") ? parseInt(searchParams.get("width") || "0", 10) : null;
  const height = searchParams.get("height") ? parseInt(searchParams.get("height") || "0", 10) : null;

  try {
    const { stream, contentType } = await storage.getObject(key);
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

async function generateSharePage(id:string): Promise<string>{

  const image = await prisma.image.findUnique({where: { id },});
  if (!image || !image.url) {
    throw Error("Image not found");
  }
  const params = new URLSearchParams({
    prompt: image.prompt,
    model: image.model,
    creativity: image.creativity.toString(),
    steps: image.steps.toString(),
    seed: String(image.seed),
    numberOfImages: "1",
  }).toString();

  const description = "Image";
  const title = "Generated with AI Playgrounds"
  const redirectUrl = `${process.env.NEXTAUTH_URL}?${params}`
  const imageUrl = `${process.env.NEXTAUTH_URL}/share/${image.url}`;
  // Generate the HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${process.env.NEXTAUTH_URL}/share/${id}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
        <title>Redirecting...</title>
      </head>
      <body>
        <p>If you are not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
      </body>
    </html>
  `;
  return htmlContent
}
