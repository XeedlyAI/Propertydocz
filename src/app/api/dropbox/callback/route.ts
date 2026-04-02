import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Dropbox OAuth callback
  return NextResponse.json({ message: "Dropbox OAuth not yet implemented" }, { status: 501 });
}
