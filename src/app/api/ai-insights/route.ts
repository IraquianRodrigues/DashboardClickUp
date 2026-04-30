import { getLatestInsight, getInsightHistory } from "@/lib/insights-store";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const history = searchParams.get("history") === "true";

    if (history) {
      const limit = parseInt(searchParams.get("limit") || "7");
      const insights = getInsightHistory(limit);
      return NextResponse.json({ insights });
    }

    const latest = getLatestInsight();

    if (!latest) {
      return NextResponse.json({
        available: false,
        message: "Nenhum insight disponível ainda. Clique em 'Gerar Insights' ou aguarde o relatório diário das 17:30.",
      });
    }

    return NextResponse.json({
      available: true,
      ...latest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
