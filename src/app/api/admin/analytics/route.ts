import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  responses,
  responseAnswers,
  questions,
  questionOptions,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/middleware";
import { calculateIntentShift } from "@/lib/survey-engine";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    // Find Q16 and Q23 question IDs
    const [q16] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.questionNumber, "Q16"));

    const [q23] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.questionNumber, "Q23"));

    if (!q16 || !q23) {
      return NextResponse.json({
        q16Distribution: {},
        q23Distribution: {},
        shifts: { upgraded: 0, downgraded: 0, same: 0 },
        perSession: [],
        totalCompleted: 0,
      });
    }

    // Get all completed sessions
    const completedSessions = await db
      .select()
      .from(surveySessions)
      .where(eq(surveySessions.status, "completed"));

    const q16Distribution: Record<string, number> = {};
    const q23Distribution: Record<string, number> = {};
    const shifts = { upgraded: 0, downgraded: 0, same: 0 };
    const perSession: {
      sessionId: number;
      q16Answer: string | null;
      q23Answer: string | null;
      shift: string;
    }[] = [];

    for (const session of completedSessions) {
      // Check if session is archived
      const archivedCheck = await db
        .select({ isArchived: responses.isArchived })
        .from(responses)
        .where(eq(responses.sessionId, session.id))
        .limit(1);

      if (archivedCheck.length > 0 && archivedCheck[0].isArchived) continue;

      // Get Q16 answer
      let q16Answer: string | null = null;
      const q16Response = await db
        .select({ id: responses.id })
        .from(responses)
        .where(
          and(
            eq(responses.sessionId, session.id),
            eq(responses.questionId, q16.id)
          )
        )
        .limit(1);

      if (q16Response.length > 0) {
        const q16Answers = await db
          .select({ optionId: responseAnswers.optionId })
          .from(responseAnswers)
          .where(eq(responseAnswers.responseId, q16Response[0].id));

        if (q16Answers.length > 0 && q16Answers[0].optionId) {
          const [opt] = await db
            .select({ optionText: questionOptions.optionText })
            .from(questionOptions)
            .where(eq(questionOptions.id, q16Answers[0].optionId));
          q16Answer = opt?.optionText || null;
        }
      }

      // Get Q23 answer
      let q23Answer: string | null = null;
      const q23Response = await db
        .select({ id: responses.id })
        .from(responses)
        .where(
          and(
            eq(responses.sessionId, session.id),
            eq(responses.questionId, q23.id)
          )
        )
        .limit(1);

      if (q23Response.length > 0) {
        const q23Answers = await db
          .select({ optionId: responseAnswers.optionId })
          .from(responseAnswers)
          .where(eq(responseAnswers.responseId, q23Response[0].id));

        if (q23Answers.length > 0 && q23Answers[0].optionId) {
          const [opt] = await db
            .select({ optionText: questionOptions.optionText })
            .from(questionOptions)
            .where(eq(questionOptions.id, q23Answers[0].optionId));
          q23Answer = opt?.optionText || null;
        }
      }

      // Calculate distributions
      if (q16Answer) {
        q16Distribution[q16Answer] = (q16Distribution[q16Answer] || 0) + 1;
      }
      if (q23Answer) {
        q23Distribution[q23Answer] = (q23Distribution[q23Answer] || 0) + 1;
      }

      // Calculate shift
      let shift: "upgraded" | "downgraded" | "same" | "incomplete" =
        "incomplete";
      if (q16Answer && q23Answer) {
        shift = calculateIntentShift(q16Answer, q23Answer);
        shifts[shift]++;
      }

      perSession.push({
        sessionId: session.id,
        q16Answer,
        q23Answer,
        shift,
      });
    }

    return NextResponse.json({
      q16Distribution,
      q23Distribution,
      shifts,
      perSession,
      totalCompleted: completedSessions.length,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
