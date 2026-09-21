import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { PipelineHistory } from "@/models/PipelineHistory";
import { GameHistory } from "@/models/GameHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();

    const [prompts, games] = await Promise.all([
      PipelineHistory.find({
        $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      GameHistory.find({
        $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      history: {
        prompts,
        games,
      },
    });
  } catch (err: unknown) {
    console.error("Failed to fetch user history from MongoDB:", err);
    return NextResponse.json(
      { error: "Failed to fetch cloud history", history: { prompts: [], games: [] } },
      { status: 500 }
    );
  }
}
