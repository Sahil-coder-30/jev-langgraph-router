import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserQuota, consumeGame } from "@/lib/quota";

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
  const body = await req.json().catch(() => ({}));

  if (body.action === "consume_game") {
    const result = await consumeGame();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, quota: result.quota },
        { status: 429 }
      );
    }
    return NextResponse.json({ success: true, quota: result.quota });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
