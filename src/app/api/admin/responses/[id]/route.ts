import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  responses,
  responseAnswers,
  questions,
  questionOptions,
  respondentContacts,
} from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/middleware";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const sessionId = parseInt(id, 10);

    const [session] = await db
      .select()
      .from(surveySessions)
      .where(eq(surveySessions.id, sessionId));

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Get contact
    const contactRows = await db
      .select()
      .from(respondentContacts)
      .where(eq(respondentContacts.sessionId, sessionId))
      .limit(1);

    // Get all responses for this session
    const sessionResponses = await db
      .select()
      .from(responses)
      .where(eq(responses.sessionId, sessionId))
      .orderBy(asc(responses.id));

    const isArchived =
      sessionResponses.length > 0 && sessionResponses[0].isArchived;

    // Build detailed answers
    const answersResult = [];

    for (const resp of sessionResponses) {
      // Get question info
      const [question] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, resp.questionId));

      if (!question) continue;

      // Get answer details
      const answerRows = await db
        .select()
        .from(responseAnswers)
        .where(eq(responseAnswers.responseId, resp.id));

      const selectedOptions: string[] = [];
      let otherText: string | null = null;
      let freeText: string | null = null;

      for (const ans of answerRows) {
        if (ans.optionId) {
          const [opt] = await db
            .select()
            .from(questionOptions)
            .where(eq(questionOptions.id, ans.optionId));
          if (opt) selectedOptions.push(opt.optionText);
        }
        if (ans.otherText) otherText = ans.otherText;
        if (ans.freeText) freeText = ans.freeText;
      }

      answersResult.push({
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        questionType: question.questionType,
        selectedOptions,
        otherText,
        freeText,
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      sessionToken: session.sessionToken,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      participantName: contactRows[0]?.participantName || null,
      participantContact: contactRows[0]?.participantContact || null,
      isArchived,
      answers: answersResult,
    });
  } catch (error) {
    console.error("Error fetching response detail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
