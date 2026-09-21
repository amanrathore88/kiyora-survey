import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  questions,
  responses,
  responseAnswers,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionToken,
      questionId,
      selectedOptionIds = [],
      otherText,
      freeText,
    } = body;

    if (!sessionToken || !questionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        { error: "Invalid or expired session" },
        { status: 400 }
      );
    }

    const session = sessionRows[0];

    // Validate question
    const questionRows = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!questionRows.length) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionRows[0];

    // Validate min/max selections for checkbox
    if (question.questionType === "checkbox" && Array.isArray(selectedOptionIds)) {
      const realSelections = selectedOptionIds.filter((id: number) => id !== -1);
      const count = realSelections.length + (selectedOptionIds.includes(-1) ? 1 : 0);

      if (question.minSelections && count < question.minSelections) {
        if (question.minSelections === question.maxSelections) {
          return NextResponse.json(
            { error: `Please select exactly ${question.minSelections} options` },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: `Please select at least ${question.minSelections} options` },
          { status: 400 }
        );
      }
      if (question.maxSelections && count > question.maxSelections) {
        return NextResponse.json(
          { error: `Please select at most ${question.maxSelections} options` },
          { status: 400 }
        );
      }
    }

    // Delete any existing response for this question in this session (for back navigation)
    const existingResponses = await db
      .select({ id: responses.id })
      .from(responses)
      .where(
        and(
          eq(responses.sessionId, session.id),
          eq(responses.questionId, question.id)
        )
      );

    if (existingResponses.length > 0) {
      for (const existing of existingResponses) {
        await db
          .delete(responseAnswers)
          .where(eq(responseAnswers.responseId, existing.id));
        await db.delete(responses).where(eq(responses.id, existing.id));
      }
    }

    // Create response record
    const [responseRecord] = await db
      .insert(responses)
      .values({
        sessionId: session.id,
        questionId: question.id,
        questionRevision: question.currentRevision,
        submittedAt: new Date().toISOString(),
        isArchived: false,
      })
      .returning();

    // Create response_answers
    if (question.questionType === "text") {
      // Text question — store freeText
      await db.insert(responseAnswers).values({
        responseId: responseRecord.id,
        questionId: question.id,
        optionId: null,
        otherText: null,
        freeText: freeText || "",
      });
    } else {
      // Radio or checkbox — store selected options
      for (const optionId of selectedOptionIds) {
        if (optionId === -1) {
          // "Other" option — store otherText
          await db.insert(responseAnswers).values({
            responseId: responseRecord.id,
            questionId: question.id,
            optionId: null,
            otherText: otherText || "",
            freeText: null,
          });
        } else {
          await db.insert(responseAnswers).values({
            responseId: responseRecord.id,
            questionId: question.id,
            optionId: optionId,
            otherText: null,
            freeText: null,
          });
        }
      }
    }

    // Update session progress
    await db
      .update(surveySessions)
      .set({
        currentQuestionIndex: question.orderIndex,
        lastActivityAt: new Date().toISOString(),
      })
      .where(eq(surveySessions.id, session.id));

    return NextResponse.json({
      success: true,
      nextIndex: question.orderIndex + 1,
    });
  } catch (error) {
    console.error("Error recording answer:", error);
    return NextResponse.json(
      { error: "Failed to record answer" },
      { status: 500 }
    );
  }
}
