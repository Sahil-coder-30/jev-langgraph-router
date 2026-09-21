import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCodeForUser } from "@/lib/auth/passport";
import { createSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code_provided`);
  }

  try {
    const user = await exchangeGoogleCodeForUser(code, redirectUri);
    await createSession(user);

    return NextResponse.redirect(`${origin}/?login=success`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }
}
