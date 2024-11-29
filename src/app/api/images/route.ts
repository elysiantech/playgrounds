import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      url,
      metadata,
      prompt,
      model,
      creativity,
      steps,
      seed,
      refImage,
      userId,
    } = body;

    // Validate required fields
    if (!url || !prompt || !model || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create image in the database
    const newImage = await prisma.image.create({
      data: {
        url,
        metadata,
        prompt,
        model,
        creativity,
        steps,
        seed,
        refImage,
        userId,
      },
    });

    return NextResponse.json(newImage);
  } catch (error) {
    console.error("Error creating image:", error);
    return NextResponse.json(
      { error: "Failed to create image" },
      { status: 500 }
    );
  }
}