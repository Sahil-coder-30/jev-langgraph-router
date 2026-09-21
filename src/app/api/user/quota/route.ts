import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserQuota, consumeGame } from "@/lib/quota";
import { getSessionUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { GameHistory } from "@/models/GameHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const quota = await getCurrentUserQuota();
  if (!quota) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ quota });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  if (body.action === "consume_game") {
    const result = await consumeGame();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, quota: result.quota },
        { status: 429 }
      );
    }

    // Save Game History to MongoDB
    try {
      await connectDb();
      await GameHistory.create({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        winner: body.winner || "tie",
        difficulty: body.difficulty || "strategic",
        scores: body.scores,
        commentary: body.commentary,
      });
    } catch (histErr) {
      console.warn("[Game] Failed to record game history in DB:", histErr);
    }

    return NextResponse.json({ success: true, quota: result.quota });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
