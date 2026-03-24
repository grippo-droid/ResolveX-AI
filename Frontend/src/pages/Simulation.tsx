import { useState, useEffect, useRef } from "react";
import { submitTicket }                from "../services/api";

// ── Types ──────────────────────────────────────────────────────────────────
type Category = "access" | "hardware" | "software" | "network" | "security" | "other";
type Decision = "auto-resolved" | "human-review" | "escalated";

interface TicketForm {
  title:       string;
  category:    Category | "";
  description: string;
  user:        string;
  image:       File | null;
}

interface AIResult {
  decision:       Decision;
  confidence:     number;
  intent:         string;
  suggestedFix:   string;
  explanation:    string;
  ticketId:       string;
  processingTime: number;
}

export interface TicketHistoryEntry {
  ticketId:       string;
  title:          string;
  category:       string;
  priority:       string;
  user:           string;
  department:     string;
  system:         string;
  description:    string;
  decision:       Decision;
  confidence:     number;
  intent:         string;
  suggestedFix:   string;
  explanation:    string;
  processingTime: number;
  hasImage:       boolean;
  submittedAt:    string;
}

const HISTORY_KEY = "resolvex_ticket_history";

function saveTicketToHistory(form: TicketForm, result: AIResult) {
  const existing: TicketHistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const entry: TicketHistoryEntry = {
    ticketId:       result.ticketId,
    title:          form.title,
    category:       form.category,
    priority:       "medium",
    user:           form.user,
    department:     "",
    system:         "",
    description:    form.description,
    decision:       result.decision,
    confidence:     result.confidence,
    intent:         result.intent,
    suggestedFix:   result.suggestedFix,
    explanation:    result.explanation,
    processingTime: result.processingTime,
    hasImage:       !!form.image,
    submittedAt:    new Date().toISOString(),
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...existing]));
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "access",   label: "Access & Permissions", icon: "🔐" },
  { value: "hardware", label: "Hardware",              icon: "💻" },
  { value: "software", label: "Software / App",        icon: "⚙️" },
  { value: "network",  label: "Network / VPN",         icon: "🌐" },
  { value: "security", label: "Security",              icon: "🛡️" },
  { value: "other",    label: "Other",                 icon: "📋" },
];

const DECISION_META: Record<Decision, { label: string; color: string; bg: string; border: string }> = {
  "auto-resolved": { label: "Auto Resolved", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  "human-review":  { label: "Under Review",  color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  "escalated":     { label: "Escalated",     color: "#FF4D00", bg: "#fff7f5", border: "#ffd0c0" },
};

const AUTO_RESET_SECONDS = 5;

// ── Main ───────────────────────────────────────────────────────────────────
export default function Simulation() {
  const [form, setForm] = useState<TicketForm>({
    title: "", category: "", description: "", user: "", image: null,
  });
  const [errors, setErrors]             = useState<Partial<Record<keyof TicketForm, string>>>({});
  const [phase, setPhase]               = useState<"form" | "processing" | "thankyou">("form");
  const [result, setResult]             = useState<AIResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [countdown, setCountdown]       = useState(AUTO_RESET_SECONDS);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const countdownRef                    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "thankyou") return;
    setCountdown(AUTO_RESET_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [phase]);

  useEffect(() => {
    if (countdown === 0 && phase === "thankyou") handleReset();
  }, [countdown, phase]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof TicketForm, string>> = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.category)           e.category    = "Please select a category";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.user.trim())        e.user        = "Your name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Real API Call ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError(null);
    try {
      setPhase("processing");

      const data = await submitTicket({
        title:        form.title,
        description:  form.description,
        category:     form.category,
        submitted_by: form.user,
        image:        form.image,
      });

      console.log("✅ Ticket created:", data);

      // Map backend response → AIResult
      const aiResult: AIResult = {
        decision:       (data.decision as Decision)  ?? "human-review",
        confidence:     data.confidence               ?? 70,
        intent:         data.intent                   ?? "General IT Issue",
        suggestedFix:   data.suggested_fix            ?? "Our team will investigate.",
        explanation:    data.explanation              ?? "",
        ticketId:       data.ticket_id ?? String(data.id) ?? `TKT-${Date.now().toString().slice(-5)}`,
        processingTime: data.processing_time          ?? 2000,
      };

      saveTicketToHistory(form, aiResult);
      setResult(aiResult);
      setPhase("thankyou");

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      console.error("❌ Ticket submission failed:", message);
      setSubmitError(message);
      setPhase("form");
    }
  };

  const handleReset = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setForm({ title: "", category: "", description: "", user: "", image: null });
    setErrors({}); setResult(null); setImagePreview(null);
    setSubmitError(null); setPhase("form");
  };

  const update = (field: keyof TicketForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setForm(prev => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{ opacity:0; transform:translateY(16px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from{ opacity:0; } to{ opacity:1; } }
        @keyframes spin     { to{ transform:rotate(360deg); } }
        @keyframes pulse    { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
        @keyframes slideUp  { from{ opacity:0; transform:translateY(32px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes checkPop { 0%{ transform:scale(0) rotate(-10deg); opacity:0; } 70%{ transform:scale(1.15) rotate(3deg); } 100%{ transform:scale(1) rotate(0deg); opacity:1; } }

        .fade-up   { animation: fadeUp   0.45s ease both; }
        .fade-in   { animation: fadeIn   0.3s  ease both; }
        .slide-up  { animation: slideUp  0.5s  cubic-bezier(0.22,1,0.36,1) both; }
        .spinner   { animation: spin     0.8s  linear infinite; }
        .pulse-dot { animation: pulse    1.4s  ease-in-out infinite; }
        .check-pop { animation: checkPop 0.6s  cubic-bezier(0.22,1,0.36,1) both; }

        .input-base {
          width:100%; background:white;
          border:1.5px solid rgba(10,10,10,0.12); border-radius:10px;
          padding:11px 14px; font-size:14px; color:#0A0A0A;
          outline:none; transition:border-color 0.2s, box-shadow 0.2s;
        }
        .input-base::placeholder { color:#ABABAB; }
        .input-base:focus { border-color:#FF4D00; box-shadow:0 0 0 3px rgba(255,77,0,0.08); }
        .input-error { border-color:#dc2626 !important; }

        .select-base {
          width:100%; background:white;
          border:1.5px solid rgba(10,10,10,0.12); border-radius:10px;
          padding:11px 14px; font-size:14px; color:#0A0A0A;
          outline:none; cursor:pointer; appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 14px center;
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .select-base:focus { border-color:#FF4D00; box-shadow:0 0 0 3px rgba(255,77,0,0.08); }
      `}</style>

      {/* ══ PHASE: FORM ══ */}
      {phase === "form" && (
        <div className="fade-up flex flex-col lg:flex-row gap-5 items-start">

          {/* LEFT: Theory panel */}
          <div className="lg:w-[260px] shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 bg-[#FF4D00]/[0.07] border border-[#FF4D00]/20 rounded-xl px-4 py-3">
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#FF4D00] shrink-0" />
              <span className="text-[12px] font-medium text-[#FF4D00] leading-snug">
                Live mode — connected to real backend
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-black/10 p-5 flex flex-col gap-4">
              <p className="text-[13px] font-bold text-[#0A0A0A]">What happens when you submit?</p>
              {[
                { color: "#FF4D00", title: "Intent Extraction",        desc: "NLP pipeline parses your ticket for intent, urgency & entities in milliseconds." },
                { color: "#16a34a", title: "Confidence Scoring",       desc: "Multi-factor engine scores against policy rules, history & any attached screenshot." },
                { color: "#b45309", title: "Auto-resolve or Escalate", desc: "High confidence → resolved automatically. Low confidence → routed to a human." },
              ].map(s => (
                <div key={s.title} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
                  <div>
                    <p className="text-[12px] font-bold text-[#0A0A0A]">{s.title}</p>
                    <p className="text-[12px] text-[#6B6B6B] leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-black/10 p-5 flex flex-col gap-3">
              <p className="text-[12px] font-bold text-[#0A0A0A]">💡 Pro tip — attach a screenshot</p>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                Attaching a screenshot gives the AI more visual context, increasing confidence score and enabling faster resolution.
              </p>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#16a34a]/10 text-[#16a34a] w-fit">
                +6% confidence boost
              </span>
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="flex-1 bg-white/70 border border-black/[0.08] rounded-2xl p-6 flex flex-col gap-5">

            <div>
              <div className="inline-flex items-center gap-2 bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-3">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#FF4D00]" />
                AI-Powered · Live
              </div>
              <h2 className="text-[20px] font-extrabold text-[#0A0A0A] tracking-tight leading-tight mb-1">
                Submit a Support Ticket
              </h2>
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                Describe your IT issue. The AI engine will classify, score, and resolve or escalate it automatically.
              </p>
            </div>

            {/* ── API Error Banner ── */}
            {submitError && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-red-500 text-[13px]">❌</span>
                <p className="text-[12px] text-red-600 font-medium">{submitError}</p>
              </div>
            )}

            {/* Submitted By */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0A0A0A]">
                Submitted By <span className="text-[#FF4D00]">*</span>
              </label>
              <input type="text" placeholder="e.g. Sarah Johnson"
                value={form.user} onChange={e => update("user", e.target.value)}
                className={`input-base ${errors.user ? "input-error" : ""}`} />
              {errors.user && <p className="text-xs text-red-600">{errors.user}</p>}
            </div>

            {/* Issue Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0A0A0A]">
                Issue Title <span className="text-[#FF4D00]">*</span>
              </label>
              <input type="text" placeholder="e.g. Cannot connect to VPN after system update"
                value={form.title} onChange={e => update("title", e.target.value)}
                className={`input-base ${errors.title ? "input-error" : ""}`} />
              {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0A0A0A]">
                Category <span className="text-[#FF4D00]">*</span>
              </label>
              <select value={form.category} onChange={e => update("category", e.target.value)}
                className={`select-base ${errors.category ? "input-error" : ""}`}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#0A0A0A]">
                  Description <span className="text-[#FF4D00]">*</span>
                </label>
                <span className="text-[11px] text-[#ABABAB]">{form.description.length}/500</span>
              </div>
              <textarea placeholder="Describe the issue in detail…"
                value={form.description}
                onChange={e => update("description", e.target.value.slice(0, 500))}
                rows={5} className={`input-base resize-none ${errors.description ? "input-error" : ""}`} />
              {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            </div>

            {/* Screenshot upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0A0A0A]">
                Screenshot / Attachment
                <span className="text-[#ABABAB] font-normal ml-1.5 text-[12px]">(optional)</span>
              </label>
              {!imagePreview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed rounded-xl py-8 cursor-pointer transition-all duration-200"
                  style={{ borderColor: dragOver ? "#FF4D00" : "rgba(10,10,10,0.15)", background: dragOver ? "rgba(255,77,0,0.04)" : "white" }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#ABABAB]">
                    <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="9" cy="11" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 19l6-5 4 4 4-3 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-[13px] font-medium text-[#6B6B6B]">
                    <span className="text-[#FF4D00] font-semibold">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-[11px] text-[#ABABAB]">PNG, JPG, GIF up to 5MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => handleFile(e.target.files?.[0] ?? null)} />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-black/10 group">
                  <img src={imagePreview} alt="Attached screenshot" className="w-full max-h-[220px] object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                    <button onClick={removeImage}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-[#0A0A0A] text-[12px] font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 border border-black/10 cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Remove
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-black/10">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <rect x="0.5" y="0.5" width="10" height="10" rx="2" stroke="#16a34a" strokeWidth="1.1"/>
                      <path d="M3 5.5l1.5 1.5 3-3" stroke="#16a34a" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[11px] font-semibold text-[#16a34a]">Screenshot attached</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-2 border-t border-black/[0.07]">
              <button type="button" onClick={handleSubmit}
                className="flex items-center gap-2 bg-[#0A0A0A] text-[#E9E9E9] text-sm font-bold px-6 py-3.5 rounded-xl border-none cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] hover:-translate-y-px hover:shadow-lg">
                Submit to AI Engine
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <p className="text-[12px] text-[#ABABAB]">
                {form.image ? "📎 Screenshot attached · " : ""}Submitting to real backend
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ PHASE: PROCESSING ══ */}
      {phase === "processing" && (
        <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-[3px] border-black/[0.06]" />
            <div className="spinner absolute inset-0 rounded-full border-[3px] border-transparent"
              style={{ borderTopColor: "#FF4D00" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9h5M9 3v5M9 9l4.5 4.5" stroke="#E9E9E9" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="9" r="2" fill="#FF4D00"/>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight mb-1">Submitting your ticket…</h2>
            <p className="text-sm text-[#6B6B6B]">
              Sending to backend{form.image ? " with screenshot" : ""}. Please wait.
            </p>
          </div>
        </div>
      )}

      {/* ══ PHASE: THANK YOU ══ */}
      {phase === "thankyou" && result && (() => {
        const meta = DECISION_META[result.decision];
        return (
          <div className="slide-up flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-[520px] flex flex-col items-center gap-6">

              <div className="check-pop w-20 h-20 rounded-full bg-[#0A0A0A] flex items-center justify-center shadow-xl">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M8 18l7 7 13-13" stroke="#FF4D00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="text-center">
                <h2 className="text-[26px] font-extrabold text-[#0A0A0A] tracking-tight leading-tight mb-2">
                  Ticket Submitted!
                </h2>
                <p className="text-[14px] text-[#6B6B6B] leading-relaxed max-w-[380px] mx-auto">
                  Thank you, <strong className="text-[#0A0A0A]">{form.user}</strong>. Your ticket has been saved to the database. Track it in Ticket History.
                </p>
              </div>

              <div className="w-full bg-white rounded-2xl border border-black/10 overflow-hidden">
                <div className="px-5 py-3.5 flex items-center justify-between"
                  style={{ background: meta.bg, borderBottom: `1px solid ${meta.border}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                    <span className="text-[13px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                  </div>
                  <span className="text-[12px] font-mono font-semibold text-[#6B6B6B]">{result.ticketId}</span>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <p className="text-[15px] font-bold text-[#0A0A0A] leading-snug">{form.title}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/[0.06] text-[#6B6B6B]">
                        {CATEGORIES.find(c => c.value === form.category)?.icon} {CATEGORIES.find(c => c.value === form.category)?.label}
                      </span>
                      {form.image && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                          📎 Screenshot attached
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-black/[0.06]" />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#ABABAB] mb-0.5">AI Confidence</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold" style={{ color: meta.color }}>{result.confidence}%</span>
                        <div className="flex-1 h-1 rounded-full bg-black/[0.08] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${result.confidence}%`, background: meta.color }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#ABABAB] mb-0.5">Detected Intent</p>
                      <p className="text-[13px] font-semibold text-[#0A0A0A]">{result.intent}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-[#F5F5F5] rounded-xl px-4 py-3">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 mt-0.5 text-[#6B6B6B]">
                      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M7.5 5v3.5M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                      {result.decision === "auto-resolved"
                        ? "This ticket was auto-resolved by the AI. Check your email for confirmation."
                        : result.decision === "human-review"
                        ? "A support engineer will review and respond within 1 business day."
                        : "This ticket has been escalated to the senior IT team. Expect a response within 2 hours."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#ABABAB]">Resetting form automatically…</p>
                  <span className="text-[12px] font-bold text-[#0A0A0A]">{countdown}s</span>
                </div>
                <div className="h-1 w-full bg-black/[0.07] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF4D00] rounded-full"
                    style={{ width: `${(countdown / AUTO_RESET_SECONDS) * 100}%`, transition: "width 1s linear" }} />
                </div>
              </div>

              <button onClick={handleReset}
                className="flex items-center gap-2 bg-[#0A0A0A] text-[#E9E9E9] text-[13px] font-bold px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[#1a1a1a] transition-all">
                Submit Another Ticket
              </button>

            </div>
          </div>
        );
      })()}
    </>
  );
}
