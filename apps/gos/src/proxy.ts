import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "km_gos_session";
const ISSUER = "kholil-growth-os";
const AUDIENCE = "kholil-growth-os-admin";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const loginUrl = new URL("/login", request.url);
  if (!token) return NextResponse.redirect(loginUrl);
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { issuer: ISSUER, audience: AUDIENCE, algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string") throw new Error("Invalid session claims");
    const path = request.nextUrl.pathname;
    if (payload.mustChangePassword === true && path !== "/settings") {
      return NextResponse.redirect(new URL("/settings?forcePassword=1", request.url));
    }
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

// APIs return JSON 401/403 responses from their own authorization guards instead of HTML redirects.
export const config = { matcher: ["/((?!login|api/|_next/static|_next/image|favicon.ico).*)"] };
