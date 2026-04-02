import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Stripe Connect webhook handler
  return NextResponse.json({ received: true });
}
