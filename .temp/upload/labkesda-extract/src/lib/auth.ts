import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Re-export shared constants for server-side usage
export { ROLE_MENU_ACCESS, ROLE_LABELS, hasAccess } from "./auth-shared";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "labkesda-garut-lis-secret-key-2026-change-me");
const COOKIE_NAME = "labkesda_session";
const SESSION_DURATION = 8 * 60 * 60; // 8 hours in seconds

export interface SessionPayload {
  userId: number;
  username: string;
  fullName: string;
  role: string;
  exp?: number;
}

export async function createSession(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION}s`)
    .setIssuedAt()
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
