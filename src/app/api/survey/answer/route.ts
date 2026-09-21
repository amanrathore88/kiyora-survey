import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  responses,
  responseAnswers,
} from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCachedSurveyQuestions } from "@/lib/survey-cache";

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

    // 1. Get question from memory cache (0ms)
    const allQuestions = await getCachedSurveyQuestions();
    const question = allQuestions.find((q) => q.id === questionId);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 2. Validate session in 1 query
    const sessionRows = await db
      .select({ id: surveySessions.id })
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

    // 3. Validate min/max selections for checkbox
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

    // 4. Delete any existing response for this question in this session
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
      const existingIds = existingResponses.map((r) => r.id);
      await db
        .delete(responseAnswers)
        .where(inArray(responseAnswers.responseId, existingIds));
      await db.delete(responses).where(inArray(responses.id, existingIds));
    }

    // 5. Create response record
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

    // 6. Build batch answer records
    const answersToInsert: {
      responseId: number;
      questionId: number;
      optionId: number | null;
      otherText: string | null;
      freeText: string | null;
    }[] = [];

    if (question.questionType === "text") {
      answersToInsert.push({
        responseId: responseRecord.id,
        questionId: question.id,
        optionId: null,
        otherText: null,
        freeText: freeText || "",
      });
    } else if (Array.isArray(selectedOptionIds)) {
      for (const optionId of selectedOptionIds) {
        if (optionId === -1) {
          answersToInsert.push({
            responseId: responseRecord.id,
            questionId: question.id,
            optionId: null,
            otherText: otherText || "",
            freeText: null,
          });
        } else {
          answersToInsert.push({
            responseId: responseRecord.id,
            questionId: question.id,
            optionId: optionId,
            otherText: null,
            freeText: null,
          });
        }
      }
    }

    // 7. Insert answers in a single batch query AND update session in parallel
    const operations: Promise<unknown>[] = [
      db
        .update(surveySessions)
        .set({
          currentQuestionIndex: question.orderIndex,
          lastActivityAt: new Date().toISOString(),
        })
        .where(eq(surveySessions.id, session.id)),
    ];

    if (answersToInsert.length > 0) {
      operations.push(db.insert(responseAnswers).values(answersToInsert));
    }

    await Promise.all(operations);

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
