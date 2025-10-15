import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
 
export function middleware(request: NextRequest) {
  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};