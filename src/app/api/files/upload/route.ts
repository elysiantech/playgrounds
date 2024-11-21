import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
// import prisma from "@/utils/prisma";

export async function POST(request: NextRequest) {
    const file = await request.json()
    const session = await auth();
    console.log("User email:", session!.user?.email);
    return NextResponse.json({ success: true, file});
}