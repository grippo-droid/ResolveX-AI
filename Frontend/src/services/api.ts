// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TicketPayload {
  title: string;
  description: string;
  category: string;
  submitted_by: string;
  image?: File | null;
}

export interface TicketAPIResponse {
  id: number;
  ticket_id?: string;
  title: string;
  description: string;
  category?: string;
  status: string;
  submitted_by?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;

  // AI Resolution fields
  solution?: string;
  suggested_fix?: string;
  confidence?: number;
  explanation?: string;
  decision?: string;
  intent?: string;
  processing_time?: number;
}

export interface TicketListAPIResponse {
  total: number;
  page: number;
  page_size: number;
  tickets: TicketAPIResponse[];
}

export interface TicketUpdatePayload {
  title?: string;
  description?: string;
  status?: string;
  assigned_to?: string;
  category?: string;
}

// ── Submit Ticket (POST /tickets) ──────────────────────────────────────────
// Creates ticket in DB + auto-triggers AI resolution pipeline
// Returns merged ticket + AI result in one response

export async function submitTicket(payload: TicketPayload): Promise<TicketAPIResponse> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("category", payload.category);
  formData.append("submitted_by", payload.submitted_by);
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const res = await fetch(`${BASE_URL}/v1/tickets`, {
    method: "POST",
    body: formData,
    // ⚠️ No Content-Type — browser sets it automatically for FormData
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Get All Tickets (GET /tickets) ─────────────────────────────────────────
// Paginated list with optional status/category filters

export async function getTickets(
  page = 1,
  pageSize = 20,
  status?: string,
  category?: string,
): Promise<TicketListAPIResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ...(status && { status }),
    ...(category && { category }),
  });

  const res = await fetch(`${BASE_URL}/v1/tickets?${params}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Get Single Ticket (GET /tickets/:id) ───────────────────────────────────

export async function getTicketById(ticketId: number): Promise<TicketAPIResponse> {
  const res = await fetch(`${BASE_URL}/v1/tickets/${ticketId}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Update Ticket (PATCH /tickets/:id) ────────────────────────────────────

export async function updateTicket(
  ticketId: number,
  payload: TicketUpdatePayload,
): Promise<TicketAPIResponse> {
  const res = await fetch(`${BASE_URL}/v1/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Delete Ticket (DELETE /tickets/:id) ───────────────────────────────────

export async function deleteTicket(ticketId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/tickets/${ticketId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }
}

// ── Trigger AI Resolution (POST /resolve/:id) ─────────────────────────────
// Only needed if calling resolution separately (not used when submitTicket handles it)

export interface ResolutionAPIResponse {
  ticket_id: number;
  category?: string;
  solution?: string;
  confidence: number;
  auto_resolved: boolean;
  escalated_to_human: boolean;
  explanation?: string;
}

export async function resolveTicket(
  ticketId: number,
  force = false,
): Promise<ResolutionAPIResponse> {
  const res = await fetch(
    `${BASE_URL}/v1/resolve/${ticketId}?force=${force}`,
    { method: "POST" },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}
