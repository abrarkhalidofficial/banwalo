import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
 
export function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  
  // Allow public routes
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  // For now, allow all routes until Clerk is properly configured
  return NextResponse.next();
}
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};