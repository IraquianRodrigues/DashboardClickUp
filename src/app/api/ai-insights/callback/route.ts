import { saveInsight } from "@/lib/insights-store";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // GHL will send back the AI-generated insights
    const insights = body.insights || body.message || body.response || body.text || body.content || "";

    if (!insights || typeof insights !== "string" || insights.trim().length < 10) {
      return NextResponse.json(
        { error: "No valid insights content received", received: Object.keys(body) },
        { status: 400 }
      );
    }

    // Extract metrics if GHL sends them back, or use defaults
    const metricsSummary = body.metrics || {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      overdue: 0,
      blocked: 0,
    };

    const now = new Date();

    saveInsight({
      date: now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      generatedAt: now.toISOString(),
      insights: insights.trim(),
      metricsSummary,
    });

    return NextResponse.json({
      success: true,
      message: "Insights salvos com sucesso",
      savedAt: now.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
