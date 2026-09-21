import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { surveySessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
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
