import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { generateCSV } from "@/lib/csv-export";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const csv = await generateCSV();
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `kiyora-survey-responses-${timestamp}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
