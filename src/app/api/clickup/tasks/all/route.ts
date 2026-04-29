import { getClickUpClient } from "@/lib/clickup/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Increased timeout for large workspaces

export async function GET(request: NextRequest) {
  try {
    const client = getClickUpClient();
    const searchParams = request.nextUrl.searchParams;

    const params = {
      include_closed: searchParams.get("include_closed") === "true",
      subtasks: searchParams.get("subtasks") === "true",
      order_by: (searchParams.get("order_by") as "created" | "updated" | "due_date") || "updated",
      reverse: true,
      include_markdown_description: true,
      statuses: searchParams.getAll("statuses[]"),
      assignees: searchParams.getAll("assignees[]").map(Number),
      space_ids: searchParams.getAll("space_ids[]"),
      list_ids: searchParams.getAll("list_ids[]"),
      tags: searchParams.getAll("tags[]"),
    };

    // Fetch all pages (up to 20000 tasks) concurrently and spaces to attach space names
    const [tasks, spaces] = await Promise.all([
      client.getAllTasks(params, 200),
      client.getSpaces()
    ]);

    const spaceMap = new Map(spaces.map(s => [s.id, s.name]));
    for (const task of tasks) {
      if (task.space && spaceMap.has(task.space.id)) {
        (task.space as any).name = spaceMap.get(task.space.id);
      }
    }

    return NextResponse.json(tasks, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
