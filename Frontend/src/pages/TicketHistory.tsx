// Frontend/src/pages/TicketHistory.tsx
import { useState, useEffect, useCallback } from "react";
import { getTickets, type TicketAPIResponse } from "../services/api";
import { formatAIText } from "../utils/formatAIText";
import type { TicketHistoryEntry } from "./Simulation";

// ── Types ──────────────────────────────────────────────────────────────────
type Decision = "auto-resolved" | "human-review" | "escalated";

const DECISION_META = {
  "auto-resolved": { label: "Auto Resolved", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" },
  "human-review":  { label: "Under Review",  color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#b45309" },
  "escalated":     { label: "Escalated",     color: "#FF4D00", bg: "#fff7f5", border: "#ffd0c0", dot: "#FF4D00" },
};

const CATEGORY_ICONS: Record<string, string> = {
  access:   "🔐",
  hardware: "💻",
  software: "⚙️",
  network:  "🌐",
  security: "🛡️",
  other:    "📋",
};

const CATEGORY_LABELS: Record<string, string> = {
  access:   "Access & Permissions",
  hardware: "Hardware",
  software: "Software / App",
  network:  "Network / VPN",
  security: "Security",
  other:    "Other",
};

const HISTORY_KEY = "resolvex_ticket_history";

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function normalizeDecision(ticket: TicketAPIResponse): Decision {
  const val = (ticket.decision ?? ticket.status ?? "").toLowerCase().replace(/[-_]/g, "-");
  if (val.includes("auto-resolved") || val.includes("autoresolved")) return "auto-resolved";
  if (val.includes("escalated"))                                      return "escalated";
  return "human-review";
}

function getStatusColor(status: string): { color: string; bg: string } {
  const s = (status ?? "").toLowerCase().replace("_", "-");
  switch (s) {
    case "open":          return { color: "#2563eb", bg: "#eff6ff" };
    case "in-progress":   return { color: "#b45309", bg: "#fffbeb" };
    case "resolved":      return { color: "#15803d", bg: "#f0fdf4" };
    case "closed":        return { color: "#6B6B6B", bg: "#F5F5F5" };
    case "auto-resolved": return { color: "#15803d", bg: "#f0fdf4" };
    default:              return { color: "#6B6B6B", bg: "#F5F5F5" };
  }
}

// ── Read pending keys from localStorage ───────────────────────────────────
function readPendingKeys(): Set<string> {
  try {
    const stored: TicketHistoryEntry[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );
    return new Set(
      stored
        .filter(e => e.pending === true)
        .map(e => `${e.title.trim().toLowerCase()}||${e.user.trim().toLowerCase()}`)
    );
  } catch {
    return new Set();
  }
}

// ── Detail Drawer ──────────────────────────────────────────────────────────
function TicketDrawer({
  ticket,
  isPending,
  onClose,
}: {
  ticket:    TicketAPIResponse;
  isPending: boolean;
  onClose:   () => void;
}) {
  const decision    = normalizeDecision(ticket);
  const dec         = DECISION_META[decision];
  const statusStyle = getStatusColor(ticket.status ?? "open");

  // When pending, use a neutral header background
  const headerBg = isPending ? "#fafafa" : dec.bg;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[950px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="px-6 py-4 flex items-start justify-between border-b border-black/[0.07]"
          style={{ background: headerBg }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Unified Status badge */}
              {(() => {
                let badge = { label: "In Progress", color: "#b45309", border: "#fde68a", bg: "white" };
                if (decision === "auto-resolved" || ticket.status?.toLowerCase() === "closed" || ticket.status?.toLowerCase() === "resolved") badge = { label: "Closed", color: "#15803d", border: "#bbf7d0", bg: "white" };
                else if (decision === "escalated") badge = { label: "Escalated", color: "#FF4D00", border: "#ffd0c0", bg: "white" };
                
                return (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                    style={{ color: badge.color, borderColor: badge.border, background: badge.bg }}>
                    {badge.label}
                  </span>
                );
              })()}
              <span className="text-[11px] font-mono text-[#6B6B6B]">
                TKT-{String(ticket.id).padStart(5, "0")}
              </span>
            </div>
            <h3 className="text-[16px] font-extrabold text-[#0A0A0A] leading-snug max-w-[420px]">
              {ticket.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/[0.06] hover:bg-black/[0.1] flex items-center justify-center cursor-pointer border-none transition-all shrink-0 mt-0.5"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2l9 9M11 2l-9 9" stroke="#6B6B6B" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 84px)" }}>

          {/* ── PENDING: Processing banner replaces AI Decision banner ── */}
          {isPending ? (
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-[#fde68a] bg-[#fffbeb]">
              {/* Animated spinner */}
              <div className="relative w-10 h-10 shrink-0">
                <div className="absolute inset-0 rounded-full border-[3px] border-[#fde68a]" />
                <div
                  className="absolute inset-0 rounded-full border-[3px] border-transparent"
                  style={{ borderTopColor: "#b45309", animation: "spin 0.9s linear infinite" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#b45309] mb-0.5">
                  AI Processing
                </p>
                <p className="text-[14px] font-extrabold text-[#0A0A0A]">
                  Analysing your ticket…
                </p>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  The AI is reviewing this ticket. Decision will appear shortly.
                </p>
              </div>
              {/* Pulsing dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: "#b45309", animation: "pulse 1.4s ease-in-out infinite" }}
              />
            </div>
          ) : (
            /* ── RESOLVED: AI Decision Banner ── */
            (() => {
              let badge = { label: "In Progress", color: "#b45309", border: "#fde68a", bg: "#fffbeb" };
              if (decision === "auto-resolved" || ticket.status?.toLowerCase() === "closed" || ticket.status?.toLowerCase() === "resolved") badge = { label: "Closed", color: "#15803d", border: "#bbf7d0", bg: "#f0fdf4" };
              else if (decision === "escalated") badge = { label: "Escalated", color: "#FF4D00", border: "#ffd0c0", bg: "#fff7f5" };

              return (
                <div
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl border"
                  style={{ background: badge.bg, borderColor: badge.border }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: badge.color + "18", border: `1.5px solid ${badge.border}` }}
                  >
                    {(decision === "auto-resolved" || badge.label === "Closed") && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.5" stroke={badge.color} strokeWidth="1.4"/>
                        <path d="M5 8l2 2 4-4" stroke={badge.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {badge.label === "In Progress" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="6" r="2.5" stroke={badge.color} strokeWidth="1.4"/>
                        <path d="M3.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke={badge.color} strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    )}
                    {badge.label === "Escalated" && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2v7M8 11v1.5" stroke={badge.color} strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M3 13.5h10" stroke={badge.color} strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[1.2px] mb-0.5" style={{ color: badge.color }}>
                      AI Decision
                    </p>
                    <p className="text-[14px] font-extrabold text-[#0A0A0A]">{badge.label}</p>
                    {ticket.intent && (
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Intent: <span className="font-semibold text-[#0A0A0A]">{ticket.intent}</span>
                      </p>
                    )}
                  </div>
                  {ticket.processing_time && (
                    <span className="text-[10px] font-medium text-[#ABABAB] shrink-0">
                      {ticket.processing_time}ms
                    </span>
                  )}
                </div>
              );
            })()
          )}

          {/* Meta Grid (always visible) */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Submitted By", value: ticket.submitted_by || "—" },
              { label: "Category",     value: `${CATEGORY_ICONS[ticket.category ?? ""] ?? "📋"} ${CATEGORY_LABELS[ticket.category ?? ""] ?? ticket.category ?? "—"}` },
              { label: "Submitted",    value: ticket.created_at ? timeAgo(ticket.created_at) : "—" },
            ].map(item => (
              <div key={item.label} className="bg-[#F5F5F5] rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#ABABAB] mb-0.5">{item.label}</p>
                <p className="text-[12px] font-semibold text-[#0A0A0A]">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description (always visible) */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">Description</p>
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-[13px] text-[#3a3a3a] leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          {/* AI Suggested Resolution (only when not pending) */}
          {!isPending && (ticket.suggested_fix || ticket.solution) && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#0A0A0A] rounded-lg flex items-center justify-center shrink-0">
                  <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                    <path
                      d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2M2.9 2.9l1.4 1.4M8.7 8.7l1.4 1.4M2.9 10.1l1.4-1.4M8.7 4.3l1.4-1.4"
                      stroke="#E9E9E9" strokeWidth="1.3" strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">
                  Suggested Resolution
                </p>
              </div>
              <div className="bg-[#F5F5F5] rounded-xl p-4">
                {formatAIText(ticket.suggested_fix ?? ticket.solution ?? "")}
              </div>
            </div>
          )}

          {/* Footer timestamp (always visible) */}
          {ticket.created_at && (
            <p className="text-[11px] text-[#ABABAB] text-center">
              Submitted {formatDate(ticket.created_at)}
              {ticket.updated_at && ticket.updated_at !== ticket.created_at &&
                ` · Updated ${formatDate(ticket.updated_at)}`}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function TicketHistory() {
  const [tickets,    setTickets]    = useState<TicketAPIResponse[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [selected,   setSelected]  = useState<TicketAPIResponse | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState<string | null>(null);
  const [filter,     setFilter]    = useState<"all" | "in-progress" | "escalated" | "closed">("all");
  const [search,     setSearch]    = useState("");
  const [page,       setPage]      = useState(1);
  const [total,      setTotal]     = useState(0);
  const PAGE_SIZE = 20;

  // ── isPending ──────────────────────────────────────────────────────────
  const isPending = useCallback((ticket: TicketAPIResponse): boolean => {
    const backendDec = normalizeDecision(ticket);
    if (backendDec !== "human-review") return false;
    if (pendingIds.size === 0) return false;
    const key = `${ticket.title.trim().toLowerCase()}||${(ticket.submitted_by ?? "").trim().toLowerCase()}`;
    return pendingIds.has(key);
  }, [pendingIds]);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPendingIds(readPendingKeys());
      const data = await getTickets(page, PAGE_SIZE);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Poll localStorage every 1.5s ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const newKeys = readPendingKeys();
      setPendingIds(prev => {
        const wasResolved = [...prev].some(key => !newKeys.has(key));
        if (wasResolved) {
          getTickets(page, PAGE_SIZE)
            .then(data => {
              setTickets(data.tickets);
              setTotal(data.total);
            })
            .catch(() => {});
        }
        return newKeys;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [page]);

  // ── Unified status lookup helper ───────────────────────────────────────
  const getUnifiedStatusKey = useCallback((t: TicketAPIResponse) => {
    if (isPending(t)) return "in-progress";
    const dec = normalizeDecision(t);
    if (dec === "auto-resolved" || t.status?.toLowerCase() === "closed" || t.status?.toLowerCase() === "resolved") return "closed";
    if (dec === "escalated") return "escalated";
    return "in-progress";
  }, [isPending]);

  // ── Client-side filter + search ────────────────────────────────────────
  const filtered = tickets.filter(t => {
    const statusKey   = getUnifiedStatusKey(t);
    const matchFilter = filter === "all" || statusKey === filter;
    const matchSearch =
      !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.submitted_by ?? "").toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search);
    return matchFilter && matchSearch;
  });

  const counts = {
    all:        tickets.length,
    inProgress: tickets.filter(t => getUnifiedStatusKey(t) === "in-progress").length,
    escalated:  tickets.filter(t => getUnifiedStatusKey(t) === "escalated").length,
    closed:     tickets.filter(t => getUnifiedStatusKey(t) === "closed").length,
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-black/[0.06]" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{ borderTopColor: "#FF4D00", animation: "spin 0.8s linear infinite" }} />
      </div>
      <p className="text-[13px] text-[#6B6B6B]">Loading ticket history…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.5"/>
          <path d="M12 7v5M12 15v1" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[15px] font-bold text-[#0A0A0A] mb-1">Failed to load history</p>
        <p className="text-[13px] text-[#6B6B6B]">{error}</p>
      </div>
      <button onClick={fetchTickets}
        className="text-[13px] font-semibold text-white bg-[#FF4D00] px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[#e64400] transition-all">
        Retry
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{ opacity:0; transform:translateY(12px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes spin    { to{ transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{ opacity:1; } 50%{ opacity:0.35; } }
        .fade-up         { animation: fadeUp 0.4s ease both; }
        .row-hover:hover { background: rgba(255,77,0,0.025); }
        .pending-pulse   { animation: pulse 1.4s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col gap-5 fade-up">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-[13px] text-[#6B6B6B]">
              All tickets from database — {total} total
            </p>
          </div>
          <button onClick={fetchTickets}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6B6B6B] hover:text-[#0A0A0A] border border-black/10 px-3.5 py-2 rounded-xl bg-white transition-all cursor-pointer">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 3.18 1.32L11 5"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M11 2v3H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {tickets.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "all",          label: "Total",       color: "#0A0A0A", bg: "white",   count: counts.all        },
              { key: "in-progress",  label: "In Progress", color: "#b45309", bg: "#fffbeb", count: counts.inProgress },
              { key: "escalated",    label: "Escalated",   color: "#FF4D00", bg: "#fff7f5", count: counts.escalated  },
              { key: "closed",       label: "Closed",      color: "#15803d", bg: "#f0fdf4", count: counts.closed     },
            ].map(s => (
              <button key={s.key}
                onClick={() => { setFilter(s.key as typeof filter); setPage(1); }}
                className="flex flex-col gap-1 p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150"
                style={{
                  background:  filter === s.key ? s.bg    : "white",
                  borderColor: filter === s.key ? s.color + "44" : "rgba(10,10,10,0.08)",
                  boxShadow:   filter === s.key ? `0 0 0 1.5px ${s.color}33` : "none",
                }}>
                <span className="text-[26px] font-extrabold leading-none" style={{ color: s.color }}>
                  {s.count}
                </span>
                <span className="text-[12px] font-semibold text-[#6B6B6B]">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        {tickets.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search by title, name or ticket ID…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-white border border-black/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#0A0A0A] outline-none focus:border-[#FF4D00] transition-all placeholder:text-[#ABABAB]"
              />
            </div>
            {(search || filter !== "all") && (
              <button onClick={() => { setSearch(""); setFilter("all"); setPage(1); }}
                className="text-[12px] font-semibold text-[#6B6B6B] hover:text-[#FF4D00] bg-white border border-black/10 px-3 py-2.5 rounded-xl cursor-pointer transition-all">
                Clear
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-black/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#ABABAB]">
                <rect x="4" y="3" width="20" height="22" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 9h10M9 13h7M9 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-[#0A0A0A] mb-1">No tickets yet</p>
              <p className="text-[13px] text-[#6B6B6B]">
                Submit a ticket from the <strong>Simulation</strong> page and it will appear here.
              </p>
            </div>
          </div>
        )}

        {/* No Results */}
        {tickets.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[14px] font-semibold text-[#6B6B6B]">No tickets match your search.</p>
            <button onClick={() => { setSearch(""); setFilter("all"); setPage(1); }}
              className="text-[12px] font-semibold text-[#FF4D00] cursor-pointer bg-transparent border-none">
              Clear filters
            </button>
          </div>
        )}

        {/* Ticket Table */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden">

            {/* Table header — "Decision" renamed to "Status" */}
            <div className="grid grid-cols-[1fr_140px_130px_80px_28px] gap-4 px-5 py-3 border-b border-black/[0.06] bg-[#F9F9F9]">
              {["Ticket", "Category", "Status", "Time", ""].map(h => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#ABABAB]">{h}</span>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((ticket, i) => {
              const decision = normalizeDecision(ticket);
              const dec      = DECISION_META[decision];
              const pending  = isPending(ticket);

              return (
                <div key={ticket.id}
                  onClick={() => setSelected(ticket)}
                  className="row-hover grid grid-cols-[1fr_140px_130px_80px_28px] gap-4 px-5 py-4 items-center cursor-pointer transition-all duration-150"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(10,10,10,0.05)" : "none" }}>

                  {/* Title */}
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#ABABAB]">
                      TKT-{String(ticket.id).padStart(5, "0")}
                    </span>
                    <p className="text-[13px] font-semibold text-[#0A0A0A] truncate mt-0.5 hover:text-[#FF4D00] transition-colors">
                      {ticket.title}
                    </p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5 truncate">
                      {ticket.submitted_by || "—"}
                    </p>
                  </div>

                  {/* Category */}
                  <span className="text-[12px] text-[#6B6B6B] truncate">
                    {CATEGORY_ICONS[ticket.category ?? ""] ?? "📋"} {CATEGORY_LABELS[ticket.category ?? ""] ?? ticket.category ?? "—"}
                  </span>

                  {/* Status — unified visual */}
                  {(() => {
                    const statusKey = pending ? "in-progress" : 
                      (decision === "auto-resolved" || ticket.status?.toLowerCase() === "closed" || ticket.status?.toLowerCase() === "resolved") ? "closed" : 
                      (decision === "escalated" ? "escalated" : "in-progress");
                      
                    if (statusKey === "in-progress") {
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pending ? 'pending-pulse' : ''}`} style={{ background: "#b45309" }} />
                          <span className="text-[11px] font-semibold truncate" style={{ color: "#b45309" }}>
                            In Progress
                          </span>
                        </div>
                      );
                    }
                    if (statusKey === "escalated") {
                      return (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full w-fit" style={{ color: "#FF4D00", background: "#fff7f5" }}>
                          Escalated
                        </span>
                      );
                    }
                    return (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full w-fit" style={{ color: "#15803d", background: "#f0fdf4" }}>
                        Closed
                      </span>
                    );
                  })()}

                  {/* Time */}
                  <span className="text-[11px] text-[#ABABAB]">
                    {ticket.created_at ? timeAgo(ticket.created_at) : "—"}
                  </span>

                  {/* Chevron */}
                  <div className="flex items-center justify-center text-[#ABABAB]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-[12px] font-semibold px-4 py-2 rounded-xl border border-black/10 disabled:opacity-40 hover:bg-black/[0.04] transition-all cursor-pointer">
              ← Prev
            </button>
            <span className="text-[12px] text-[#6B6B6B]">
              Page {page} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}
              className="text-[12px] font-semibold px-4 py-2 rounded-xl border border-black/10 disabled:opacity-40 hover:bg-black/[0.04] transition-all cursor-pointer">
              Next →
            </button>
          </div>
        )}

      </div>

      {/* Detail Drawer */}
      {selected && (
        <TicketDrawer
          ticket={selected}
          isPending={isPending(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}