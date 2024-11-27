import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const excludePaths = [
        '/api/auth',
        '/_next/static',
        '/_next/image',
        '/favicon.ico',
        '/signin',
        '/share',
    ];
    if (excludePaths.some(path => pathname.startsWith(path))||
        ['.png', '.svg'].some(path => pathname.endsWith(path))) {
        return NextResponse.next();
    }
    // check authentication status
    const session = await auth();
    if (!session){
        return NextResponse.redirect(new URL('/signin', request.url))
    }
    return NextResponse.next()
}

export const config = {
    // Don't invoke Middleware on some paths
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|signin).*)"],
};
