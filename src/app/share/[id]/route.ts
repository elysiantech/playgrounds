import { NextResponse, NextRequest } from "next/server";

import { readFromS3 } from '@/lib/aws'

export async function GET(req: NextRequest, { params }: {  params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const key = id.includes(".") ? id : `${id}.html`;

  try {
    const { stream, contentType } = await readFromS3(key);
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
