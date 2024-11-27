import { NextResponse } from "next/server";
import { generateAndUploadSharePage } from '@/lib/aws'

export async function POST(req: Request) {
    try {
      const body = await req.json();
  
      // Extract required fields from the request body
      const { imageUrl, redirectUrl, description } = body;
  
      // Validate input
      if (!imageUrl || !redirectUrl || !description) {
        return NextResponse.json(
          { error: "Missing required fields: imageUrl, redirectUrl, or description" },
          { status: 400 }
        );
      }
  
      // Generate the shareable link
      const result = await generateAndUploadSharePage({
        imageUrl,
        redirectUrl,
        description,
      });
  
      // Return the shareable link
      return NextResponse.json({ id: result, url: `${process.env.NEXTAUTH_URL}/share/${result}`, });
    } catch (error) {
      console.error("Error creating shareable link:", error);
      return NextResponse.json({ error: `Internal Server Error ${error}` }, { status: 500 });
    }
  }