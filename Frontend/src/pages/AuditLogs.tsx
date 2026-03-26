import { useState, useEffect } from "react";
import {
  getTickets,
  getTicketPipeline,
  type TicketAPIResponse,
  type TicketPipelineTracker
} from "../services/api";
import { FileText, Cpu, LayoutList, Database, Zap, UserCheck, CheckCircle2, Search, ArrowRight, ShieldAlert, BadgeCheck } from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  created: <FileText className="w-4 h-4" />,
  extracted: <LayoutList className="w-4 h-4" />,
  classified: <Cpu className="w-4 h-4" />,
  solution: <Zap className="w-4 h-4" />,
  decision: <UserCheck className="w-4 h-4" />,
  closed: <CheckCircle2 className="w-4 h-4" />,
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AuditLogs() {
  const [tickets, setTickets] = useState<TicketAPIResponse[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [pipeline, setPipeline] = useState<TicketPipelineTracker | null>(null);
  const [loadingPipeline, setLoadingPipeline] = useState(false);

  // Load recent tickets
  useEffect(() => {
    getTickets(1, 15)
      .then(res => {
        setTickets(res.tickets);
        if (res.tickets.length > 0) setSelectedId(res.tickets[0].id);
      })
      .finally(() => setLoadingList(false));
  }, []);

  // Load pipeline when ticket selected
  useEffect(() => {
    if (!selectedId) return;
    setLoadingPipeline(true);
    getTicketPipeline(selectedId)
      .then(setPipeline)
      .finally(() => setLoadingPipeline(false));
  }, [selectedId]);

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6 max-w-[1400px] mx-auto overflow-hidden">

      {/* ── Left Sidebar: Recent Tickets ── */}
      <div className="w-full md:w-[320px] shrink-0 flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden h-64 md:h-full">
        <div className="p-5 border-b border-black/[0.06] bg-[#FAFAFA]">
          <h2 className="text-[16px] font-bold text-[#0A0A0A] mb-1">Audit Logs & Processing</h2>
          <p className="text-[12px] text-[#6B6B6B]">Select a ticket to trace its AI pipeline timeline.</p>

          <div className="relative mt-4">
            <Search className="w-4 h-4 text-[#ABABAB] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID or Keyword..."
              className="w-full bg-white border border-black/[0.08] rounded-xl pl-9 pr-3 py-2 text-[12px] outline-none focus:border-[#FF4D00] transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {loadingList ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 rounded-full border-2 border-black/10 border-t-[#0A0A0A] animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-[#6B6B6B]">No recent tickets found.</div>
          ) : (
            tickets.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-3 rounded-xl text-left transition-all border ${selectedId === t.id ? "bg-[#FF4D00]/5 border-[#FF4D00]/20 shadow-sm" : "bg-white border-transparent hover:bg-[#FAFAFA]"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-[#ABABAB]">TKT-{String(t.id).padStart(5, "0")}</span>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">{t.created_at ? timeAgo(t.created_at) : ""}</span>
                </div>
                <p className="text-[13px] font-semibold text-[#0A0A0A] truncate leading-tight">{t.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${t.status === "closed" ? "bg-gray-100 text-gray-500" : "bg-[#15803D]/10 text-[#15803D]"}`}>
                    {t.status}
                  </span>
                  {t.category && <span className="text-[10px] text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10 px-2 rounded-full">{t.category}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right Content: AI Pipeline Tracker ── */}
      <div className="flex-1 bg-white rounded-2xl border border-black/[0.06] shadow-sm flex flex-col overflow-hidden relative">
        <style>{`
          .pipeline-pulse { box-shadow: 0 0 0 0 rgba(255, 77, 0, 0.4); animation: pulse-ring 2s infinite; }
          @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(255, 77, 0, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 77, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 77, 0, 0); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        `}</style>

        {loadingPipeline || !pipeline ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-black/10 border-t-[#FF4D00] animate-spin mb-4" />
            <p className="text-[13px] font-medium text-[#6B6B6B]">Loading trace data...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-8 sm:py-12 flex flex-col">

            <div className="mb-8 sm:mb-14">
              <div className="inline-flex items-center gap-2 mb-3 bg-[#FF4D00]/5 border border-[#FF4D00]/20 text-[#FF4D00] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
                <Zap className="w-3.5 h-3.5 fill-current" /> Auto-Trace Pipeline
              </div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#0A0A0A]">
                TKT-{String(pipeline.ticket_id).padStart(5, "0")} Execution Trace
              </h1>
              <p className="text-[14px] text-[#6B6B6B] mt-1 max-w-xl">
                Step-by-step visual representation of how the AI architecture processed and evaluated this ticket.
              </p>
            </div>

            {/* ── Horizontal Stepper ── */}
            <div className="relative mt-8 mb-16 px-4">
              {/* background connecting line */}
              <div className="absolute top-6 left-10 right-10 h-1 bg-black/[0.04] rounded-full z-0" />

              <div className="relative z-10 flex justify-between">
                {pipeline.steps.map((step, idx) => {
                  const isCompleted = step.state === "completed";
                  const isActive = step.state === "active";
                  const isPending = step.state === "pending";
                  const isFailed = step.state === "failed";

                  // Connect left line to previous completed, active dot
                  const hasActiveLeftLine = isCompleted || isActive;
                  const leftLineW = idx === 0 ? "0" : (hasActiveLeftLine ? "100%" : "0");

                  return (
                    <div key={step.key} className={`flex flex-col items-center relative animate-fade-up`} style={{ animationDelay: `${idx * 0.5}s`, width: "120px" }}>

                      {/* Active Connection Line Fragment */}
                      {idx > 0 && (
                        <div
                          className="absolute top-6 right-[50%] h-1 bg-[#0A0A0A] transition-all duration-700 ease-out z-0 origin-left"
                          style={{ width: "100%", transform: `scaleX(${leftLineW === "100%" ? 1 : 0})` }}
                        />
                      )}

                      {/* Dot */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-all duration-500
                        ${isCompleted ? "bg-[#0A0A0A] text-white shadow-md shadow-black/20" : ""}
                        ${isActive ? "bg-[#FF4D00] text-white pipeline-pulse ring-4 ring-white" : ""}
                        ${isPending ? "bg-white border-2 border-black/10 text-[#ABABAB]" : ""}
                        ${isFailed ? "bg-red-500 text-white shadow-md" : ""}
                      `}>
                        {STEP_ICONS[step.key]}
                      </div>

                      {/* Labels container */}
                      <div className="mt-4 flex flex-col items-center text-center">
                        <span className={`text-[12px] font-bold ${isActive ? "text-[#0A0A0A]" : isCompleted ? "text-[#3A3A3A]" : "text-[#ABABAB]"}`}>
                          {step.label}
                        </span>

                        {/* Timestamps & Details inline pop */}
                        {(isActive || isCompleted) && (
                          <div className="flex flex-col items-center mt-2 gap-1.5">
                            {step.timestamp && (
                              <span className="text-[10px] font-mono text-[#6B6B6B] bg-[#FAFAFA] border border-black/5 px-1.5 py-0.5 rounded">
                                {formatDate(step.timestamp)}
                              </span>
                            )}

                            {/* Detailed Badges */}
                            {step.details?.predicted_category && (
                              <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full flex gap-1">
                                Category: {step.details.predicted_category}
                              </span>
                            )}

                            {step.details?.confidence_score !== undefined && (
                              <span className="text-[10px] font-bold text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded-full flex gap-1">
                                Conf: {Math.round((step.details.confidence_score as number) * 100)}%
                              </span>
                            )}

                            {step.details?.decision && (
                              <span className={`text-[10px] font-bold text-center px-2 py-0.5 rounded-full flex gap-1 border
                                ${step.details.decision.includes("Human") ? "bg-[#b45309]/10 text-[#b45309] border-[#b45309]/20" : "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20"}`}>
                                {step.details.decision}
                              </span>
                            )}

                            {step.details?.assigned_to && (
                              <span className="text-[10px] font-bold text-[#FF4D00] bg-[#FF4D00]/10 px-2 py-0.5 rounded-full flex gap-1">
                                @{step.details.assigned_to}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Status Banner ── */}
            <div className="mt-auto bg-[#F9F9F9] rounded-2xl border border-black/[0.06] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {pipeline.current_step === "closed" ? (
                <BadgeCheck className="w-8 h-8 text-[#15803D] shrink-0 fill-[#15803D]/20" />
              ) : pipeline.current_step === "decision" ? (
                <ShieldAlert className="w-8 h-8 text-[#FF4D00] shrink-0 fill-[#FF4D00]/20" />
              ) : (
                <div className="w-8 h-8 rounded-full border-[3px] border-[#FF4D00]/20 border-t-[#FF4D00] animate-spin shrink-0" />
              )}

              <div>
                <h3 className="text-[16px] font-bold text-[#0A0A0A] mb-1">
                  {pipeline.current_step === "closed" ? "Pipeline Execution Complete" :
                    pipeline.current_step === "decision" ? "Awaiting Manual Input" :
                      "Pipeline in Progress"}
                </h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                  {pipeline.current_step === "closed"
                    ? "The system has fully processed and terminated this lifecycle. All deterministic context and vector traces have been successfully flushed to the permanent record."
                    : pipeline.current_step === "decision"
                      ? "The LLM pipeline execution paused. Confidence thresholds required manual supervisor assertion via the Human-in-the-Loop constraint check."
                      : "The background task scheduler is currently evaluating tensors. Depending on payload size, RAG embeddings could drift dynamically."}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
