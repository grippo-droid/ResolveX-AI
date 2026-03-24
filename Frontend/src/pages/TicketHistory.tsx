import { useState, useEffect } from "react";
import type { TicketHistoryEntry } from "./Simulation";

const HISTORY_KEY = "resolvex_ticket_history";

const DECISION_META = {
  "auto-resolved": { label: "Auto Resolved", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" },
  "human-review":  { label: "Under Review",  color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#b45309" },
  "escalated":     { label: "Escalated",     color: "#FF4D00", bg: "#fff7f5", border: "#ffd0c0", dot: "#FF4D00" },
};

const PRIORITY_META: Record<string, { color: string; bg: string; border: string }> = {
  low:      { color: "#6B6B6B", bg: "#6B6B6B14", border: "#6B6B6B44" },
  medium:   { color: "#b45309", bg: "#b4530914", border: "#b4530944" },
  high:     { color: "#FF4D00", bg: "#FF4D0014", border: "#FF4D0044" },
  critical: { color: "#dc2626", bg: "#dc262614", border: "#dc262644" },
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

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ── Expandable detail drawer ───────────────────────────────────────────────
function TicketDrawer({ ticket, onClose }: { ticket: TicketHistoryEntry; onClose: () => void }) {
  const dec  = DECISION_META[ticket.decision];
  const pri  = PRIORITY_META[ticket.priority] ?? PRIORITY_META.low;
  const confColor = ticket.confidence >= 80 ? "#15803d" : ticket.confidence >= 55 ? "#b45309" : "#FF4D00";
  const radius = 40;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (ticket.confidence / 100) * circ;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-[580px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 flex items-start justify-between border-b border-black/[0.07]"
          style={{ background: dec.bg }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                style={{ color: dec.color, borderColor: dec.border, background: "white" }}>
                {dec.label}
              </span>
              <span className="text-[11px] font-mono text-[#6B6B6B]">{ticket.ticketId}</span>
            </div>
            <h3 className="text-[16px] font-extrabold text-[#0A0A0A] leading-snug max-w-[400px]">
              {ticket.title}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/[0.06] hover:bg-black/[0.1] flex items-center justify-center cursor-pointer border-none transition-all shrink-0 mt-0.5">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2l9 9M11 2l-9 9" stroke="#6B6B6B" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

          {/* Confidence + decision */}
          <div className="flex items-center gap-5 p-4 rounded-xl border"
            style={{ background: dec.bg, borderColor: dec.border }}>
            {/* Mini ring */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth="8"/>
                <circle cx="48" cy="48" r={radius} fill="none" stroke={confColor} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 1s ease" }}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold" style={{ color: confColor }}>{ticket.confidence}%</span>
                <span className="text-[9px] font-medium text-[#6B6B6B]">confidence</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1.2px] mb-1" style={{ color: dec.color }}>AI Decision</p>
              <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-1">{dec.label}</p>
              <p className="text-[11px] font-semibold text-[#6B6B6B]">
                Intent: <span className="text-[#0A0A0A]">{ticket.intent}</span>
              </p>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Processed in {ticket.processingTime}ms
              </p>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Submitted by", value: ticket.user || "—" },
              { label: "Department",   value: ticket.department || "—" },
              { label: "System",       value: ticket.system || "—" },
              { label: "Category",     value: `${CATEGORY_ICONS[ticket.category] ?? "📋"} ${CATEGORY_LABELS[ticket.category] ?? ticket.category}` },
              { label: "Priority",     value: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) },
              { label: "Screenshot",   value: ticket.hasImage ? "✓ Attached" : "None" },
            ].map(item => (
              <div key={item.label} className="bg-[#F5F5F5] rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#ABABAB] mb-0.5">{item.label}</p>
                <p className="text-[12px] font-semibold text-[#0A0A0A]">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">Description</p>
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-[13px] text-[#3a3a3a] leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          {/* Suggested fix */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#0A0A0A] rounded-lg flex items-center justify-center shrink-0">
                <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2M2.9 2.9l1.4 1.4M8.7 8.7l1.4 1.4M2.9 10.1l1.4-1.4M8.7 4.3l1.4-1.4"
                    stroke="#E9E9E9" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">Suggested Resolution</p>
            </div>
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-[13px] text-[#3a3a3a] leading-relaxed">{ticket.suggestedFix}</p>
            </div>
          </div>

          {/* Explainability */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-lg flex items-center justify-center shrink-0">
                <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#FF4D00" strokeWidth="1.3"/>
                  <path d="M6.5 4.5V7M6.5 9v.5" stroke="#FF4D00" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">Why this decision?</p>
              <span className="ml-auto text-[10px] font-semibold text-[#FF4D00] bg-[#FF4D00]/10 px-2 py-0.5 rounded-full">
                Explainable AI
              </span>
            </div>
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-[13px] text-[#3a3a3a] leading-relaxed">{ticket.explanation}</p>
            </div>
          </div>

          {/* Submitted at */}
          <p className="text-[11px] text-[#ABABAB] text-center">
            Submitted {formatDate(ticket.submittedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function TicketHistory() {
  const [tickets, setTickets]         = useState<TicketHistoryEntry[]>([]);
  const [selected, setSelected]       = useState<TicketHistoryEntry | null>(null);
  const [filter, setFilter]           = useState<"all" | "auto-resolved" | "human-review" | "escalated">("all");
  const [search, setSearch]           = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) setTickets(JSON.parse(raw));
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setTickets([]);
    setConfirmClear(false);
  };

  const filtered = tickets.filter(t => {
    const matchFilter = filter === "all" || t.decision === filter;
    const matchSearch = !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.user.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:            tickets.length,
    "auto-resolved": tickets.filter(t => t.decision === "auto-resolved").length,
    "human-review":  tickets.filter(t => t.decision === "human-review").length,
    "escalated":     tickets.filter(t => t.decision === "escalated").length,
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{ opacity:0; transform:translateY(12px); } to{ opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .row-hover:hover { background: rgba(255,77,0,0.03); }
      `}</style>

      <div className="flex flex-col gap-5 fade-up">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[22px] font-extrabold text-[#0A0A0A] tracking-tight">Ticket History</h2>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">
              All tickets submitted via simulation — {tickets.length} total
            </p>
          </div>
          {tickets.length > 0 && (
            <div className="flex items-center gap-2">
              {!confirmClear ? (
                <button onClick={() => setConfirmClear(true)}
                  className="text-[12px] font-semibold text-[#6B6B6B] hover:text-red-500 border border-black/10 hover:border-red-200 px-3.5 py-2 rounded-xl bg-white transition-all cursor-pointer">
                  Clear History
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-white border border-red-200 px-3.5 py-2 rounded-xl">
                  <span className="text-[12px] text-red-600 font-semibold">Are you sure?</span>
                  <button onClick={clearHistory}
                    className="text-[12px] font-bold text-white bg-red-500 px-2.5 py-1 rounded-lg cursor-pointer border-none hover:bg-red-600 transition-all">
                    Yes, clear
                  </button>
                  <button onClick={() => setConfirmClear(false)}
                    className="text-[12px] font-semibold text-[#6B6B6B] cursor-pointer bg-transparent border-none hover:text-[#0A0A0A]">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Stats row ── */}
        {tickets.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "all",            label: "Total",         color: "#0A0A0A", bg: "white"    },
              { key: "auto-resolved",  label: "Auto Resolved", color: "#15803d", bg: "#f0fdf4"  },
              { key: "human-review",   label: "Under Review",  color: "#b45309", bg: "#fffbeb"  },
              { key: "escalated",      label: "Escalated",     color: "#FF4D00", bg: "#fff7f5"  },
            ].map(s => (
              <button key={s.key}
                onClick={() => setFilter(s.key as typeof filter)}
                className="flex flex-col gap-1 p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150"
                style={{
                  background:  filter === s.key ? s.bg    : "white",
                  borderColor: filter === s.key ? s.color + "44" : "rgba(10,10,10,0.08)",
                  boxShadow:   filter === s.key ? `0 0 0 1.5px ${s.color}33` : "none",
                }}>
                <span className="text-[26px] font-extrabold" style={{ color: s.color }}>
                  {counts[s.key as keyof typeof counts]}
                </span>
                <span className="text-[12px] font-semibold text-[#6B6B6B]">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Search + filter bar ── */}
        {tickets.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by title, name or ticket ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-black/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#0A0A0A] outline-none focus:border-[#FF4D00] transition-all placeholder:text-[#ABABAB]"
              />
            </div>
            {search && (
              <button onClick={() => setSearch("")}
                className="text-[12px] font-semibold text-[#6B6B6B] hover:text-[#0A0A0A] bg-white border border-black/10 px-3 py-2.5 rounded-xl cursor-pointer transition-all">
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── Empty state ── */}
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

        {/* ── No results from filter ── */}
        {tickets.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[14px] font-semibold text-[#6B6B6B]">No tickets match your search.</p>
            <button onClick={() => { setSearch(""); setFilter("all"); }}
              className="text-[12px] font-semibold text-[#FF4D00] cursor-pointer bg-transparent border-none">
              Clear filters
            </button>
          </div>
        )}

        {/* ── Ticket list ── */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden">

            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_90px_100px_80px_36px] gap-4 px-5 py-3 border-b border-black/[0.06] bg-[#F9F9F9]">
              {["Ticket", "Category", "Priority", "Status", "Time", ""].map(h => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#ABABAB]">{h}</span>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((ticket, i) => {
              const dec = DECISION_META[ticket.decision];
              const pri = PRIORITY_META[ticket.priority] ?? PRIORITY_META.low;
              return (
                <div key={ticket.ticketId}
                  onClick={() => setSelected(ticket)}
                  className="row-hover grid grid-cols-[1fr_120px_90px_100px_80px_36px] gap-4 px-5 py-4 items-center cursor-pointer transition-all duration-150"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(10,10,10,0.05)" : "none" }}>

                  {/* Title + meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-mono text-[#ABABAB]">{ticket.ticketId}</span>
                      {ticket.hasImage && <span className="text-[10px] text-[#6B6B6B]">📎</span>}
                    </div>
                    <p className="text-[13px] font-semibold text-[#0A0A0A] truncate">{ticket.title}</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{ticket.user || "—"}{ticket.department ? ` · ${ticket.department}` : ""}</p>
                  </div>

                  {/* Category */}
                  <span className="text-[12px] text-[#6B6B6B] truncate">
                    {CATEGORY_ICONS[ticket.category]} {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                  </span>

                  {/* Priority */}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit"
                    style={{ color: pri.color, background: pri.bg, borderColor: pri.border }}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </span>

                  {/* Decision */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dec.dot }} />
                    <span className="text-[11px] font-semibold truncate" style={{ color: dec.color }}>
                      {dec.label}
                    </span>
                  </div>

                  {/* Time */}
                  <span className="text-[11px] text-[#ABABAB]">{timeAgo(ticket.submittedAt)}</span>

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
      </div>

      {/* ── Detail drawer ── */}
      {selected && <TicketDrawer ticket={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
