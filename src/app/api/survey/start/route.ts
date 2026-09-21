import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveySessions } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { ensureDatabaseReady } from "@/lib/init-db";
import { getCachedSurveyQuestions } from "@/lib/survey-cache";

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
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

    // Run session creation and questions retrieval in parallel
    const [allQuestions] = await Promise.all([
      getCachedSurveyQuestions(),
      db.insert(surveySessions).values({
        sessionToken,
        surveyId: 1,
        status: "in_progress",
        language,
        currentQuestionIndex: 0,
        ipAddress: ip,
        userAgent: userAgent,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      }),
    ]);

    if (!allQuestions.length) {
      return NextResponse.json(
        { error: "No active questions found" },
        { status: 404 }
      );
    }

    const firstQuestion =
      allQuestions.find((q) => q.orderIndex === 1) || allQuestions[0];

    return NextResponse.json({
      sessionToken,
      question: firstQuestion,
      questions: allQuestions,
      totalQuestions: allQuestions.length,
    });
  } catch (error) {
    console.error("Error starting survey:", error);
    return NextResponse.json(
      { error: "Failed to start survey" },
      { status: 500 }
    );
  }
}
