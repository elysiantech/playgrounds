import { NextResponse } from "next/server";
import { downloadFromS3 } from '@/lib/aws'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const key = `${id}.html`;
    const htmlContent = await downloadFromS3(key);

    // Return the HTML content
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json({ error: `Internal Server Error ${error}` }, { status: 500 });
  }
}
