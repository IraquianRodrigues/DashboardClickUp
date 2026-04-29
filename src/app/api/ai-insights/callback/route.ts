import { saveInsight } from "@/lib/insights-store";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Recursively search an object for the first long string value
 * (likely the AI-generated insights text)
 */
function findInsightsText(obj: unknown, minLength = 50): string | null {
  if (typeof obj === "string" && obj.trim().length >= minLength) {
    return obj.trim();
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findInsightsText(item, minLength);
      if (found) return found;
    }
  }
  if (obj && typeof obj === "object") {
    // Check known field names first
    const priorityKeys = ["insights", "message", "response", "text", "content", "result", "output", "answer", "data"];
    for (const key of priorityKeys) {
      if (key in obj) {
        const found = findInsightsText((obj as Record<string, unknown>)[key], minLength);
        if (found) return found;
      }
    }
    // Then check all other fields
    for (const [key, value] of Object.entries(obj)) {
      if (!priorityKeys.includes(key)) {
        const found = findInsightsText(value, minLength);
        if (found) return found;
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    const contentType = request.headers.get("content-type") || "";

    // Try to parse as JSON first, fall back to raw text
    if (contentType.includes("json")) {
      try {
        body = await request.json();
      } catch {
        body = await request.text();
      }
    } else {
      const rawText = await request.text();
      // Try JSON parse on raw text
      try {
        body = JSON.parse(rawText);
      } catch {
        body = rawText;
      }
    }

    // If body is directly a string (raw text response)
    let insights: string | null = null;
    if (typeof body === "string" && body.trim().length >= 10) {
      insights = body.trim();
    } else {
      // Deep search for insights text in the object
      insights = findInsightsText(body, 10);
    }

    if (!insights) {
      return NextResponse.json(
        {
          error: "No valid insights content received",
          received: typeof body === "object" && body ? Object.keys(body) : typeof body,
          hint: "Send a POST with JSON body containing an 'insights' field with the AI-generated text",
        },
        { status: 400 }
      );
    }

    // Extract metrics if available
    let metricsSummary = { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, blocked: 0 };
    if (body && typeof body === "object" && "metrics" in body) {
      metricsSummary = (body as Record<string, unknown>).metrics as typeof metricsSummary;
    }

    const now = new Date();

    saveInsight({
      date: now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      generatedAt: now.toISOString(),
      insights,
      metricsSummary,
    });

    return NextResponse.json({
      success: true,
      message: "Insights salvos com sucesso",
      savedAt: now.toISOString(),
      contentLength: insights.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
