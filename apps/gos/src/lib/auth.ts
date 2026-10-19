import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "km_gos_session";
export const SESSION_ISSUER = "kholil-growth-os";
export const SESSION_AUDIENCE = "kholil-growth-os-admin";
const SESSION_SECONDS = 60 * 60 * 8;
const secret = process.env.AUTH_SECRET;
function key() {
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secret);
}
export type SessionPayload = { userId: string; email: string; username: string; role: string; sessionId: string; mustChangePassword: boolean };
export type SessionCreateInput = Omit<SessionPayload, "sessionId">;

export async function createSession(payload: SessionCreateInput) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await prisma.authSession.create({ data: { id: sessionId, userId: payload.userId, expiresAt } });
  try {
    const token = await new SignJWT({ email: payload.email, username: payload.username, mustChangePassword: payload.mustChangePassword })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(payload.userId)
      .setIssuer(SESSION_ISSUER)
      .setAudience(SESSION_AUDIENCE)
      .setJti(sessionId)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(key());
    const jar = await cookies();
    jar.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: SESSION_SECONDS,
    });
  } catch (error) {
    await prisma.authSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}

export async function getSession(options: { allowPasswordChange?: boolean } = {}): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { issuer: SESSION_ISSUER, audience: SESSION_AUDIENCE, algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string") return null;
    const session = await prisma.authSession.findUnique({
      where: { id: payload.jti },
      include: { user: { select: { id: true, email: true, username: true, role: true, mustChangePassword: true } } },
    });
    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) return null;
    if (session.user.mustChangePassword && !options.allowPasswordChange) return null;
    return {
      userId: session.user.id, email: session.user.email, username: session.user.username,
      role: session.user.role, sessionId: session.id, mustChangePassword: session.user.mustChangePassword,
    };
  } catch { return null; }
}

export async function requireSession(options: { allowPasswordChange?: boolean } = {}) {
  const session = await getSession(options);
  if (!session) redirect("/login");
  return session;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key(), { issuer: SESSION_ISSUER, audience: SESSION_AUDIENCE, algorithms: ["HS256"] });
      if (typeof payload.jti === "string") {
        await prisma.authSession.updateMany({ where: { id: payload.jti, revokedAt: null }, data: { revokedAt: new Date() } });
      }
    } catch { /* Always clear an invalid or expired cookie. */ }
  }
  jar.delete(SESSION_COOKIE_NAME);
}
