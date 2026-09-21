import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveySessions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Session token required" },
        { status: 400 }
      );
    }

    const sessionRows = await db
      .select()
      .from(surveySessions)
      .where(eq(surveySessions.sessionToken, token))
      .limit(1);

    if (!sessionRows.length) {
      return NextResponse.json(
        { valid: false, error: "Survey session not found" },
        { status: 404 }
      );
    }

    const session = sessionRows[0];

    if (session.status === "completed") {
      return NextResponse.json(
        {
          valid: false,
          status: "completed",
          error: "This survey has already been completed.",
        },
        { status: 400 }
      );
    }

    if (session.status === "abandoned") {
      return NextResponse.json(
        {
          valid: false,
          status: "abandoned",
          error: "This survey was abandoned and cannot be resumed.",
        },
        { status: 400 }
      );
    }

    const resumeIndex = Math.max(1, session.currentQuestionIndex || 1);

    return NextResponse.json({
      valid: true,
      status: "in_progress",
      sessionToken: session.sessionToken,
      currentQuestionIndex: resumeIndex,
      language: session.language || "en",
    });
  } catch (error) {
    console.error("Error checking resume session:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify resume session" },
      { status: 500 }
    );
  }
}
