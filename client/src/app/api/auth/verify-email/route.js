import { NextResponse } from "next/server";

/**
 * GET /api/auth/verify-email?token=xxx
 * Proxies the verification to the backend and redirects to login with status.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing-token", request.url));
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(
      `${backendUrl}/api/users/verify-email?token=${encodeURIComponent(token)}`,
    );

    if (res.ok) {
      return NextResponse.redirect(
        new URL("/login?verified=true", request.url),
      );
    }

    const data = await res.json().catch(() => ({}));
    const errorMsg = encodeURIComponent(data.error || "Verification failed");
    return NextResponse.redirect(
      new URL(`/login?error=${errorMsg}`, request.url),
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL("/login?error=verification-failed", request.url),
    );
  }
}
