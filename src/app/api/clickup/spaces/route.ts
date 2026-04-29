import { getClickUpClient } from "@/lib/clickup/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = getClickUpClient();
    const spaces = await client.getSpaces();
    return NextResponse.json({ spaces }, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
