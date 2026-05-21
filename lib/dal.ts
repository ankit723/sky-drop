import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "./session";
import prisma from "./prisma";

/**
 * Verify the current session. Redirects to /login if invalid.
 * Memoized per request via React.cache.
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const payload = await decrypt(session);

  if (!payload?.userId) {
    redirect("/login");
  }

  return {
    isAuth: true,
    userId: payload.userId,
    role: payload.role,
  };
});

/**
 * Get the current authenticated user from the database.
 * Memoized per request via React.cache.
 */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    console.error("Failed to fetch current user");
    return null;
  }
});

/**
 * Require a specific role. Redirects to the correct dashboard if wrong role.
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await verifySession();

  if (!allowedRoles.includes(session.role)) {
    // Redirect to the user's own dashboard
    const dashboardMap: Record<string, string> = {
      ADMIN: "/admin",
      OPERATOR: "/operator",
      CLIENT: "/client",
    };
    redirect(dashboardMap[session.role] || "/login");
  }

  return session;
}
