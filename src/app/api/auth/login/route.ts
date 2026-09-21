import { NextRequest, NextResponse } from "next/server";
import { authenticateLocal } from "@/lib/auth/passport";
import { createSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { User } from "@/models/User";
import { AuthUser } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const authResult = await authenticateLocal(email, password);
    let sessionUser: AuthUser = authResult;

    try {
      await connectDb();
      let dbUser = await User.findOne({ email: authResult.email.toLowerCase() });

      if (!dbUser) {
        dbUser = await User.create({
          email: authResult.email.toLowerCase(),
          name: authResult.name,
          avatarUrl: authResult.avatarUrl,
          provider: "local",
          passwordHash: password,
          allTimePromptQuota: 5,
          promptsUsed: 0,
          allTimeGameQuota: 5,
          gamesUsed: 0,
          lastLoginAt: new Date(),
        });
      } else {
        dbUser.lastLoginAt = new Date();
        await dbUser.save();
      }

      sessionUser = {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl,
        provider: "local",
        createdAt: dbUser.createdAt.getTime(),
      };
    } catch (dbErr) {
      console.error("[Login Route] MongoDB sync warning:", dbErr);
    }

    await createSession(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error: unknown) {
    console.error("Authentication error:", error);
    const message = error instanceof Error ? error.message : "Invalid credentials";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
