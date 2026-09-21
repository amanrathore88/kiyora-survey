import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  surveySessions,
  responses,
  responseAnswers,
  respondentContacts,
} from "@/lib/schema";
import { eq, count, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";

    // Get all completed sessions with answer count and contact info
    const sessionsData = await db
      .select()
      .from(surveySessions)
      .where(eq(surveySessions.status, "completed"))
      .orderBy(desc(surveySessions.completedAt));

    const result = [];

    for (const session of sessionsData) {
      // Count responses
      const [responseCounts] = await db
        .select({ total: count() })
        .from(responses)
        .where(eq(responses.sessionId, session.id));

      // Check archive status
      const archivedResponses = await db
        .select({ isArchived: responses.isArchived })
        .from(responses)
        .where(eq(responses.sessionId, session.id))
        .limit(1);

      const isArchived = archivedResponses.length > 0 && archivedResponses[0].isArchived;

      if (!includeArchived && isArchived) continue;

      // Get contact
      const contacts = await db
        .select()
        .from(respondentContacts)
        .where(eq(respondentContacts.sessionId, session.id))
        .limit(1);

      result.push({
        sessionId: session.id,
        submittedAt: session.completedAt,
        participantName: contacts[0]?.participantName || null,
        participantContact: contacts[0]?.participantContact || null,
        isArchived,
        answerCount: responseCounts?.total || 0,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching responses:", error);
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
    const { sessionId, archive } = await req.json();

    if (!sessionId || archive === undefined) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    await db
      .update(responses)
      .set({ isArchived: archive })
      .where(eq(responses.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating archive status:", error);
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
    const paramId = searchParams.get("sessionId");

    let sessionId: number | null = null;
    if (paramId) {
      sessionId = parseInt(paramId, 10);
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.sessionId) sessionId = parseInt(body.sessionId, 10);
    }

    if (!sessionId || isNaN(sessionId)) {
      return NextResponse.json(
        { error: "Invalid or missing sessionId parameter" },
        { status: 400 }
      );
    }

    // 1. Find all responses associated with this session
    const sessionResponses = await db
      .select({ id: responses.id })
      .from(responses)
      .where(eq(responses.sessionId, sessionId));

    const responseIds = sessionResponses.map((r) => r.id);

    // 2. Cascade delete response answers
    for (const rId of responseIds) {
      await db
        .delete(responseAnswers)
        .where(eq(responseAnswers.responseId, rId));
    }

    // 3. Delete responses
    await db.delete(responses).where(eq(responses.sessionId, sessionId));

    // 4. Delete respondent contacts
    await db
      .delete(respondentContacts)
      .where(eq(respondentContacts.sessionId, sessionId));

    // 5. Delete survey session (removes session token from Sessions list)
    await db.delete(surveySessions).where(eq(surveySessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: `Session #${sessionId} and all its response data were permanently deleted.`,
    });
  } catch (error) {
    console.error("Error deleting response and session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
