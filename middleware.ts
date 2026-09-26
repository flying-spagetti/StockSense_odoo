import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/session";

const PROTECTED_PATHS = [
  "/",
  "/products",
  "/operations",
  "/receipts",
  "/deliveries",
  "/transfers",
  "/adjustments",
  "/move-history",
  "/settings",
];

const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get("stocksense_session");
  const session = sessionCookie?.value ? await verifyToken(sessionCookie.value) : null;
  const isAuthenticated = Boolean(session);

  // If visiting login or signup while authenticated -> redirect to /
  if (isAuthenticated && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check if route is protected
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(path)),
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset files (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
