import { verifySession } from "./auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await verifySession();
  if (!session) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { authorized: true as const, user: session };
}
