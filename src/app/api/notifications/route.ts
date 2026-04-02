import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Email notification sender
  return NextResponse.json({ message: "Notifications not yet implemented" }, { status: 501 });
}
