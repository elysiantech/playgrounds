import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const images = await prisma.image.findMany({
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