import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id;
        const image = await prisma.image.findUnique({ where: { id } });
        return NextResponse.json(image);
    } catch {
        return NextResponse.json({ error: "Image not found" },{ status: 404 });
    }
  }