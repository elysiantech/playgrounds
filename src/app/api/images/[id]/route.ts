import { prisma } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/aws"
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {  
  try {
    const id = (await params).id;
    const body = await req.json();

    const updatedImage = await prisma.image.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    return NextResponse.json({ error: `Failed to update image ${error}` }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {  
  try {
    const id = (await params).id;
    
    const image = await prisma.image.findUnique({ where: { id },});

    if (!image || !image.url) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    await deleteFromS3(image.url);
    // Delete the record from the database
    await prisma.image.delete({where: { id },});

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: `Failed to delete image: ${error}` }, { status: 500 });
  }
}