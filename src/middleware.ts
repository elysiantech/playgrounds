import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const excludePaths = [
        '/_next/static',
        '/_next/image',
        '/favicon.ico',
        '/auth/signin',
        '/share',
        '/images',
        '/api/auth',
        '/api/ai/callback',
        '/api/public',
    ];
    
    if (pathname === '/' || 
        excludePaths.some(path => pathname.startsWith(path)) ||
        ['.png', '.svg'].some(path => pathname.endsWith(path))) {
        return NextResponse.next();
    }
    // check authentication status
    const session = await auth();
    if (!session) {
        const { pathname, search } = request.nextUrl;
        const callbackUrl = `${request.nextUrl.origin}${pathname}${search}`;
        return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url));
    }
    
    return NextResponse.next()
}

export const config = {
    // Don't invoke Middleware on some paths
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|signin).*)"],
};
