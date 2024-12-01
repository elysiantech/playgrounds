import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Get the user's session
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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


export async function GET() {
  try {
    // Get the user's session
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all images for the authenticated user
    const images = await prisma.image.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}