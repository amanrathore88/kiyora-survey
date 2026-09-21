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

    // Validate session
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
    const dropoffIndex =
      typeof currentIndex === "number" && currentIndex > 0
        ? currentIndex
        : session.currentQuestionIndex || 1;

    // Mark session as abandoned
    await db
      .update(surveySessions)
      .set({
        status: "abandoned",
        currentQuestionIndex: dropoffIndex,
        lastActivityAt: new Date().toISOString(),
      })
      .where(eq(surveySessions.id, session.id));

    return NextResponse.json({
      success: true,
      message: "Survey session marked as abandoned",
      dropoffQuestionIndex: dropoffIndex,
    });
  } catch (error) {
    console.error("Error abandoning survey:", error);
    return NextResponse.json(
      { error: "Failed to mark survey as abandoned" },
      { status: 500 }
    );
  }
}
