import { getClickUpClient } from "@/lib/clickup/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const client = getClickUpClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "0");

    const params = {
      page,
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
      date_updated_gt: searchParams.get("date_updated_gt") ? parseInt(searchParams.get("date_updated_gt")!) : undefined,
    };

    // Only fetch tasks — spaces are fetched ONCE by the client separately
    const result = await client.getFilteredTeamTasks(params);

    return NextResponse.json({
      tasks: result.tasks,
      lastPage: result.lastPage,
    }, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
