import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  questions,
  questionOptions,
  questionRevisions,
  responses,
  responseAnswers,
  sections,
} from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/middleware";
import { invalidateSurveyCache } from "@/lib/survey-cache";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const allSections = await db
      .select()
      .from(sections)
      .orderBy(asc(sections.orderIndex));

    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(asc(questions.orderIndex));

    const questionsWithMeta = await Promise.all(
      allQuestions.map(async (q) => {
        // Get active options
        const opts = await db
          .select()
          .from(questionOptions)
          .where(
            eq(questionOptions.questionId, q.id)
          )
          .orderBy(asc(questionOptions.orderIndex));

        // Filter active options
        const activeOpts = opts.filter((o) => o.isActive);

        // Check for responses
        const resps = await db
          .select({ id: responses.id })
          .from(responses)
          .where(eq(responses.questionId, q.id))
          .limit(1);

        // Count revisions
        const revs = await db
          .select({ id: questionRevisions.id })
          .from(questionRevisions)
          .where(eq(questionRevisions.questionId, q.id));

        // Get section info
        const section = allSections.find((s) => s.id === q.sectionId) || null;

        return {
          ...q,
          options: activeOpts,
          section,
          hasResponses: resps.length > 0,
          revisionCount: revs.length,
        };
      })
    );

    return NextResponse.json({
      questions: questionsWithMeta,
      sections: allSections,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const {
      sectionId,
      questionNumber,
      questionText,
      questionType, // "radio" (MCQ), "checkbox" (MSQ), "text"
      minSelections,
      maxSelections,
      hasOtherOption,
      options = [],
    } = body;

    if (!questionText || !questionType) {
      return NextResponse.json(
        { error: "Question text and type are required" },
        { status: 400 }
      );
    }

    // Determine next orderIndex
    const allQuestions = await db
      .select({ orderIndex: questions.orderIndex })
      .from(questions)
      .orderBy(asc(questions.orderIndex));
    const nextOrderIndex =
      allQuestions.length > 0
        ? Math.max(...allQuestions.map((q) => q.orderIndex)) + 1
        : 1;

    // Determine section
    let targetSectionId = sectionId;
    if (!targetSectionId) {
      const [firstSection] = await db.select({ id: sections.id }).from(sections).limit(1);
      targetSectionId = firstSection?.id || 1;
    }

    // Insert question
    const [newQuestion] = await db
      .insert(questions)
      .values({
        sectionId: targetSectionId,
        questionNumber: questionNumber || `Q${nextOrderIndex}`,
        orderIndex: nextOrderIndex,
        questionText: questionText.trim(),
        questionType,
        minSelections: questionType === "checkbox" ? (minSelections ? Number(minSelections) : null) : null,
        maxSelections: questionType === "checkbox" ? (maxSelections ? Number(maxSelections) : null) : null,
        hasOtherOption: !!hasOtherOption,
        isActive: true,
        currentRevision: 1,
      })
      .returning();

    // Create initial Revision 1 snapshot
    await db.insert(questionRevisions).values({
      questionId: newQuestion.id,
      revisionNumber: 1,
      questionText: questionText.trim(),
      questionType,
      optionsSnapshot: JSON.stringify(options || []),
      changedBy: auth.user.username,
      changeReason: "Initial creation",
    });

    // Insert options if MCQ or MSQ
    if (questionType !== "text" && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const optText = String(options[i]).trim();
        if (optText) {
          await db.insert(questionOptions).values({
            questionId: newQuestion.id,
            optionText: optText,
            orderIndex: i + 1,
            isActive: true,
          });
        }
      }
    }

    invalidateSurveyCache();

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const {
      questionId,
      questionNumber,
      questionText,
      questionType,
      sectionId,
      minSelections,
      maxSelections,
      hasOtherOption,
      options,
      changeReason,
    } = await req.json();

    // Check if question has responses
    const resps = await db
      .select({ id: responses.id })
      .from(responses)
      .where(eq(responses.questionId, questionId))
      .limit(1);

    const hasResponses = resps.length > 0;

    const [currentQ] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId));

    if (!currentQ) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    let newRevision = currentQ.currentRevision;

    const cleanOptions = Array.isArray(options)
      ? options.map((o) => String(o).trim()).filter(Boolean)
      : [];

    const updatedMin =
      questionType === "checkbox"
        ? minSelections !== undefined && minSelections !== null
          ? Number(minSelections)
          : null
        : null;
    const updatedMax =
      questionType === "checkbox"
        ? maxSelections !== undefined && maxSelections !== null
          ? Number(maxSelections)
          : null
        : null;

    if (hasResponses) {
      // Create new revision — never destructively change historical data
      newRevision = currentQ.currentRevision + 1;

      await db.insert(questionRevisions).values({
        questionId,
        revisionNumber: newRevision,
        questionText: questionText.trim(),
        questionType,
        optionsSnapshot: JSON.stringify(cleanOptions),
        changedBy: auth.user.username,
        changeReason: changeReason || "Admin update",
      });

      await db
        .update(questions)
        .set({
          currentRevision: newRevision,
          questionNumber: questionNumber || currentQ.questionNumber,
          questionText: questionText.trim(),
          questionType,
          sectionId: sectionId || currentQ.sectionId,
          minSelections: updatedMin,
          maxSelections: updatedMax,
          hasOtherOption: hasOtherOption !== undefined ? !!hasOtherOption : currentQ.hasOtherOption,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(questions.id, questionId));
    } else {
      // No responses — update in place
      await db
        .update(questions)
        .set({
          questionNumber: questionNumber || currentQ.questionNumber,
          questionText: questionText.trim(),
          questionType,
          sectionId: sectionId || currentQ.sectionId,
          minSelections: updatedMin,
          maxSelections: updatedMax,
          hasOtherOption: hasOtherOption !== undefined ? !!hasOtherOption : currentQ.hasOtherOption,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(questions.id, questionId));

      // Update the revision 1 snapshot
      await db
        .update(questionRevisions)
        .set({
          questionText: questionText.trim(),
          questionType,
          optionsSnapshot: JSON.stringify(cleanOptions),
        })
        .where(eq(questionRevisions.questionId, questionId));
    }

    // Update options if provided for MCQ or MSQ
    if (questionType !== "text" && Array.isArray(options)) {
      // Deactivate old options
      await db
        .update(questionOptions)
        .set({ isActive: false })
        .where(eq(questionOptions.questionId, questionId));

      // Insert new options
      for (let i = 0; i < cleanOptions.length; i++) {
        await db.insert(questionOptions).values({
          questionId,
          optionText: cleanOptions[i],
          orderIndex: i + 1,
          isActive: true,
        });
      }
    }

    invalidateSurveyCache();

    return NextResponse.json({ success: true, newRevision });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { questionId, action, newOrderIndex } = await req.json();

    if (action === "deactivate") {
      await db
        .update(questions)
        .set({ isActive: false, updatedAt: new Date().toISOString() })
        .where(eq(questions.id, questionId));
    } else if (action === "reactivate") {
      await db
        .update(questions)
        .set({ isActive: true, updatedAt: new Date().toISOString() })
        .where(eq(questions.id, questionId));
    } else if (action === "reorder" && newOrderIndex !== undefined) {
      const [q] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId));
      const [other] = await db
        .select()
        .from(questions)
        .where(eq(questions.orderIndex, newOrderIndex));

      if (other) {
        await db
          .update(questions)
          .set({ orderIndex: q.orderIndex })
          .where(eq(questions.id, other.id));
      }
      await db
        .update(questions)
        .set({ orderIndex: newOrderIndex })
        .where(eq(questions.id, questionId));
    }

    invalidateSurveyCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error patching question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const paramId = searchParams.get("id") || searchParams.get("questionId");

    let body: { questionId?: number; id?: number } = {};
    try {
      body = await req.json();
    } catch {
      // url param fallback
    }

    const rawId = paramId || body.id || body.questionId;
    const questionId = rawId ? parseInt(String(rawId), 10) : NaN;

    if (!questionId || isNaN(questionId)) {
      return NextResponse.json(
        { error: "Valid questionId is required" },
        { status: 400 }
      );
    }

    const [existingQ] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId));

    if (!existingQ) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 1. Find all responses associated with this question
    const relatedResponses = await db
      .select({ id: responses.id })
      .from(responses)
      .where(eq(responses.questionId, questionId));

    const responseIds = relatedResponses.map((r) => r.id);

    // 2. Delete all response_answers referencing these responses or referencing this questionId
    for (const rId of responseIds) {
      await db
        .delete(responseAnswers)
        .where(eq(responseAnswers.responseId, rId));
    }
    await db
      .delete(responseAnswers)
      .where(eq(responseAnswers.questionId, questionId));

    // Also delete any response_answers referencing question_options belonging to this question
    const qOptions = await db
      .select({ id: questionOptions.id })
      .from(questionOptions)
      .where(eq(questionOptions.questionId, questionId));

    for (const opt of qOptions) {
      await db
        .delete(responseAnswers)
        .where(eq(responseAnswers.optionId, opt.id));
    }

    // 3. Delete responses for this question
    await db.delete(responses).where(eq(responses.questionId, questionId));

    // 4. Delete question options
    await db
      .delete(questionOptions)
      .where(eq(questionOptions.questionId, questionId));

    // 5. Delete question revisions
    await db
      .delete(questionRevisions)
      .where(eq(questionRevisions.questionId, questionId));

    // 6. Delete the question itself
    await db.delete(questions).where(eq(questions.id, questionId));

    // 7. Re-sequence orderIndex of all remaining questions so there are no gaps
    const remainingQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .orderBy(asc(questions.orderIndex), asc(questions.id));

    for (let i = 0; i < remainingQuestions.length; i++) {
      await db
        .update(questions)
        .set({ orderIndex: i + 1 })
        .where(eq(questions.id, remainingQuestions[i].id));
    }

    invalidateSurveyCache();

    return NextResponse.json({
      success: true,
      message: `Question ${existingQ.questionNumber} and all associated data deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
