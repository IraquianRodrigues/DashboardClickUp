// ============================================================
// ClickUp API v2 — Complete TypeScript Definitions
// ============================================================

// ---- Status ----
export interface ClickUpStatus {
  id?: string;
  status: string;
  color: string;
  type: "open" | "custom" | "closed" | "done" | string;
  orderindex: number;
}

// ---- Priority ----
export interface ClickUpPriority {
  id: string;
  priority: string; // "1" = urgent, "2" = high, "3" = normal, "4" = low
  color: string;
  orderindex: string;
}

export type PriorityLevel = "urgent" | "high" | "normal" | "low" | "none";

// ---- User / Member ----
export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string | null;
  profilePicture: string | null;
  initials?: string;
  role?: number;
}

export interface ClickUpMember {
  user: ClickUpUser;
  invited_by?: ClickUpUser;
}

// ---- Custom Field ----
export interface ClickUpCustomField {
  id: string;
  name: string;
  type: string; // "text", "number", "date", "drop_down", "labels", "url", etc.
  type_config: Record<string, unknown>;
  date_created?: string;
  hide_from_guests?: boolean;
  value?: unknown;
  required?: boolean;
}

// ---- Checklist ----
export interface ClickUpChecklistItem {
  id: string;
  name: string;
  orderindex: number;
  assignee: ClickUpUser | null;
  group_assignee: unknown;
  resolved: boolean;
  parent: string | null;
  date_created: string;
  children: ClickUpChecklistItem[];
}

export interface ClickUpChecklist {
  id: string;
  task_id: string;
  name: string;
  date_created: string;
  orderindex: number;
  creator: number;
  resolved: number;
  unresolved: number;
  items: ClickUpChecklistItem[];
}

// ---- Attachment ----
export interface ClickUpAttachment {
  id: string;
  date: string;
  title: string;
  type: number;
  source: number;
  version: number;
  extension: string;
  thumbnail_small: string | null;
  thumbnail_medium: string | null;
  thumbnail_large: string | null;
  is_folder: boolean | null;
  mimetype: string;
  hidden: boolean;
  parent_id: string;
  size: number;
  total_comments: number;
  resolved_comments: number;
  url: string;
  parent_comment_type: string | null;
  parent_comment_parent: string | null;
  email_data: unknown;
}

// ---- Comment ----
export interface ClickUpComment {
  id: string;
  comment: Array<{
    text: string;
    type?: string;
    attributes?: Record<string, unknown>;
  }>;
  comment_text: string;
  user: ClickUpUser;
  resolved: boolean;
  assignee: ClickUpUser | null;
  assigned_by: ClickUpUser | null;
  reactions: unknown[];
  date: string;
}

// ---- Tag ----
export interface ClickUpTag {
  name: string;
  tag_fg: string;
  tag_bg: string;
  creator?: number;
}

// ---- Task ----
export interface ClickUpTask {
  id: string;
  custom_id: string | null;
  name: string;
  text_content: string | null;
  description: string | null;
  markdown_description?: string | null;
  status: ClickUpStatus;
  orderindex: string;
  date_created: string; // Unix ms
  date_updated: string; // Unix ms
  date_closed: string | null;
  date_done: string | null;
  archived: boolean;
  creator: ClickUpUser;
  assignees: ClickUpUser[];
  watchers?: ClickUpUser[];
  checklists: ClickUpChecklist[];
  tags: ClickUpTag[];
  parent: string | null;
  priority: {
    id: string;
    priority: string;
    color: string;
    orderindex: string;
  } | null;
  due_date: string | null; // Unix ms
  start_date: string | null; // Unix ms
  points: number | null;
  time_estimate: number | null; // ms
  time_spent: number | null; // ms
  custom_fields: ClickUpCustomField[];
  dependencies: unknown[];
  linked_tasks: unknown[];
  team_id: string;
  url: string;
  sharing: {
    public: boolean;
    public_share_expires_on: string | null;
    public_fields: string[];
    token: string | null;
    seo_optimized: boolean;
  };
  permission_level?: string;
  list: {
    id: string;
    name: string;
    access: boolean;
  };
  project: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  folder: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  space: {
    id: string;
    name?: string;
  };
  subtasks?: ClickUpTask[];
  attachments?: ClickUpAttachment[];
}

// ---- Space ----
export interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
  color: string | null;
  avatar: string | null;
  admin_can_manage: boolean | null;
  statuses: ClickUpStatus[];
  multiple_assignees: boolean;
  features: Record<string, { enabled: boolean }>;
  archived: boolean;
  members?: ClickUpMember[];
}

// ---- Folder ----
export interface ClickUpFolder {
  id: string;
  name: string;
  orderindex: number;
  override_statuses: boolean;
  hidden: boolean;
  space: { id: string; name: string; access: boolean };
  task_count: string;
  archived: boolean;
  statuses: ClickUpStatus[];
  lists: ClickUpList[];
  permission_level?: string;
}

// ---- List ----
export interface ClickUpList {
  id: string;
  name: string;
  orderindex: number;
  content: string;
  status: { status: string; color: string; hide_label: boolean };
  priority: { priority: string; color: string };
  assignee: ClickUpUser | null;
  task_count: number | null;
  due_date: string | null;
  start_date: string | null;
  folder: { id: string; name: string; hidden: boolean; access: boolean };
  space: { id: string; name: string; access: boolean };
  archived: boolean;
  override_statuses: boolean | null;
  statuses: ClickUpStatus[];
  permission_level?: string;
}

// ---- API Response Wrappers ----
export interface GetTasksResponse {
  tasks: ClickUpTask[];
  last_page: boolean;
}

export interface GetSpacesResponse {
  spaces: ClickUpSpace[];
}

export interface GetFoldersResponse {
  folders: ClickUpFolder[];
}

export interface GetListsResponse {
  lists: ClickUpList[];
}

export interface GetMembersResponse {
  members: ClickUpMember[];
}

export interface GetCommentsResponse {
  comments: ClickUpComment[];
}

// ---- Filter Parameters ----
export interface TaskFilterParams {
  page?: number;
  order_by?: "id" | "created" | "updated" | "due_date";
  reverse?: boolean;
  subtasks?: boolean;
  statuses?: string[];
  include_closed?: boolean;
  assignees?: number[];
  tags?: string[];
  due_date_gt?: number;
  due_date_lt?: number;
  date_created_gt?: number;
  date_created_lt?: number;
  date_updated_gt?: number;
  date_updated_lt?: number;
  custom_fields?: Array<{
    field_id: string;
    operator: string;
    value: string;
  }>;
  space_ids?: string[];
  list_ids?: string[];
  include_markdown_description?: boolean;
}

// ---- Dashboard Metrics ----
export interface DashboardMetrics {
  total: number;
  inProgress: number;
  pending: number;
  completed: number;
  overdue: number;
  blocked: number;
  byStatus: Record<string, { count: number; color: string }>;
  byAssignee: Record<
    string,
    {
      user: ClickUpUser;
      total: number;
      completed: number;
      inProgress: number;
      pending: number;
      overdue: number;
    }
  >;
  byClient: Record<
    string,
    {
      name: string;
      total: number;
      completed: number;
      overdue: number;
      responsible?: string;
    }
  >;
}

// ---- UI State ----
export interface TaskFiltersState {
  search: string;
  statuses: string[];
  priorities: string[];
  assignees: number[];
  clients: string[];
  listIds: string[];
  spaceIds: string[];
}

export const DEFAULT_FILTERS: TaskFiltersState = {
  search: "",
  statuses: [],
  priorities: [],
  assignees: [],
  clients: [],
  listIds: [],
  spaceIds: [],
};
