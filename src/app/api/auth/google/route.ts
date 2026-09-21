import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/auth/passport";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const googleAuthUrl = getGoogleOAuthUrl(redirectUri);

  return NextResponse.redirect(googleAuthUrl);
}
