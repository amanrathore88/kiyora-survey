import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveySessions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, currentIndex } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    // Validate session is active
    const sessionRows = await db
      .select()
      .from(surveySessions)
      .where(
        and(
          eq(surveySessions.sessionToken, sessionToken),
          eq(surveySessions.status, "in_progress")
        )
      )
      .limit(1);

    if (!sessionRows.length) {
      return NextResponse.json(
        { error: "Active session not found or already closed" },
        { status: 400 }
      );
    }

    const session = sessionRows[0];
    const questionIndexToSave =
      typeof currentIndex === "number" && currentIndex > 0
        ? currentIndex
        : session.currentQuestionIndex || 1;

    // Update session with current question index and timestamp
    await db
      .update(surveySessions)
      .set({
        currentQuestionIndex: questionIndexToSave,
        lastActivityAt: new Date().toISOString(),
      })
      .where(eq(surveySessions.id, session.id));

    return NextResponse.json({
      success: true,
      sessionToken,
      currentQuestionIndex: questionIndexToSave,
      message: "Survey session progress saved successfully",
    });
  } catch (error) {
    console.error("Error pausing survey:", error);
    return NextResponse.json(
      { error: "Failed to pause survey" },
      { status: 500 }
    );
  }
}
