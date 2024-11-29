import { prisma } from "@/lib/prisma";
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
    
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: `Failed to delete image$ ${error}` }, { status: 500 });
  }
}