import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

// Public routes that don't require auth
const publicRoutes = ["/", "/login", "/signup", "/track"];
// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip API routes and static files
  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Decrypt session from cookie
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  // Check if this is an auth page (login/signup) and user is already authenticated
  if (authRoutes.includes(path) && session?.userId) {
    const dashboardMap: Record<string, string> = {
      ADMIN: "/admin",
      OPERATOR: "/operator",
      CLIENT: "/client",
    };
    return NextResponse.redirect(
      new URL(dashboardMap[session.role] || "/client", req.nextUrl)
    );
  }

  // Check if this is a public route
  const isPublicRoute =
    publicRoutes.includes(path) || path.startsWith("/track");
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes — redirect to login if not authenticated
  if (!session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Role-based route protection
  if (path.startsWith("/admin") && session.role !== "ADMIN") {
    const dashboardMap: Record<string, string> = {
      OPERATOR: "/operator",
      CLIENT: "/client",
    };
    return NextResponse.redirect(
      new URL(dashboardMap[session.role] || "/login", req.nextUrl)
    );
  }

  if (path.startsWith("/operator") && session.role !== "OPERATOR") {
    const dashboardMap: Record<string, string> = {
      ADMIN: "/admin",
      CLIENT: "/client",
    };
    return NextResponse.redirect(
      new URL(dashboardMap[session.role] || "/login", req.nextUrl)
    );
  }

  if (path.startsWith("/client") && session.role !== "CLIENT") {
    const dashboardMap: Record<string, string> = {
      ADMIN: "/admin",
      OPERATOR: "/operator",
    };
    return NextResponse.redirect(
      new URL(dashboardMap[session.role] || "/login", req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
