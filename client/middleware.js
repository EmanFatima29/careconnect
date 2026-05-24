import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// ─── Role helpers (duplicated from roleUtils.js because
//     middleware runs in the Edge runtime and can't import
//     from src/ aliases) ──────────────────────────────────
function coerceRoles(roles) {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles.filter(Boolean).map(String);
  if (typeof roles === "string")
    return roles
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  return [];
}

function isAdminRole(roles) {
  return coerceRoles(roles)
    .map((r) => r.toLowerCase())
    .some((r) => r === "admin" || r === "superadmin");
}

// ─── Routes that require admin role ─────────────────────
const ADMIN_PREFIXES = ["/admin"];

function isAdminRoute(pathname) {
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ─── Middleware ─────────────────────────────────────────
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    // ── Admin route guard ───────────────────────────────
    if (isAdminRoute(pathname) && !isAdminRole(token?.roles)) {
      // Non-admin trying to access admin pages → redirect to dashboard
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true to allow (user has a token), false → signIn redirect
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

// Protect all authenticated routes; exclude auth API, static assets, and public pages
export const config = {
  matcher: [
    "/home/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/groups/:path*",
    "/prescriptions/:path*",
    "/monitoring/:path*",
    "/analytics/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/help/:path*",
    "/logout/:path*",
    "/calendar/:path*",
  ],
};
