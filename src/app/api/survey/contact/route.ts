import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveySessions, respondentContacts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, participantName, participantContact } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    // Validate session is completed
    const sessionRows = await db
      .select()
      .from(surveySessions)
      .where(
        and(
          eq(surveySessions.sessionToken, sessionToken),
          eq(surveySessions.status, "completed")
        )
      )
      .limit(1);

    if (!sessionRows.length) {
      return NextResponse.json(
        { error: "Session not found or not completed" },
        { status: 400 }
      );
    }

    const session = sessionRows[0];

    // Check if contact already exists
    const existingContact = await db
      .select()
      .from(respondentContacts)
      .where(eq(respondentContacts.sessionId, session.id))
      .limit(1);

    if (existingContact.length > 0) {
      return NextResponse.json(
        { error: "Contact already provided for this session" },
        { status: 400 }
      );
    }

    // Create respondent contact
    await db.insert(respondentContacts).values({
      sessionId: session.id,
      participantName: participantName || null,
      participantContact: participantContact || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving contact info:", error);
    return NextResponse.json(
      { error: "Failed to save contact info" },
      { status: 500 }
    );
  }
}
