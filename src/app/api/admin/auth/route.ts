import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/init-db";

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const { username: rawUsername, password } = await req.json();

    if (!rawUsername || !password) {
      return NextResponse.json(
        { success: false, error: "Missing username or password" },
        { status: 400 }
      );
    }

    const username = String(rawUsername).trim();

    // Query admin user case-insensitively for mobile keyboards (e.g. iPhone auto-capitalization)
    const allAdmins = await db.select().from(adminUsers);
    const adminUser = allAdmins.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, adminUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession(adminUser.id, adminUser.username);
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(adminUsers.id, adminUser.id));

    return NextResponse.json({
      success: true,
      token,
      user: {
        username: adminUser.username,
        displayName: adminUser.displayName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
