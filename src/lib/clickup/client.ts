import type {
  ClickUpTask,
  ClickUpSpace,
  ClickUpFolder,
  ClickUpList,
  ClickUpMember,
  ClickUpComment,
  GetTasksResponse,
  GetSpacesResponse,
  GetFoldersResponse,
  GetListsResponse,
  GetMembersResponse,
  GetCommentsResponse,
  TaskFilterParams,
} from "@/types/clickup";

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";
const RATE_LIMIT_MAX = 95;
const RATE_LIMIT_WINDOW_MS = 60_000;
const FETCH_TIMEOUT_MS = 8_000;

class RateLimiter {
  private timestamps: number[] = [];
  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (this.timestamps.length >= RATE_LIMIT_MAX) {
      const oldest = this.timestamps[0];
      const waitMs = RATE_LIMIT_WINDOW_MS - (now - oldest) + 100;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    this.timestamps.push(Date.now());
  }
}

export class ClickUpClientError extends Error {
  constructor(message: string, public statusCode: number, public endpoint: string) {
    super(message);
    this.name = "ClickUpClientError";
  }
}

export class ClickUpClient {
  private apiKey: string;
  private teamId: string;
  private rateLimiter = new RateLimiter();

  constructor(apiKey: string, teamId: string) {
    this.apiKey = apiKey;
    this.teamId = teamId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
    await this.rateLimiter.waitIfNeeded();
    const url = endpoint.startsWith("http") ? endpoint : `${CLICKUP_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: this.apiKey,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const response = await fetch(url, { cache: "no-store", ...options, headers, signal: controller.signal }).finally(() => clearTimeout(timeout));
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("retry-after") || "5") * 1000;
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        }
        // Retry on transient server errors (502, 503, 504)
        if ([502, 503, 504].includes(response.status) && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 2000));
          continue;
        }
        if (!response.ok) {
          const body = await response.text();
          throw new ClickUpClientError(`ClickUp API error: ${response.status} — ${body}`, response.status, endpoint);
        }
        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof ClickUpClientError) throw error;
        if (attempt === retries) {
          throw new ClickUpClientError(`Failed after ${retries + 1} attempts: ${error}`, 0, endpoint);
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    throw new ClickUpClientError("Unreachable", 0, endpoint);
  }

  async getSpaces(): Promise<ClickUpSpace[]> {
    const data = await this.request<GetSpacesResponse>(`/team/${this.teamId}/space?archived=false`);
    return data.spaces;
  }

  async getFolders(spaceId: string): Promise<ClickUpFolder[]> {
    const data = await this.request<GetFoldersResponse>(`/space/${spaceId}/folder?archived=false`);
    return data.folders;
  }

  async getLists(folderId: string): Promise<ClickUpList[]> {
    const data = await this.request<GetListsResponse>(`/folder/${folderId}/list?archived=false`);
    return data.lists;
  }

  async getFolderlessLists(spaceId: string): Promise<ClickUpList[]> {
    const data = await this.request<GetListsResponse>(`/space/${spaceId}/list?archived=false`);
    return data.lists;
  }

  async getAllLists(): Promise<ClickUpList[]> {
    const spaces = await this.getSpaces();
    const allLists: ClickUpList[] = [];
    for (const space of spaces) {
      const folderlessLists = await this.getFolderlessLists(space.id);
      allLists.push(...folderlessLists);
      const folders = await this.getFolders(space.id);
      for (const folder of folders) {
        allLists.push(...folder.lists);
      }
    }
    return allLists;
  }

  async getFilteredTeamTasks(params: TaskFilterParams = {}): Promise<{ tasks: ClickUpTask[]; lastPage: boolean }> {
    const sp = new URLSearchParams();
    if (params.page !== undefined) sp.set("page", String(params.page));
    if (params.order_by) sp.set("order_by", params.order_by);
    if (params.reverse) sp.set("reverse", "true");
    if (params.subtasks) sp.set("subtasks", "true");
    if (params.include_closed) sp.set("include_closed", "true");
    if (params.include_markdown_description) sp.set("include_markdown_description", "true");
    params.statuses?.forEach(s => sp.append("statuses[]", s));
    params.assignees?.forEach(a => sp.append("assignees[]", String(a)));
    params.tags?.forEach(t => sp.append("tags[]", t));
    params.space_ids?.forEach(id => sp.append("space_ids[]", id));
    params.list_ids?.forEach(id => sp.append("list_ids[]", id));
    if (params.due_date_gt) sp.set("due_date_gt", String(params.due_date_gt));
    if (params.due_date_lt) sp.set("due_date_lt", String(params.due_date_lt));
    if (params.date_created_gt) sp.set("date_created_gt", String(params.date_created_gt));
    if (params.date_updated_gt) sp.set("date_updated_gt", String(params.date_updated_gt));
    if (params.custom_fields) sp.set("custom_fields", JSON.stringify(params.custom_fields));

    const data = await this.request<GetTasksResponse>(`/team/${this.teamId}/task?${sp.toString()}`);
    return { tasks: data.tasks, lastPage: data.last_page };
  }

  async getAllTasks(params: Omit<TaskFilterParams, "page"> = {}, maxPages = 200): Promise<ClickUpTask[]> {
    const allTasks: ClickUpTask[] = [];
    const seenIds = new Set<string>();
    let page = 0;
    const BATCH_SIZE = 3;

    while (page < maxPages) {
      // Create a batch of concurrent requests
      const batchPages = [];
      for (let i = 0; i < BATCH_SIZE && (page + i) < maxPages; i++) {
        batchPages.push(page + i);
      }

      const results = await Promise.all(
        batchPages.map(p => this.getFilteredTeamTasks({ ...params, page: p }))
      );

      let shouldStop = false;
      for (const result of results) {
        for (const task of result.tasks) {
          if (!seenIds.has(task.id)) {
            seenIds.add(task.id);
            allTasks.push(task);
          }
        }
        if (result.lastPage || result.tasks.length === 0) {
          shouldStop = true;
        }
      }

      if (shouldStop) break;
      page += BATCH_SIZE;
    }

    return allTasks;
  }

  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}?include_subtasks=true&include_markdown_description=true`);
  }

  async updateTask(taskId: string, data: Record<string, unknown>): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}`, { method: "PUT", body: JSON.stringify(data) });
  }

  async getMembers(): Promise<ClickUpMember[]> {
    const data = await this.request<GetMembersResponse>(`/team/${this.teamId}`);
    return data.team.members;
  }

  async getTaskComments(taskId: string): Promise<ClickUpComment[]> {
    const data = await this.request<GetCommentsResponse>(`/task/${taskId}/comment`);
    return data.comments;
  }
}

let _client: ClickUpClient | null = null;
export function getClickUpClient(): ClickUpClient {
  if (!_client) {
    const apiKey = process.env.CLICKUP_API_KEY;
    const teamId = process.env.CLICKUP_TEAM_ID;
    if (!apiKey || !teamId) throw new Error("Missing CLICKUP_API_KEY or CLICKUP_TEAM_ID");
    _client = new ClickUpClient(apiKey, teamId);
  }
  return _client;
}
