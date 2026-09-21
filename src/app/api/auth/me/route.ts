import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to retrieve session user:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
