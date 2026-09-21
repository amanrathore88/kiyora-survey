import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { generateCSV } from "@/lib/csv-export";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "all") as
      | "all"
      | "active"
      | "archived";
    const status = searchParams.get("status") || "completed";

    const csv = await generateCSV({
      archiveFilter: filter,
      status: status,
    });

    const timestamp = new Date().toISOString().split("T")[0];
    const filterSuffix = filter !== "all" ? `-${filter}` : "";
    const filename = `kiyora-survey-responses${filterSuffix}-${timestamp}.csv`;

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
