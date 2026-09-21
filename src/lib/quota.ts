import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSessionUser } from "./auth/session";

export const MAX_PROMPTS = 5;
export const MAX_GAMES = 5;

const QUOTA_COOKIE_NAME = "quota_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "jev-autonomous-langgraph-secure-session-key-2026-fallback"
);

export interface UserQuota {
  userId: string;
  promptsUsed: number;
  promptsRemaining: number;
  gamesUsed: number;
  gamesRemaining: number;
  maxPrompts: number;
  maxGames: number;
}

// In-memory cache for fast lookups in same runtime instance
const memoryQuotaStore = new Map<string, { promptsUsed: number; gamesUsed: number }>();

/**
 * Retrieve the current authenticated user's quota state.
 */
export async function getCurrentUserQuota(): Promise<UserQuota | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(QUOTA_COOKIE_NAME)?.value;

  let promptsUsed = 0;
  let gamesUsed = 0;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      if (payload.userId === user.id) {
        promptsUsed = (payload.promptsUsed as number) || 0;
        gamesUsed = (payload.gamesUsed as number) || 0;
      }
    } catch {
      // Invalid/tampered token, reset to memory or defaults
    }
  }

  // Merge with memory store if memory has higher usage to prevent rollback
  const mem = memoryQuotaStore.get(user.id);
  if (mem) {
    promptsUsed = Math.max(promptsUsed, mem.promptsUsed);
    gamesUsed = Math.max(gamesUsed, mem.gamesUsed);
  }

  return {
    userId: user.id,
    promptsUsed,
    promptsRemaining: Math.max(0, MAX_PROMPTS - promptsUsed),
    gamesUsed,
    gamesRemaining: Math.max(0, MAX_GAMES - gamesUsed),
    maxPrompts: MAX_PROMPTS,
    maxGames: MAX_GAMES,
  };
}

/**
 * Save updated quota into memory and signed cookie.
 */
async function saveQuota(userId: string, promptsUsed: number, gamesUsed: number): Promise<void> {
  memoryQuotaStore.set(userId, { promptsUsed, gamesUsed });

  const token = await new SignJWT({
    userId,
    promptsUsed,
    gamesUsed,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(QUOTA_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Attempt to consume 1 prompt execution.
 * Returns success: false if quota is exhausted.
 */
export async function consumePrompt(): Promise<{
  success: boolean;
  quota?: UserQuota;
  error?: string;
}> {
  const current = await getCurrentUserQuota();
  if (!current) {
    return { success: false, error: "Authentication required" };
  }

  if (current.promptsRemaining <= 0) {
    return {
      success: false,
      quota: current,
      error: `Prompt quota exceeded. You have used all ${MAX_PROMPTS} allowed prompt executions.`,
    };
  }

  const newPromptsUsed = current.promptsUsed + 1;
  await saveQuota(current.userId, newPromptsUsed, current.gamesUsed);

  return {
    success: true,
    quota: {
      ...current,
      promptsUsed: newPromptsUsed,
      promptsRemaining: Math.max(0, MAX_PROMPTS - newPromptsUsed),
    },
  };
}

/**
 * Attempt to consume 1 game in Tic-Tac-Toe.
 * Returns success: false if quota is exhausted.
 */
export async function consumeGame(): Promise<{
  success: boolean;
  quota?: UserQuota;
  error?: string;
}> {
  const current = await getCurrentUserQuota();
  if (!current) {
    return { success: false, error: "Authentication required" };
  }

  if (current.gamesRemaining <= 0) {
    return {
      success: false,
      quota: current,
      error: `Match quota exceeded. You have played all ${MAX_GAMES} allowed Tic-Tac-Toe matches.`,
    };
  }

  const newGamesUsed = current.gamesUsed + 1;
  await saveQuota(current.userId, current.promptsUsed, newGamesUsed);

  return {
    success: true,
    quota: {
      ...current,
      gamesUsed: newGamesUsed,
      gamesRemaining: Math.max(0, MAX_GAMES - newGamesUsed),
    },
  };
}
