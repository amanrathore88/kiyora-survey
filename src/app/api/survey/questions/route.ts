import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  responses,
  responseAnswers,
  questionOptions,
  questions,
} from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { shouldShowQuestion } from "@/lib/survey-engine";
import { getCachedSurveyQuestions } from "@/lib/survey-cache";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionToken = searchParams.get("sessionToken");
    const getAll = searchParams.get("all") === "true";
    const questionIndex = parseInt(
      searchParams.get("questionIndex") || "1",
      10
    );

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    // Get cached questions immediately (0ms from memory)
    const allActiveQuestions = await getCachedSurveyQuestions();
    const totalQuestions = allActiveQuestions.length;

    if (getAll) {
      return NextResponse.json({
        questions: allActiveQuestions,
        totalQuestions,
      });
    }

    // Get the requested question by orderIndex
    const question = allActiveQuestions.find(
      (q) => q.orderIndex === questionIndex
    );

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Fast path: if no conditional logic on this question, return immediately!
    if (!question.conditionalLogic) {
      return NextResponse.json({
        question,
        totalQuestions,
      });
    }

    // Only for conditional questions (e.g. Q11): verify session & check previous answers in 1 query
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

    const sessionId = sessionRows[0].id;

    // Get answers for conditional evaluation
    const sessionAnswers = await db
      .select({
        questionNumber: questions.questionNumber,
        optionText: questionOptions.optionText,
        otherText: responseAnswers.otherText,
        freeText: responseAnswers.freeText,
      })
      .from(responses)
      .innerJoin(questions, eq(responses.questionId, questions.id))
      .leftJoin(responseAnswers, eq(responses.id, responseAnswers.responseId))
      .leftJoin(questionOptions, eq(responseAnswers.optionId, questionOptions.id))
      .where(eq(responses.sessionId, sessionId));

    const answersMap: Record<
      string,
      { selectedOptions: string[]; otherText?: string; freeText?: string }
    > = {};

    for (const row of sessionAnswers) {
      const qNum = row.questionNumber;
      if (!answersMap[qNum]) {
        answersMap[qNum] = { selectedOptions: [] };
      }
      if (row.optionText) {
        answersMap[qNum].selectedOptions.push(row.optionText);
      }
      if (row.otherText) answersMap[qNum].otherText = row.otherText;
      if (row.freeText) answersMap[qNum].freeText = row.freeText;
    }

    // Evaluate conditional logic
    if (!shouldShowQuestion(question.conditionalLogic, answersMap)) {
      return NextResponse.json({ skip: true, nextIndex: questionIndex + 1 });
    }

    return NextResponse.json({
      question,
      totalQuestions,
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
