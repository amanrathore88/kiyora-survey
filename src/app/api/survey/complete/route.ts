import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { surveySessions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 400 });
    }

    // Validate session
    const sessionRows = await db
      .select()
      .from(surveySessions)
      .where(and(eq(surveySessions.sessionToken, sessionToken), eq(surveySessions.status, 'in_progress')))
      .limit(1);

    if (!sessionRows.length) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 400 });
    }

    const session = sessionRows[0];

    // Complete session
    await db.update(surveySessions)
      .set({
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      .where(eq(surveySessions.id, session.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing survey:', error);
    return NextResponse.json({ error: 'Failed to complete survey' }, { status: 500 });
  }
}
