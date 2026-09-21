import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  surveySessions,
  responses,
  responseAnswers,
  respondentContacts,
} from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireAdmin } from '@/lib/middleware';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const sessions = await db.select().from(surveySessions);
    
    const totalSessions = sessions.length;
    let completedSessions = 0;
    let inProgressSessions = 0;
    let abandonedSessions = 0;
    
    sessions.forEach(s => {
      if (s.status === 'completed') completedSessions++;
      else if (s.status === 'in_progress') inProgressSessions++;
      else if (s.status === 'abandoned') abandonedSessions++;
    });

    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return NextResponse.json({
      sessions,
      dashboardStats: {
        totalSessions,
        completedSessions,
        inProgressSessions,
        abandonedSessions,
        completionRate
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { sessionId, action } = await req.json();

    if (action === 'abandon') {
      await db.update(surveySessions)
        .set({ status: 'abandoned' })
        .where(eq(surveySessions.id, sessionId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error patching session:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const paramId = searchParams.get('sessionId');
    const cleanupAbandoned = searchParams.get('cleanupAbandoned') === 'true';

    let body: { sessionId?: number; cleanupAbandoned?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // url param fallback
    }

    const targetSessionId = paramId ? parseInt(paramId, 10) : body.sessionId;
    const shouldCleanup = cleanupAbandoned || body.cleanupAbandoned;

    if (shouldCleanup) {
      // Purge all abandoned sessions
      const abandonedList = await db
        .select({ id: surveySessions.id })
        .from(surveySessions)
        .where(eq(surveySessions.status, 'abandoned'));

      const sIds = abandonedList.map(s => s.id);
      if (sIds.length > 0) {
        for (const sId of sIds) {
          const sessionResp = await db
            .select({ id: responses.id })
            .from(responses)
            .where(eq(responses.sessionId, sId));
          for (const r of sessionResp) {
            await db.delete(responseAnswers).where(eq(responseAnswers.responseId, r.id));
          }
          await db.delete(responses).where(eq(responses.sessionId, sId));
          await db.delete(respondentContacts).where(eq(respondentContacts.sessionId, sId));
          await db.delete(surveySessions).where(eq(surveySessions.id, sId));
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${sIds.length} abandoned sessions successfully.`,
      });
    }

    if (!targetSessionId || isNaN(targetSessionId)) {
      return NextResponse.json({ error: 'Missing or invalid sessionId' }, { status: 400 });
    }

    // Delete single session and its cascade data
    const sessionResp = await db
      .select({ id: responses.id })
      .from(responses)
      .where(eq(responses.sessionId, targetSessionId));

    for (const r of sessionResp) {
      await db.delete(responseAnswers).where(eq(responseAnswers.responseId, r.id));
    }
    await db.delete(responses).where(eq(responses.sessionId, targetSessionId));
    await db.delete(respondentContacts).where(eq(respondentContacts.sessionId, targetSessionId));
    await db.delete(surveySessions).where(eq(surveySessions.id, targetSessionId));

    return NextResponse.json({
      success: true,
      message: `Session #${targetSessionId} deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
