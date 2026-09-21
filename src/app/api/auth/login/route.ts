import { NextRequest, NextResponse } from "next/server";
import { authenticateLocal } from "@/lib/auth/passport";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await authenticateLocal(email, password);
    await createSession(user);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: error?.message || "Invalid credentials" },
      { status: 401 }
    );
  }
}
