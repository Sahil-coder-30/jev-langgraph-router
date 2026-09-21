import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSessionUser } from "./auth/session";
import { connectDb } from "./db";
import { User } from "@/models/User";

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

// Memory fallback store
const memoryQuotaStore = new Map<string, { promptsUsed: number; gamesUsed: number }>();

/**
 * Retrieve the current authenticated user's quota state from MongoDB
 * with signed-cookie and memory fallback.
 */
export async function getCurrentUserQuota(): Promise<UserQuota | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  let promptsUsed = 0;
  let gamesUsed = 0;
  let maxPrompts = MAX_PROMPTS;
  let maxGames = MAX_GAMES;

  // 1. Try MongoDB first (Primary persistent source of truth)
  try {
    await connectDb();
    const query = sessionUser.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: sessionUser.id }
      : { email: sessionUser.email.toLowerCase() };

    let dbUser = await User.findOne(query);

    if (!dbUser) {
      // Create user record in DB if not yet created
      dbUser = await User.create({
        email: sessionUser.email.toLowerCase(),
        name: sessionUser.name,
        avatarUrl: sessionUser.avatarUrl,
        provider: sessionUser.provider,
        allTimePromptQuota: MAX_PROMPTS,
        promptsUsed: 0,
        allTimeGameQuota: MAX_GAMES,
        gamesUsed: 0,
      });
    }

    promptsUsed = dbUser.promptsUsed ?? 0;
    gamesUsed = dbUser.gamesUsed ?? 0;
    maxPrompts = dbUser.allTimePromptQuota || MAX_PROMPTS;
    maxGames = dbUser.allTimeGameQuota || MAX_GAMES;
  } catch (dbErr) {
    console.warn("[Quota] MongoDB read error, falling back to signed cookie:", dbErr);

    // 2. Cookie Fallback
    const cookieStore = await cookies();
    const token = cookieStore.get(QUOTA_COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        if (payload.userId === sessionUser.id) {
          promptsUsed = (payload.promptsUsed as number) || 0;
          gamesUsed = (payload.gamesUsed as number) || 0;
        }
      } catch {
        // Invalid token
      }
    }

    const mem = memoryQuotaStore.get(sessionUser.id);
    if (mem) {
      promptsUsed = Math.max(promptsUsed, mem.promptsUsed);
      gamesUsed = Math.max(gamesUsed, mem.gamesUsed);
    }
  }

  return {
    userId: sessionUser.id,
    promptsUsed,
    promptsRemaining: Math.max(0, maxPrompts - promptsUsed),
    gamesUsed,
    gamesRemaining: Math.max(0, maxGames - gamesUsed),
    maxPrompts,
    maxGames,
  };
}

/**
 * Save updated quota into signed cookie & memory mirror.
 */
async function saveQuotaMirror(userId: string, promptsUsed: number, gamesUsed: number): Promise<void> {
  memoryQuotaStore.set(userId, { promptsUsed, gamesUsed });

  try {
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
  } catch {
    // Non-fatal if cookie setting fails in read contexts
  }
}

/**
 * Attempt to consume 1 prompt execution in MongoDB.
 * Atomic check: guarantees user cannot exceed allTimePromptQuota.
 */
export async function consumePrompt(): Promise<{
  success: boolean;
  quota?: UserQuota;
  error?: string;
}> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { success: false, error: "Authentication required" };
  }

  let updatedPromptsUsed = 0;
  let updatedGamesUsed = 0;
  let maxPrompts = MAX_PROMPTS;
  let maxGames = MAX_GAMES;

  try {
    await connectDb();
    const query = sessionUser.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: sessionUser.id }
      : { email: sessionUser.email.toLowerCase() };

    // Atomic increment only if promptsUsed < allTimePromptQuota
    const dbUser = await User.findOneAndUpdate(
      {
        ...query,
        promptsUsed: { $lt: MAX_PROMPTS },
      },
      {
        $inc: { promptsUsed: 1 },
      },
      { new: true }
    );

    if (!dbUser) {
      // Check current state to provide accurate remaining count
      const existingUser = await User.findOne(query);
      const used = existingUser?.promptsUsed ?? MAX_PROMPTS;
      const gUsed = existingUser?.gamesUsed ?? 0;
      return {
        success: false,
        quota: {
          userId: sessionUser.id,
          promptsUsed: used,
          promptsRemaining: 0,
          gamesUsed: gUsed,
          gamesRemaining: Math.max(0, MAX_GAMES - gUsed),
          maxPrompts: MAX_PROMPTS,
          maxGames: MAX_GAMES,
        },
        error: `Prompt quota exceeded. You have used all ${MAX_PROMPTS} allowed prompt executions.`,
      };
    }

    updatedPromptsUsed = dbUser.promptsUsed;
    updatedGamesUsed = dbUser.gamesUsed;
    maxPrompts = dbUser.allTimePromptQuota || MAX_PROMPTS;
    maxGames = dbUser.allTimeGameQuota || MAX_GAMES;
  } catch (dbErr) {
    console.warn("[Quota] MongoDB write failed, using local quota store:", dbErr);

    // Fallback if DB is unreachable
    const current = await getCurrentUserQuota();
    if (!current || current.promptsRemaining <= 0) {
      return {
        success: false,
        quota: current || undefined,
        error: `Prompt quota exceeded. You have used all ${MAX_PROMPTS} allowed prompt executions.`,
      };
    }
    updatedPromptsUsed = current.promptsUsed + 1;
    updatedGamesUsed = current.gamesUsed;
  }

  await saveQuotaMirror(sessionUser.id, updatedPromptsUsed, updatedGamesUsed);

  return {
    success: true,
    quota: {
      userId: sessionUser.id,
      promptsUsed: updatedPromptsUsed,
      promptsRemaining: Math.max(0, maxPrompts - updatedPromptsUsed),
      gamesUsed: updatedGamesUsed,
      gamesRemaining: Math.max(0, maxGames - updatedGamesUsed),
      maxPrompts,
      maxGames,
    },
  };
}

/**
 * Attempt to consume 1 game in Tic-Tac-Toe in MongoDB.
 * Atomic check: guarantees user cannot exceed allTimeGameQuota.
 */
export async function consumeGame(): Promise<{
  success: boolean;
  quota?: UserQuota;
  error?: string;
}> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { success: false, error: "Authentication required" };
  }

  let updatedPromptsUsed = 0;
  let updatedGamesUsed = 0;
  let maxPrompts = MAX_PROMPTS;
  let maxGames = MAX_GAMES;

  try {
    await connectDb();
    const query = sessionUser.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: sessionUser.id }
      : { email: sessionUser.email.toLowerCase() };

    const dbUser = await User.findOneAndUpdate(
      {
        ...query,
        gamesUsed: { $lt: MAX_GAMES },
      },
      {
        $inc: { gamesUsed: 1 },
      },
      { new: true }
    );

    if (!dbUser) {
      const existingUser = await User.findOne(query);
      const gUsed = existingUser?.gamesUsed ?? MAX_GAMES;
      const pUsed = existingUser?.promptsUsed ?? 0;
      return {
        success: false,
        quota: {
          userId: sessionUser.id,
          promptsUsed: pUsed,
          promptsRemaining: Math.max(0, MAX_PROMPTS - pUsed),
          gamesUsed: gUsed,
          gamesRemaining: 0,
          maxPrompts: MAX_PROMPTS,
          maxGames: MAX_GAMES,
        },
        error: `Match quota exceeded. You have played all ${MAX_GAMES} allowed Tic-Tac-Toe matches.`,
      };
    }

    updatedPromptsUsed = dbUser.promptsUsed;
    updatedGamesUsed = dbUser.gamesUsed;
    maxPrompts = dbUser.allTimePromptQuota || MAX_PROMPTS;
    maxGames = dbUser.allTimeGameQuota || MAX_GAMES;
  } catch (dbErr) {
    console.warn("[Quota] MongoDB write failed, using local quota store:", dbErr);

    const current = await getCurrentUserQuota();
    if (!current || current.gamesRemaining <= 0) {
      return {
        success: false,
        quota: current || undefined,
        error: `Match quota exceeded. You have played all ${MAX_GAMES} allowed Tic-Tac-Toe matches.`,
      };
    }
    updatedPromptsUsed = current.promptsUsed;
    updatedGamesUsed = current.gamesUsed + 1;
  }

  await saveQuotaMirror(sessionUser.id, updatedPromptsUsed, updatedGamesUsed);

  return {
    success: true,
    quota: {
      userId: sessionUser.id,
      promptsUsed: updatedPromptsUsed,
      promptsRemaining: Math.max(0, maxPrompts - updatedPromptsUsed),
      gamesUsed: updatedGamesUsed,
      gamesRemaining: Math.max(0, maxGames - updatedGamesUsed),
      maxPrompts,
      maxGames,
    },
  };
}
