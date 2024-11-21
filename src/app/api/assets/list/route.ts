import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
// import prisma from "@/utils/prisma";

export async function GET() {
    const session = await auth();
    const assets = undefined;
    console.log("User email:", session!.user?.email);
    return NextResponse.json(assets);
}

