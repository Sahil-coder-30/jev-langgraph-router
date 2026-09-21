import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCodeForUser } from "@/lib/auth/passport";
import { createSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { User } from "@/models/User";
import { AuthUser } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code_provided`);
  }

  try {
    const googleProfile = await exchangeGoogleCodeForUser(code, redirectUri);

    let sessionUser: AuthUser = googleProfile;

    try {
      await connectDb();
      let dbUser = await User.findOne({
        $or: [
          { googleId: googleProfile.id },
          { email: googleProfile.email.toLowerCase() },
        ],
      });

      if (dbUser) {
        dbUser.googleId = googleProfile.id;
        dbUser.name = googleProfile.name || dbUser.name;
        dbUser.avatarUrl = googleProfile.avatarUrl || dbUser.avatarUrl;
        dbUser.lastLoginAt = new Date();
        await dbUser.save();
      } else {
        dbUser = await User.create({
          googleId: googleProfile.id,
          email: googleProfile.email.toLowerCase(),
          name: googleProfile.name,
          avatarUrl: googleProfile.avatarUrl,
          provider: "google",
          allTimePromptQuota: 5,
          promptsUsed: 0,
          allTimeGameQuota: 5,
          gamesUsed: 0,
          lastLoginAt: new Date(),
        });
      }

      sessionUser = {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl,
        provider: "google",
        createdAt: dbUser.createdAt.getTime(),
      };
    } catch (dbErr) {
      console.error("[Auth Callback] MongoDB sync warning:", dbErr);
    }

    await createSession(sessionUser);

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
}
