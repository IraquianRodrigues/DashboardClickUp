const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "";

// Netlify serverless functions have a 10s (free) / 26s (pro) timeout.
// Limit pagination to avoid exceeding that.
const MAX_PAGES_PER_REQUEST = 20;
const FETCH_TIMEOUT_MS = 8_000;

export class GHLClientError extends Error {
  constructor(message: string, public statusCode: number, public endpoint: string) {
    super(message);
    this.name = "GHLClientError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) throw new GHLClientError("Missing GHL_API_KEY", 0, endpoint);

  const url = endpoint.startsWith("http") ? endpoint : `${GHL_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
    ...(options.headers as Record<string, string>),
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(url, { cache: "no-store", ...options, headers, signal: controller.signal }).finally(() => clearTimeout(timeout));

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "2") * 1000;
        await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter, 3000)));
        continue;
      }

      if ([502, 503, 504].includes(response.status) && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new GHLClientError(`GHL API error: ${response.status} — ${body}`, response.status, endpoint);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof GHLClientError) throw error;
      if (attempt === retries) throw new GHLClientError(`Failed after ${retries + 1} attempts: ${error}`, 0, endpoint);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw new GHLClientError("Unreachable", 0, endpoint);
}

// ---- Contacts ----

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  source: string;
  locationId: string;
  dateAdded: string;
  dateUpdated: string;
  city: string;
  state: string;
  country: string;
  companyName: string;
  customFields: Array<{ id: string; value: string }>;
}

export async function getContacts(locationId?: string, limit = 100, maxPages = MAX_PAGES_PER_REQUEST): Promise<{ contacts: GHLContact[]; total: number }> {
  const allContacts: GHLContact[] = [];
  let page = 1;
  const perPage = Math.min(limit, 100);
  
  while (page <= maxPages) {
    const sp = new URLSearchParams();
    sp.set("locationId", locationId || GHL_LOCATION_ID);
    sp.set("limit", String(perPage));
    sp.set("page", String(page));
    
    try {
      const data = await request<{ contacts: GHLContact[]; meta: { total: number; currentPage: number; nextPage: number; prevPage: number } }>(`/contacts/?${sp.toString()}`);
      allContacts.push(...data.contacts);
      if (data.contacts.length < perPage) break;
    } catch {
      break; // Return what we have so far on error
    }
    page++;
  }
  
  return { contacts: allContacts, total: allContacts.length };
}

export async function searchContacts(body: { locationId?: string; pageLimit?: number; query?: string }): Promise<{ contacts: GHLContact[]; total: number }> {
  return request<{ contacts: GHLContact[]; total: number }>("/contacts/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getContactById(contactId: string): Promise<GHLContact> {
  return request<GHLContact>(`/contacts/${contactId}`);
}

// ---- Tags ----

export interface GHLTag {
  id: string;
  name: string;
  locationId: string;
}

export async function getTags(): Promise<{ tags: GHLTag[] }> {
  return request<{ tags: GHLTag[] }>("/contacts/tags");
}

// ---- Opportunities ----

export interface GHLOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  assignedTo: string | null;
  monetaryValue: number;
  status: "open" | "won" | "lost" | string;
  source: string;
  locationId: string;
  dateAdded: string;
  dateUpdated: string;
  lastStatusChangeAt: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  locationId: string;
  stages: Array<{ id: string; name: string; type: string }>;
}

export async function getOpportunities(locationId?: string, status?: string, maxPages = MAX_PAGES_PER_REQUEST): Promise<{ opportunities: GHLOpportunity[] }> {
  const allOpps: GHLOpportunity[] = [];
  let page = 1;
  const limit = 100;
  
  while (page <= maxPages) {
    const sp = new URLSearchParams();
    sp.set("location_id", locationId || GHL_LOCATION_ID);
    if (status) sp.set("status", status);
    sp.set("limit", String(limit));
    sp.set("page", String(page));
    
    try {
      const data = await request<{ opportunities: GHLOpportunity[] }>(`/opportunities/search?${sp.toString()}`);
      allOpps.push(...data.opportunities);
      if (data.opportunities.length < limit) break;
    } catch {
      break; // Return what we have so far on error
    }
    page++;
  }
  
  return { opportunities: allOpps };
}

export async function getPipelines(locationId?: string): Promise<{ pipelines: GHLPipeline[] }> {
  const sp = new URLSearchParams();
  if (locationId || GHL_LOCATION_ID) sp.set("locationId", locationId || GHL_LOCATION_ID);
  return request<{ pipelines: GHLPipeline[] }>(`/opportunities/pipelines?${sp.toString()}`);
}

// ---- Conversations ----

export interface GHLConversation {
  id: string;
  contactId: string;
  locationId: string;
  lastMessageDate: string;
  unreadCount: number;
  type: string;
  status: string;
}

export async function getConversations(limit = 100): Promise<{ conversations: GHLConversation[]; total: number }> {
  const sp = new URLSearchParams();
  sp.set("limit", String(Math.min(limit, 100)));
  sp.set("locationId", GHL_LOCATION_ID);
  return request<{ conversations: GHLConversation[]; total: number }>(`/conversations/?${sp.toString()}`);
}

// ---- Calendar Events ----

export interface GHLCalendarEvent {
  id: string;
  calendarId: string;
  contactId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "no_show" | string;
  locationId: string;
}

export async function getCalendarEvents(locationId: string, startDate: string, endDate: string): Promise<{ events: GHLCalendarEvent[] }> {
  const sp = new URLSearchParams();
  sp.set("locationId", locationId || GHL_LOCATION_ID);
  sp.set("startDate", startDate);
  sp.set("endDate", endDate);
  return request<{ events: GHLCalendarEvent[] }>(`/calendar-events?${sp.toString()}`);
}

// ---- Campaigns ----

export interface GHLCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  locationId: string;
}

export async function getCampaigns(locationId?: string): Promise<{ campaigns: GHLCampaign[] }> {
  const sp = new URLSearchParams();
  if (locationId || GHL_LOCATION_ID) sp.set("locationId", locationId || GHL_LOCATION_ID);
  return request<{ campaigns: GHLCampaign[] }>(`/campaigns/?${sp.toString()}`);
}
