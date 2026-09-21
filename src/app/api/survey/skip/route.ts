import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  responses,
  responseAnswers,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, questionId, currentIndex } = body;

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

    // If questionId provided, clear any previous answers for this question in this session
    if (questionId) {
      const existingResponses = await db
        .select({ id: responses.id })
        .from(responses)
        .where(
          and(
            eq(responses.sessionId, session.id),
            eq(responses.questionId, questionId)
          )
        );

      for (const existing of existingResponses) {
        await db
          .delete(responseAnswers)
          .where(eq(responseAnswers.responseId, existing.id));
        await db.delete(responses).where(eq(responses.id, existing.id));
      }
    }

    const questionIndexToSave =
      typeof currentIndex === "number" && currentIndex > 0
        ? currentIndex
        : session.currentQuestionIndex || 1;

    // Update session progress
    await db
      .update(surveySessions)
      .set({
        currentQuestionIndex: questionIndexToSave,
        lastActivityAt: new Date().toISOString(),
      })
      .where(eq(surveySessions.id, session.id));

    return NextResponse.json({
      success: true,
      skippedIndex: questionIndexToSave,
      nextIndex: questionIndexToSave + 1,
    });
  } catch (error) {
    console.error("Error skipping question:", error);
    return NextResponse.json(
      { error: "Failed to process skip action" },
      { status: 500 }
    );
  }
}
