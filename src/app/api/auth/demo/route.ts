import { NextResponse } from "next/server";
import { authenticateLocal } from "@/lib/auth/passport";
import { createSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await authenticateLocal("admin@langgraph.ai", "password123");
    await createSession(user);
    return NextResponse.redirect(new URL("/", req.url));
  } catch (err) {
    console.error("Demo auth error:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
