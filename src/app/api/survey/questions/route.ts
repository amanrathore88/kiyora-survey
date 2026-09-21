import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  questions,
  questionOptions,
  sections,
  responses,
  responseAnswers,
} from "@/lib/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import {
  shouldShowQuestion,
  validateResearchSequence,
} from "@/lib/survey-engine";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionToken = searchParams.get("sessionToken");
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

    // Get total active questions
    const allActiveQuestions = await db
      .select({ id: questions.id, orderIndex: questions.orderIndex })
      .from(questions)
      .where(eq(questions.isActive, true))
      .orderBy(asc(questions.orderIndex));

    const totalQuestions = allActiveQuestions.length;

    // Get the requested question by orderIndex
    const questionRows = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.orderIndex, questionIndex),
          eq(questions.isActive, true)
        )
      )
      .limit(1);

    if (!questionRows.length) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questionRows[0];

    // Get previous answers for this session
    const prevResponses = await db
      .select()
      .from(responses)
      .where(eq(responses.sessionId, session.id));

    // Build answers map keyed by question number
    const answersMap: Record<
      string,
      { selectedOptions: string[]; otherText?: string; freeText?: string }
    > = {};

    if (prevResponses.length > 0) {
      const responseIds = prevResponses.map((r) => r.id);
      const questionIds = prevResponses.map((r) => r.questionId);

      // Get question numbers for answered questions
      const answeredQuestions = await db
        .select({
          id: questions.id,
          questionNumber: questions.questionNumber,
        })
        .from(questions)
        .where(inArray(questions.id, questionIds));

      const qIdToNumber: Record<number, string> = {};
      for (const q of answeredQuestions) {
        qIdToNumber[q.id] = q.questionNumber;
      }

      // Get all answers
      const allAnswers = await db
        .select({
          responseId: responseAnswers.responseId,
          questionId: responseAnswers.questionId,
          optionId: responseAnswers.optionId,
          otherText: responseAnswers.otherText,
          freeText: responseAnswers.freeText,
        })
        .from(responseAnswers)
        .where(inArray(responseAnswers.responseId, responseIds));

      // Get option texts
      const optionIds = allAnswers
        .filter((a) => a.optionId !== null)
        .map((a) => a.optionId as number);

      const optionTexts: Record<number, string> = {};
      if (optionIds.length > 0) {
        const optRows = await db
          .select({ id: questionOptions.id, optionText: questionOptions.optionText })
          .from(questionOptions)
          .where(inArray(questionOptions.id, optionIds));
        for (const o of optRows) {
          optionTexts[o.id] = o.optionText;
        }
      }

      // Build the map
      for (const ans of allAnswers) {
        const qNum = qIdToNumber[ans.questionId];
        if (!qNum) continue;
        if (!answersMap[qNum]) {
          answersMap[qNum] = { selectedOptions: [] };
        }
        if (ans.optionId && optionTexts[ans.optionId]) {
          answersMap[qNum].selectedOptions.push(optionTexts[ans.optionId]);
        }
        if (ans.otherText) answersMap[qNum].otherText = ans.otherText;
        if (ans.freeText) answersMap[qNum].freeText = ans.freeText;
      }
    }

    // Evaluate conditional logic
    if (!shouldShowQuestion(question.conditionalLogic, answersMap)) {
      return NextResponse.json({ skip: true, nextIndex: questionIndex + 1 });
    }

    // Validate research sequence
    const answeredOrders = prevResponses.map((r) => {
      const q = allActiveQuestions.find((aq) => aq.id === r.questionId);
      return q ? q.orderIndex : 0;
    });

    const seqValidation = validateResearchSequence(
      question.orderIndex,
      answeredOrders
    );
    if (!seqValidation.valid) {
      return NextResponse.json(
        { error: seqValidation.error },
        { status: 400 }
      );
    }

    // Get options for this question
    const opts = await db
      .select()
      .from(questionOptions)
      .where(
        and(
          eq(questionOptions.questionId, question.id),
          eq(questionOptions.isActive, true)
        )
      )
      .orderBy(asc(questionOptions.orderIndex));

    // Get section info
    const sectionRows = await db
      .select()
      .from(sections)
      .where(eq(sections.id, question.sectionId))
      .limit(1);

    return NextResponse.json({
      question: {
        ...question,
        options: opts,
        section: sectionRows[0] || null,
      },
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
