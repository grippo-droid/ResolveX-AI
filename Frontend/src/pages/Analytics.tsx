import { useState, useEffect } from "react";
import { getAnalyticsSummary, type AnalyticsSummary } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  BarChart3, AlertCircle, CheckCircle2, Clock, Zap, 
  Target, LayoutGrid, Smartphone, ShieldAlert, Wifi, Monitor, KeyRound, Lightbulb
} from "lucide-react";

function toPercent(num: number | undefined | null) {
  if (num == null) return 0;
  return num <= 1 ? Math.round(num * 100) : Math.round(num);
}

// Brand Colors
const COLORS = ['#FF4D00', '#15803D', '#2563EB', '#6B6B6B', '#8B5CF6', '#F59E0B'];
const STATUS_COLORS = {
  open: "#2563eb",
  in_progress: "#f59e0b",
  auto_resolved: "#15803d",
  escalated: "#FF4D00",
  closed: "#6B6B6B"
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsSummary()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 relative overflow-hidden bg-[#FAFAFA]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] sm:w-[600px] h-[100vw] sm:h-[600px] bg-[#FF4D00]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-[3px] border-black/[0.04]" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{ borderTopColor: "#FF4D00", animation: "spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite" }} />
      </div>
      <p className="text-[14px] font-medium text-[#6B6B6B] tracking-wide uppercase">Initializing Intelligence...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 relative bg-[#FAFAFA]">
      <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <div className="text-center">
        <p className="text-[18px] font-bold text-[#0A0A0A] mb-1.5">Analytics Unavailable</p>
        <p className="text-[14px] text-[#6B6B6B]">{error || "No intelligence data available at the moment."}</p>
      </div>
      <button onClick={() => window.location.reload()}
        className="text-[14px] font-bold text-white bg-[#FF4D00] px-6 py-3 rounded-xl border-none cursor-pointer hover:bg-[#e64400] transition-all shadow-lg shadow-[#FF4D00]/30 hover:shadow-[#FF4D00]/40 hover:-translate-y-0.5">
        Refresh Dashboard
      </button>
    </div>
  );

  const stats = data.ticket_stats;
  const conf = data.confidence_stats;
  const cats = data.category_breakdown.category_counts;

  const autoResolvable = stats.auto_resolved;
  const autoResolvedPercent = stats.total_tickets > 0 ? Math.round((autoResolvable / stats.total_tickets) * 100) : 0;
  const escalatedPercent = stats.total_tickets > 0 ? Math.round((stats.escalated / stats.total_tickets) * 100) : 0;
  const confAvg = toPercent(conf.avg_confidence);

  // Format data for Recharts
  const statusChartData = [
    { name: 'Open', value: stats.open_tickets, color: STATUS_COLORS.open },
    { name: 'Escalated', value: stats.escalated, color: STATUS_COLORS.escalated },
    { name: 'Auto-Resolved', value: stats.auto_resolved, color: STATUS_COLORS.auto_resolved },
    { name: 'Closed', value: stats.closed, color: STATUS_COLORS.closed },
  ].filter(d => d.value > 0);

  const categoryChartData = Object.entries(cats || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
  })).sort((a, b) => b.value - a.value);

  // Custom Category Icons mapping
  const getCatIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'software': return <Monitor className="w-4 h-4" />;
      case 'hardware': return <Smartphone className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'access_permission': return <KeyRound className="w-4 h-4" />;
      case 'security': return <ShieldAlert className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] overflow-hidden relative">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(0,0,0,0.04); }
        .recharts-tooltip-wrapper { outline: none !important; }
      `}</style>
      
      {/* Subtle Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[100vw] sm:w-[500px] h-[100vw] sm:h-[500px] bg-black/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[600px] h-[100vw] sm:h-[600px] bg-black/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="flex flex-col gap-8 w-full max-w-[1300px] mx-auto px-4 lg:px-6 py-8 sm:py-10 relative z-10 fade-up">
        
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-2 px-3 py-1.5 rounded-full bg-black/[0.03] border border-black/[0.05]">
              <BarChart3 className="w-4 h-4 text-[#FF4D00]" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-[#6B6B6B]">Intelligence Overview</span>
            </div>
            <h2 className="text-[36px] font-extrabold tracking-tight text-[#0A0A0A] leading-tight">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#f97316]">Analytics</span>
            </h2>
            <p className="text-[15px] text-[#6B6B6B] mt-1 max-w-xl">
              Real-time insights across {stats.total_tickets} support incidents flowing through the AI resolution pipeline.
            </p>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 fade-up delay-1">
          
          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.02] rounded-bl-full transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-6 relative">
              <span className="text-[12px] font-bold text-[#6B6B6B] uppercase tracking-[1.2px]">Total Volume</span>
              <div className="w-10 h-10 bg-white shadow-sm border border-black/[0.05] rounded-xl flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-[#0A0A0A]" />
              </div>
            </div>
            <div className="relative">
              <p className="text-[42px] font-black text-[#0A0A0A] leading-none tracking-tight mb-2">{stats.total_tickets}</p>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="text-[13px] font-semibold text-[#6B6B6B]">All recorded incidents</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.02] rounded-bl-full transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-6 relative">
              <span className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">Auto-Resolved</span>
              <div className="w-10 h-10 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#15803D]" />
              </div>
            </div>
            <div className="relative">
              <p className="text-[42px] font-black text-[#0A0A0A] leading-none tracking-tight mb-2">{autoResolvable}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 bg-black/5 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#15803D] rounded-full" style={{ width: `${autoResolvedPercent}%` }} />
                </div>
                <span className="text-[12px] font-bold text-[#15803D]">{autoResolvedPercent}%</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.02] rounded-bl-full transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-6 relative">
              <span className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#6B6B6B]">Escalated (HITL)</span>
              <div className="w-10 h-10 bg-[#fff7f5] border border-[#ffd0c0] rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#FF4D00]" />
              </div>
            </div>
            <div className="relative">
              <p className="text-[42px] font-black text-[#0A0A0A] leading-none tracking-tight mb-2">{stats.escalated}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 bg-black/5 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF4D00] rounded-full" style={{ width: `${escalatedPercent}%` }} />
                </div>
                <span className="text-[12px] font-bold text-[#FF4D00]">{escalatedPercent}%</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#FF4D00] to-[#15803D]" />
            <div className="flex items-center justify-between mb-6 relative">
              <span className="text-[12px] font-bold text-[#6B6B6B] uppercase tracking-[1.2px]">AI Confidence</span>
              <div className="w-10 h-10 bg-white shadow-sm border border-black/[0.05] rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-[#0A0A0A]" />
              </div>
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[42px] font-black text-[#0A0A0A] leading-none tracking-tight mb-2">{confAvg}%</p>
                <div className="flex items-center gap-1.5 opacity-80">
                  <span className="text-[13px] font-semibold text-[#6B6B6B]">Average certainty</span>
                </div>
              </div>
              <div className="w-16 h-16 shrink-0 relative">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-black/[0.05]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="3"
                    />
                    <path
                      className={confAvg > 70 ? "text-[#15803D]" : confAvg > 40 ? "text-[#f59e0b]" : "text-[#FF4D00]"}
                      strokeDasharray={`${confAvg}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                    />
                  </svg>
              </div>
            </div>
          </div>

        </div>

        {/* ── Main Dashboard Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up delay-2">
          
          {/* Status Distribution Donut Chart */}
          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <h3 className="text-[16px] font-bold text-[#0A0A0A] tracking-tight">Status Distribution</h3>
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"><Clock className="w-4 h-4 text-[#6B6B6B]" /></div>
            </div>
            <div className="w-full h-[280px] mt-4 relative">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#0A0A0A' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#6B6B6B] text-[13px] font-medium">No Status Data</div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 w-full">
              {statusChartData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[12px] font-semibold text-[#6B6B6B]">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Bar Chart */}
          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-bold text-[#0A0A0A] tracking-tight">Incidents by Expert Category</h3>
            </div>
            <div className="w-full h-[300px] flex-1">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B6B6B', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B6B6B', fontSize: 12, fontWeight: 600 }} />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#6B6B6B] text-[13px] font-medium">No Category Data</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Additional Analytics Details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up delay-3 pb-8">
          
          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border-t-[4px] border-t-[#0A0A0A]">
            <h3 className="text-[15px] font-bold text-[#0A0A0A] tracking-tight mb-5">Predictive Certainty Breakdown</h3>
            <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-6">
              AI resolution confidence ranges directly affect routing. High confidence (≥70%) leads to auto-resolution, 
              while lower certainty requires human-in-the-loop expert attention.
            </p>
            <div className="flex flex-col gap-5">
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-[#15803D]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#15803D]">High Confidence</h4>
                    <p className="text-[12px] text-[#15803D]/70 font-semibold mt-0.5">Automated perfectly</p>
                  </div>
                </div>
                <div className="text-[24px] font-black text-[#15803D]">{conf.high_confidence_count}</div>
              </div>

              <div className="bg-[#fff7f5] border border-[#ffd0c0] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-[#FF4D00]">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#FF4D00]">Low Confidence</h4>
                    <p className="text-[12px] text-[#FF4D00]/70 font-semibold mt-0.5">Routed to experts</p>
                  </div>
                </div>
                <div className="text-[24px] font-black text-[#FF4D00]">{conf.low_confidence_count}</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h3 className="text-[15px] font-bold text-[#0A0A0A] tracking-tight mb-5">System Automation Efficiency</h3>
            <div className="flex flex-col gap-5 mt-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#6B6B6B]">Auto-Resolution Rate</span>
                  <span className="text-[14px] font-bold text-[#15803D]">{autoResolvedPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#15803D] rounded-full" style={{ width: `${autoResolvedPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#6B6B6B]">Escalation Rate</span>
                  <span className="text-[14px] font-bold text-[#f59e0b]">{escalatedPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#f59e0b] rounded-full" style={{ width: `${escalatedPercent}%` }} />
                </div>
              </div>

              <div className="mt-4 pt-5 border-t border-black/5 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                  The system is currently auto-resolving {autoResolvedPercent}% of all incoming requests without human intervention, significantly lowering manual support time.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
