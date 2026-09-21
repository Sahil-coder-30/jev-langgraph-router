import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AuthUser } from "./types";

const COOKIE_NAME = "auth_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "jev-autonomous-langgraph-secure-session-key-2026-fallback"
);

export async function createSession(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    createdAt: user.createdAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      avatarUrl: payload.avatarUrl as string | undefined,
      provider: payload.provider as "google" | "local",
      createdAt: (payload.createdAt as number) || Date.now(),
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
