// Frontend/src/pages/TicketsList.tsx
import { useState, useEffect, useCallback } from "react";
import {
  getTickets,
  updateTicket,
  deleteTicket,
  type TicketAPIResponse,
} from "../services/api";
import { formatAIText } from "../utils/formatAIText";

// ── Types ──────────────────────────────────────────────────────────────────
type Decision  = "auto-resolved" | "human-review" | "escalated";
type SortField = "created_at" | "confidence" | "status" | "id";
type SortOrder = "asc" | "desc";

// ── Constants ──────────────────────────────────────────────────────────────
const DECISION_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  "auto-resolved": { label: "Auto Resolved", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" },
  "human-review":  { label: "Under Review",  color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#b45309" },
  "escalated":     { label: "Escalated",     color: "#FF4D00", bg: "#fff7f5", border: "#ffd0c0", dot: "#FF4D00" },
};

const STATUS_OPTIONS = ["open", "in-progress", "resolved", "closed"];

const CATEGORY_ICONS: Record<string, string> = {
  access: "🔐", hardware: "💻", software: "⚙️",
  network: "🌐", security: "🛡️", other: "📋",
};

const CATEGORY_LABELS: Record<string, string> = {
  access: "Access & Permissions", hardware: "Hardware",
  software: "Software / App",    network: "Network / VPN",
  security: "Security",          other: "Other",
};

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
  if (ticket.decision === "auto-resolved") return "auto-resolved";
  if (ticket.decision === "escalated")     return "escalated";
  return "human-review";
}

function getStatusColor(status: string): { color: string; bg: string } {
  switch (status) {
    case "open":        return { color: "#2563eb", bg: "#eff6ff" };
    case "in-progress": return { color: "#b45309", bg: "#fffbeb" };
    case "resolved":    return { color: "#15803d", bg: "#f0fdf4" };
    case "closed":      return { color: "#6B6B6B", bg: "#F5F5F5" };
    default:            return { color: "#6B6B6B", bg: "#F5F5F5" };
  }
}

// ── Detail Drawer ──────────────────────────────────────────────────────────
function TicketDetailDrawer({
  ticket,
  onClose,
  onStatusChange,
  onAssign,
}: {
  ticket:         TicketAPIResponse;
  onClose:        () => void;
  onStatusChange: (id: number, status: string) => Promise<void>;
  onAssign:       (id: number, assignee: string) => Promise<void>;
}) {
  const decision    = normalizeDecision(ticket);
  const dec         = DECISION_META[decision];
  const conf        = ticket.confidence ?? 0;
  const confColor   = conf >= 80 ? "#15803d" : conf >= 55 ? "#b45309" : "#FF4D00";
  const radius      = 40;
  const circ        = 2 * Math.PI * radius;
  const offset      = circ - (conf / 100) * circ;
  const statusStyle = getStatusColor(ticket.status ?? "open");

  const [assignee,    setAssignee]    = useState(ticket.assigned_to ?? "");
  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localStatus, setLocalStatus] = useState(ticket.status ?? "open");

  const handleStatusChange = async (newStatus: string) => {
    setLocalStatus(newStatus);
    setSaving(true);
    try {
      await onStatusChange(ticket.id, newStatus);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignee.trim()) return;
    setSaving(true);
    try {
      await onAssign(ticket.id, assignee);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Drawer Header ── */}
        <div className="px-6 py-4 flex items-start justify-between border-b border-black/[0.07]"
          style={{ background: dec.bg }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                style={{ color: dec.color, borderColor: dec.border, background: "white" }}>
                {dec.label}
              </span>
              <span className="text-[11px] font-mono text-[#6B6B6B]">
                TKT-{String(ticket.id).padStart(5, "0")}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ color: statusStyle.color, background: statusStyle.bg }}>
                {localStatus}
              </span>
              {saveSuccess && (
                <span className="text-[11px] font-semibold text-[#15803d] bg-[#f0fdf4] px-2 py-0.5 rounded-full">
                  ✅ Saved
                </span>
              )}
            </div>
            <h3 className="text-[16px] font-extrabold text-[#0A0A0A] leading-snug max-w-[460px]">
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

        <div className="p-6 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>

          {/* ── Confidence Ring + AI Result ── */}
          <div className="flex items-center gap-5 p-4 rounded-xl border"
            style={{ background: dec.bg, borderColor: dec.border }}>
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth="8"/>
                <circle cx="48" cy="48" r={radius} fill="none" stroke={confColor} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 1s ease" }}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold" style={{ color: confColor }}>{conf}%</span>
                <span className="text-[9px] font-medium text-[#6B6B6B]">confidence</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[1.2px] mb-1" style={{ color: dec.color }}>
                AI Decision
              </p>
              <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-1">{dec.label}</p>
              <p className="text-[12px] text-[#6B6B6B]">
                Intent: <span className="font-semibold text-[#0A0A0A]">{ticket.intent ?? ticket.category ?? "—"}</span>
              </p>
              {ticket.processing_time && (
                <p className="text-[11px] text-[#ABABAB] mt-0.5">Processed in {ticket.processing_time}ms</p>
              )}
            </div>
          </div>

          {/* ── Meta Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Submitted By", value: ticket.submitted_by ?? "—" },
              { label: "Assigned To",  value: ticket.assigned_to  ?? "Unassigned" },
              { label: "Category",     value: `${CATEGORY_ICONS[ticket.category ?? ""] ?? "📋"} ${CATEGORY_LABELS[ticket.category ?? ""] ?? ticket.category ?? "—"}` },
              { label: "Submitted",    value: ticket.created_at ? timeAgo(ticket.created_at) : "—" },
            ].map(item => (
              <div key={item.label} className="bg-[#F5F5F5] rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#ABABAB] mb-0.5">{item.label}</p>
                <p className="text-[12px] font-semibold text-[#0A0A0A]">{item.value}</p>
              </div>
            ))}
          </div>

          {/* ── Admin Actions ── */}
          <div className="bg-[#F9F9F9] rounded-2xl border border-black/[0.07] p-4 flex flex-col gap-4">
            <p className="text-[12px] font-bold text-[#0A0A0A] uppercase tracking-[1px]">⚙️ Admin Actions</p>

            {/* Status change */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#6B6B6B]">Change Status</label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(s => {
                  const sc = getStatusColor(s);
                  return (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      disabled={saving}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all disabled:opacity-50"
                      style={{
                        color:       localStatus === s ? sc.color : "#6B6B6B",
                        background:  localStatus === s ? sc.bg    : "white",
                        borderColor: localStatus === s ? sc.color : "rgba(10,10,10,0.12)",
                      }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assign to */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#6B6B6B]">Assign To</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Agent name or email…"
                  value={assignee} onChange={e => setAssignee(e.target.value)}
                  className="flex-1 bg-white border border-black/[0.12] rounded-xl px-3 py-2 text-[13px] text-[#0A0A0A] outline-none focus:border-[#FF4D00] transition-all placeholder:text-[#ABABAB]"
                />
                <button onClick={handleAssign} disabled={saving || !assignee.trim()}
                  className="bg-[#0A0A0A] text-white text-[12px] font-bold px-4 py-2 rounded-xl border-none cursor-pointer hover:bg-[#1a1a1a] disabled:opacity-40 transition-all">
                  {saving ? "…" : "Assign"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">Description</p>
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <p className="text-[13px] text-[#3a3a3a] leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          {/* ── AI Suggested Fix ✅ formatAIText ── */}
          {(ticket.suggested_fix ?? ticket.solution) && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#0A0A0A] rounded-lg flex items-center justify-center shrink-0">
                  <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2M2.9 2.9l1.4 1.4M8.7 8.7l1.4 1.4M2.9 10.1l1.4-1.4M8.7 4.3l1.4-1.4"
                      stroke="#E9E9E9" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">AI Suggested Fix</p>
              </div>
              <div className="bg-[#F5F5F5] rounded-xl p-4">
                {/* ✅ Formatted — replaces raw <p> tag */}
                {formatAIText(ticket.suggested_fix ?? ticket.solution ?? "")}
              </div>
            </div>
          )}

          {/* ── Explainability ✅ formatAIText ── */}
          {ticket.explanation && (
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
                {/* ✅ Formatted — replaces raw <p> tag */}
                {formatAIText(ticket.explanation)}
              </div>
            </div>
          )}

          {/* ── Footer timestamp ── */}
          {ticket.created_at && (
            <p className="text-[11px] text-[#ABABAB] text-center">
              Created {formatDate(ticket.created_at)}
              {ticket.updated_at && ticket.updated_at !== ticket.created_at &&
                ` · Updated ${formatDate(ticket.updated_at)}`}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({
  ticket,
  onConfirm,
  onCancel,
  deleting,
}: {
  ticket:    TicketAPIResponse;
  onConfirm: () => void;
  onCancel:  () => void;
  deleting:  boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[380px] flex flex-col gap-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5h12M8 5V3h2v2M7 8v5M11 8v5M4 5l1 10h8l1-10"
                stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#0A0A0A]">Delete Ticket?</p>
            <p className="text-[12px] text-[#6B6B6B]">This action cannot be undone.</p>
          </div>
        </div>
        <div className="bg-[#F5F5F5] rounded-xl px-4 py-3">
          <p className="text-[12px] font-semibold text-[#0A0A0A] truncate">{ticket.title}</p>
          <p className="text-[11px] text-[#6B6B6B]">TKT-{String(ticket.id).padStart(5, "0")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 text-[13px] font-semibold text-[#6B6B6B] bg-white border border-black/10 py-2.5 rounded-xl cursor-pointer hover:bg-black/[0.03] transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 text-[13px] font-bold text-white bg-red-500 py-2.5 rounded-xl border-none cursor-pointer hover:bg-red-600 transition-all disabled:opacity-50">
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function TicketsList() {
  const [tickets,        setTickets]        = useState<TicketAPIResponse[]>([]);
  const [total,          setTotal]          = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [selected,       setSelected]       = useState<TicketAPIResponse | null>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<TicketAPIResponse | null>(null);
  const [deleting,       setDeleting]       = useState(false);
  const [toastMsg,       setToastMsg]       = useState<string | null>(null);

  // Filters
  const [search,         setSearch]         = useState("");
  const [filterDecision, setFilterDecision] = useState<"all" | Decision>("all");
  const [filterStatus,   setFilterStatus]   = useState<string>("all");
  const [sortField,      setSortField]      = useState<SortField>("created_at");
  const [sortOrder,      setSortOrder]      = useState<SortOrder>("desc");
  const [page,           setPage]           = useState(1);
  const PAGE_SIZE = 20;

  // ── Toast ──────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTickets(
        page,
        PAGE_SIZE,
        filterStatus !== "all" ? filterStatus : undefined,
      );
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Update status ──────────────────────────────────────────────────────
  const handleStatusChange = async (id: number, status: string) => {
    await updateTicket(id, { status });
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    showToast(`✅ Status updated to "${status}"`);
  };

  // ── Assign ────────────────────────────────────────────────────────────
  const handleAssign = async (id: number, assigned_to: string) => {
    await updateTicket(id, { assigned_to });
    setTickets(prev => prev.map(t => t.id === id ? { ...t, assigned_to } : t));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, assigned_to } : null);
    showToast(`✅ Assigned to "${assigned_to}"`);
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTicket(deleteTarget.id);
      setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
      setTotal(prev => prev - 1);
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) setSelected(null);
      showToast("🗑️ Ticket deleted successfully");
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : "Delete failed"}`);
    } finally {
      setDeleting(false);
    }
  };

  // ── Client-side filter + sort ──────────────────────────────────────────
  const filtered = tickets
    .filter(t => {
      const decision    = normalizeDecision(t);
      const matchDec    = filterDecision === "all" || decision === filterDecision;
      const matchSearch =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.submitted_by ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.assigned_to  ?? "").toLowerCase().includes(search.toLowerCase()) ||
        String(t.id).includes(search);
      return matchDec && matchSearch;
    })
    .sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;
      if (sortField === "created_at") {
        valA = new Date(a.created_at ?? 0).getTime();
        valB = new Date(b.created_at ?? 0).getTime();
      } else if (sortField === "confidence") {
        valA = a.confidence ?? 0; valB = b.confidence ?? 0;
      } else if (sortField === "id") {
        valA = a.id; valB = b.id;
      } else if (sortField === "status") {
        valA = a.status ?? ""; valB = b.status ?? "";
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ?  1 : -1;
      return 0;
    });

  const counts = {
    all:             tickets.length,
    "auto-resolved": tickets.filter(t => normalizeDecision(t) === "auto-resolved").length,
    "human-review":  tickets.filter(t => normalizeDecision(t) === "human-review").length,
    "escalated":     tickets.filter(t => normalizeDecision(t) === "escalated").length,
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline ml-1 opacity-50">
      {sortField === field
        ? <path d={sortOrder === "desc" ? "M2 3l3 4 3-4" : "M2 7l3-4 3 4"}
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="M2 3l3 4 3-4M2 7l3-4 3 4" stroke="currentColor" strokeWidth="1.2"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      }
    </svg>
  );

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-black/[0.06]" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{ borderTopColor: "#FF4D00", animation: "spin 0.8s linear infinite" }} />
      </div>
      <p className="text-[13px] text-[#6B6B6B]">Loading tickets from database…</p>
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
        <p className="text-[15px] font-bold text-[#0A0A0A] mb-1">Failed to load tickets</p>
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
        @keyframes fadeIn  { from{ opacity:0; } to{ opacity:1; } }
        @keyframes slideIn { from{ opacity:0; transform:translateY(-8px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        .fade-up  { animation: fadeUp  0.4s ease both; }
        .fade-in  { animation: fadeIn  0.3s ease both; }
        .slide-in { animation: slideIn 0.3s ease both; }
        .row-hover:hover { background: rgba(255,77,0,0.025); }
      `}</style>

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="slide-in fixed top-5 right-5 z-[100] bg-[#0A0A0A] text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toastMsg}
        </div>
      )}

      <div className="flex flex-col gap-5 fade-up">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#FF4D00] rounded-lg flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="1" y="2" width="13" height="11" rx="2" stroke="white" strokeWidth="1.3"/>
                  <path d="M4 6h7M4 9h5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-[22px] font-extrabold text-[#0A0A0A] tracking-tight">All Tickets</h2>
            </div>
            <p className="text-[13px] text-[#6B6B6B]">
              Manage, assign and resolve support tickets — {total} total
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

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "all",           label: "Total",         color: "#0A0A0A", bg: "white"   },
            { key: "auto-resolved", label: "Auto Resolved", color: "#15803d", bg: "#f0fdf4" },
            { key: "human-review",  label: "Under Review",  color: "#b45309", bg: "#fffbeb" },
            { key: "escalated",     label: "Escalated",     color: "#FF4D00", bg: "#fff7f5" },
          ].map(s => (
            <button key={s.key}
              onClick={() => setFilterDecision(s.key as typeof filterDecision)}
              className="flex flex-col gap-1 p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150"
              style={{
                background:  filterDecision === s.key ? s.bg    : "white",
                borderColor: filterDecision === s.key ? s.color + "44" : "rgba(10,10,10,0.08)",
                boxShadow:   filterDecision === s.key ? `0 0 0 1.5px ${s.color}33` : "none",
              }}>
              <span className="text-[28px] font-extrabold leading-none" style={{ color: s.color }}>
                {counts[s.key as keyof typeof counts]}
              </span>
              <span className="text-[12px] font-semibold text-[#6B6B6B]">{s.label}</span>
            </button>
          ))}
        </div>

        {/* ── Filters Row ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Search tickets, users, agents…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-black/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-[#FF4D00] transition-all placeholder:text-[#ABABAB]"
            />
          </div>

          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-white border border-black/[0.1] rounded-xl px-3 py-2.5 text-[13px] text-[#0A0A0A] outline-none cursor-pointer focus:border-[#FF4D00] transition-all appearance-none pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {(search || filterDecision !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setSearch(""); setFilterDecision("all"); setFilterStatus("all"); }}
              className="text-[12px] font-semibold text-[#6B6B6B] hover:text-[#FF4D00] bg-white border border-black/10 px-3 py-2.5 rounded-xl cursor-pointer transition-all">
              Clear filters
            </button>
          )}

          <span className="text-[12px] text-[#ABABAB] ml-auto">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Empty State ── */}
        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-black/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#ABABAB]">
                <rect x="4" y="3" width="20" height="22" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 9h10M9 13h7M9 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-[#0A0A0A] mb-1">No tickets found</p>
              <p className="text-[13px] text-[#6B6B6B]">Tickets submitted via Simulation will appear here.</p>
            </div>
          </div>
        )}

        {/* ── No Results ── */}
        {tickets.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[14px] font-semibold text-[#6B6B6B]">No tickets match your filters.</p>
            <button onClick={() => { setSearch(""); setFilterDecision("all"); setFilterStatus("all"); }}
              className="text-[12px] font-semibold text-[#FF4D00] cursor-pointer bg-transparent border-none">
              Clear all filters
            </button>
          </div>
        )}

        {/* ── Tickets Table ── */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden">
            <div className="grid gap-4 px-5 py-3 border-b border-black/[0.06] bg-[#F9F9F9]"
              style={{ gridTemplateColumns: "1fr 130px 120px 100px 80px 80px 36px" }}>
              {[
                { label: "Ticket",     field: null         },
                { label: "Category",   field: null         },
                { label: "Status",     field: "status"     },
                { label: "Confidence", field: "confidence" },
                { label: "Assigned",   field: null         },
                { label: "Time",       field: "created_at" },
                { label: "",           field: null         },
              ].map(col => (
                <button key={col.label}
                  onClick={() => col.field && toggleSort(col.field as SortField)}
                  className={`text-[10px] font-bold uppercase tracking-[1.2px] text-[#ABABAB] text-left bg-transparent border-none p-0 ${col.field ? "cursor-pointer hover:text-[#0A0A0A]" : "cursor-default"}`}>
                  {col.label}
                  {col.field && <SortIcon field={col.field as SortField} />}
                </button>
              ))}
            </div>

            {filtered.map((ticket, i) => {
              const decision    = normalizeDecision(ticket);
              const dec         = DECISION_META[decision];
              const statusStyle = getStatusColor(ticket.status ?? "open");
              return (
                <div key={ticket.id}
                  className="row-hover grid gap-4 px-5 py-4 items-center transition-all duration-150"
                  style={{
                    gridTemplateColumns: "1fr 130px 120px 100px 80px 80px 36px",
                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(10,10,10,0.05)" : "none",
                  }}>

                  <div className="min-w-0 cursor-pointer" onClick={() => setSelected(ticket)}>
                    <span className="text-[10px] font-mono text-[#ABABAB]">
                      TKT-{String(ticket.id).padStart(5, "0")}
                    </span>
                    <p className="text-[13px] font-semibold text-[#0A0A0A] truncate hover:text-[#FF4D00] transition-colors">
                      {ticket.title}
                    </p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5 truncate">{ticket.submitted_by ?? "—"}</p>
                  </div>

                  <span className="text-[12px] text-[#6B6B6B] truncate">
                    {CATEGORY_ICONS[ticket.category ?? ""] ?? "📋"} {CATEGORY_LABELS[ticket.category ?? ""] ?? ticket.category ?? "—"}
                  </span>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full w-fit"
                    style={{ color: statusStyle.color, background: statusStyle.bg }}>
                    {(ticket.status ?? "open").charAt(0).toUpperCase() + (ticket.status ?? "open").slice(1)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-black/[0.07] overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width:      `${ticket.confidence ?? 0}%`,
                        background: (ticket.confidence ?? 0) >= 80 ? "#15803d"
                                  : (ticket.confidence ?? 0) >= 55 ? "#b45309" : "#FF4D00",
                      }} />
                    </div>
                    <span className="text-[10px] font-bold text-[#6B6B6B] w-8 text-right">
                      {ticket.confidence ?? 0}%
                    </span>
                  </div>

                  <span className="text-[11px] text-[#6B6B6B] truncate">{ticket.assigned_to ?? "—"}</span>

                  <span className="text-[11px] text-[#ABABAB]">
                    {ticket.created_at ? timeAgo(ticket.created_at) : "—"}
                  </span>

                  <div className="flex items-center gap-1.5 justify-end">
                    <button onClick={() => setSelected(ticket)}
                      className="w-7 h-7 rounded-lg bg-black/[0.04] hover:bg-[#FF4D00]/10 flex items-center justify-center cursor-pointer border-none transition-all"
                      title="View details">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="#6B6B6B" strokeWidth="1.2"/>
                        <circle cx="6" cy="6" r="1.5" stroke="#6B6B6B" strokeWidth="1.2"/>
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(ticket)}
                      className="w-7 h-7 rounded-lg bg-black/[0.04] hover:bg-red-50 flex items-center justify-center cursor-pointer border-none transition-all"
                      title="Delete ticket">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4h8M5 4V2.5h2V4M3.5 4l.5 6h4l.5-6"
                          stroke="#ABABAB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 pt-1">
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

      {/* ── Detail Drawer ── */}
      {selected && (
        <TicketDetailDrawer
          ticket={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onAssign={handleAssign}
        />
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          ticket={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  );
}
