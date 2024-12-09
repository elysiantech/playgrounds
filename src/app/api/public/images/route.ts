import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
  
    const images = await prisma.image.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      where: {
        user: {
          role: "ADMIN", // Filter by user's role
        },
        // bookmark: true, // Filter where bookmark is true
      },
      include: {
        user: true, // Optional: Include user data in the response
      },
    });
  
    return new Response(JSON.stringify(images), {
      headers: { 'Content-Type': 'application/json' },
    });
  }