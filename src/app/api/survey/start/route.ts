import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveys,
  surveySessions,
  questions,
  questionOptions,
  sections,
} from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";
    const sessionToken = uuidv4();

    let language = "en";
    try {
      const body = await req.json();
      if (body?.language === "hi") {
        language = "hi";
      }
    } catch {
      // Empty body fallback
    }

    // Get active survey
    const activeSurvey = await db
      .select({ id: surveys.id })
      .from(surveys)
      .where(eq(surveys.isActive, true))
      .limit(1);

    const surveyId = activeSurvey.length > 0 ? activeSurvey[0].id : 1;

    // Create session
    await db.insert(surveySessions).values({
      sessionToken,
      surveyId,
      status: "in_progress",
      language,
      currentQuestionIndex: 0,
      ipAddress: ip,
      userAgent: userAgent,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    });

    // Get total active questions
    const allActiveQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.isActive, true));

    const totalQuestions = allActiveQuestions.length;

    // Get first question (orderIndex = 1)
    const firstQuestionRows = await db
      .select()
      .from(questions)
      .where(and(eq(questions.orderIndex, 1), eq(questions.isActive, true)))
      .limit(1);

    if (!firstQuestionRows.length) {
      return NextResponse.json(
        { error: "No active questions found" },
        { status: 404 }
      );
    }

    const firstQuestion = firstQuestionRows[0];

    // Get options
    const opts = await db
      .select()
      .from(questionOptions)
      .where(
        and(
          eq(questionOptions.questionId, firstQuestion.id),
          eq(questionOptions.isActive, true)
        )
      )
      .orderBy(asc(questionOptions.orderIndex));

    // Get section
    const sectionRows = await db
      .select()
      .from(sections)
      .where(eq(sections.id, firstQuestion.sectionId))
      .limit(1);

    return NextResponse.json({
      sessionToken,
      question: {
        ...firstQuestion,
        options: opts,
        section: sectionRows[0] || null,
      },
      totalQuestions,
    });
  } catch (error) {
    console.error("Error starting survey:", error);
    return NextResponse.json(
      { error: "Failed to start survey" },
      { status: 500 }
    );
  }
}
