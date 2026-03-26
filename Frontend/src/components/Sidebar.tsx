import { useEffect, useCallback, useState } from "react";
import { Icons } from "./SidebarIcons";

// ── Types ──────────────────────────────────────────────────────────────────
export interface SidebarProps {
  isOpen:         boolean;
  onToggle:       () => void;
  activeId:       string;
  onActiveChange: (id: string) => void;
  badgeCounts?:   Record<string, number>;  // ✅ live counts from DB
}

interface NavItem {
  id:     string;
  label:  string;
  icon:   React.ReactNode;
  badge?: number;
}

// ── Nav Items — NO hardcoded badges ───────────────────────────────────────
const NAV_MAIN: NavItem[] = [
  { id: "overview",  label: "Overview",     icon: Icons.overview  },
  { id: "tickets",   label: "Tickets",      icon: Icons.tickets   },
  { id: "audit",     label: "Audit Logs",   icon: Icons.audit     },
];

const NAV_TRIAL: NavItem[] = [
  { id: "simulation",    label: "Simulation",     icon: Icons.simulation },
  { id: "tickethistory", label: "Ticket History", icon: Icons.history    },
];

// ── Tooltip ────────────────────────────────────────────────────────────────
function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none">
      <div className="bg-[#1C1C1C] text-[#E0E0E0] text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10 shadow-2xl">
        {label}
      </div>
    </div>
  );
}

// ── NavRow ─────────────────────────────────────────────────────────────────
function NavRow({ item, isOpen, isActive, onClick }: {
  item:     NavItem;
  isOpen:   boolean;
  isActive: boolean;
  onClick:  (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <li className="relative list-none">
      <button
        onClick={() => onClick(item.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={[
          "w-full flex items-center rounded-xl border outline-none cursor-pointer transition-all duration-200",
          isOpen ? "gap-3.5 px-4 py-3.5" : "justify-center px-0 py-3.5",
          isActive
            ? "bg-[#FF4D00]/[0.12] border-[#FF4D00]/[0.3] text-[#FF4D00]"
            : "border-transparent text-[#C4C4C4] hover:bg-white/[0.06] hover:text-[#ffffff]",
        ].join(" ")}
      >
        <span className="shrink-0 flex items-center justify-center">{item.icon}</span>

        {isOpen && (
          <span className="font-semibold flex-1 text-left tracking-tight" style={{ fontSize: 15 }}>
            {item.label}
          </span>
        )}

        {/* Badge — expanded sidebar */}
        {isOpen && item.badge !== undefined && item.badge > 0 && (
          <span
            className="text-white font-bold px-2.5 py-0.5 rounded-full min-w-[24px] text-center shrink-0 transition-all duration-300"
            style={{ fontSize: 11, background: "#FF4D00" }}
          >
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}

        {/* Badge dot — collapsed sidebar */}
        {!isOpen && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF4D00] border-2 border-[#0D0D0D]" />
        )}
      </button>

      {/* Tooltip on hover when collapsed */}
      {!isOpen && hovered && (
        <Tooltip
          label={item.badge && item.badge > 0
            ? `${item.label}  ·  ${item.badge > 99 ? "99+" : item.badge}`
            : item.label}
        />
      )}
    </li>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────────────
export default function Sidebar({
  isOpen,
  onToggle,
  activeId,
  onActiveChange,
  badgeCounts = {},
}: SidebarProps) {

  // Keyboard shortcut: [ to toggle sidebar
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "[" && !e.ctrlKey && !e.metaKey && !e.altKey) onToggle();
  }, [onToggle]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Inject live badge counts into nav items
  const enrichedMain = NAV_MAIN.map(item => ({
    ...item,
    badge: badgeCounts[item.id] ?? undefined,
  }));

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.4; transform: scale(1);   }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        .live-dot { animation: pulse-dot 2.5s ease-in-out infinite; }
      `}</style>

      <aside
        style={{
          width:      isOpen ? "280px" : "76px",
          minWidth:   isOpen ? "280px" : "76px",
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
        className={[
          "flex flex-col h-screen bg-[#0D0D0D] border-r border-white/[0.07] shrink-0 overflow-hidden",
          "max-md:fixed max-md:top-0 max-md:left-0 max-md:bottom-0 max-md:z-50 md:relative md:z-40",
          !isOpen ? "max-md:-translate-x-full" : "max-md:translate-x-0"
        ].join(" ")}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-52 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,77,0,0.09) 0%, transparent 100%)" }}
        />

        {/* ── Logo ── */}
        <div className={[
          "relative z-10 flex items-center shrink-0 border-b border-white/[0.07] py-5",
          isOpen ? "px-5 justify-start" : "px-0 justify-center",
        ].join(" ")}>
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="ResolveX Logo" width={36} height={36} className="shrink-0" />
            {isOpen && (
              <p className="font-extrabold tracking-tight text-[#EFEFEF] leading-none" style={{ fontSize: 25 }}>
                Resolve<span className="text-[#FF4D00]">X</span>
                <span style={{ color: "#555" }}>-AI</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 flex flex-col gap-6">

          {/* Main section */}
          <div className="flex flex-col gap-1.5">
            <div className={[
              "flex items-center mb-2",
              isOpen ? "px-4 justify-between" : "justify-center",
            ].join(" ")}>
              {isOpen && (
                <p className="font-bold uppercase text-[#6b6b6b]" style={{ fontSize: 11, letterSpacing: "2.5px" }}>
                  Main
                </p>
              )}
              {/* Toggle button */}
              <button
                onClick={onToggle}
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                className="flex items-center justify-center w-7 h-7 rounded-lg border cursor-pointer transition-all duration-200 shrink-0"
                style={{
                  background:  "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.18)",
                  color:       "#D4D4D4",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background  = "rgba(255,77,0,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,77,0,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.color       = "#FF4D00";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background  = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)";
                  (e.currentTarget as HTMLButtonElement).style.color       = "#D4D4D4";
                }}
              >
                {isOpen ? Icons.chevronLeft : Icons.chevronRight}
              </button>
            </div>

            {!isOpen && <div className="h-1" />}

            <ul className="flex flex-col gap-1 p-0 m-0">
              {enrichedMain.map(item => (        // ✅ use enrichedMain with live badges
                <NavRow
                  key={item.id}
                  item={item}
                  isOpen={isOpen}
                  isActive={activeId === item.id}
                  onClick={onActiveChange}
                />
              ))}
            </ul>
          </div>

          <div className="border-t border-white/[0.06] mx-2" />

          {/* Trial section */}
          <div className="flex flex-col gap-1.5">
            {isOpen && (
              <p className="font-bold uppercase text-[#6b6b6b] px-4 mb-2" style={{ fontSize: 11, letterSpacing: "2.5px" }}>
                Trial
              </p>
            )}
            <ul className="flex flex-col gap-1 p-0 m-0">
              {NAV_TRIAL.map(item => (
                <NavRow
                  key={item.id}
                  item={item}
                  isOpen={isOpen}
                  isActive={activeId === item.id}
                  onClick={onActiveChange}
                />
              ))}
            </ul>
          </div>

        </nav>

        {/* ── Bottom status ── */}
        <div className={[
          "relative z-10 shrink-0 border-t border-white/[0.07] flex items-center gap-3 py-4",
          isOpen ? "px-5 justify-start" : "px-0 justify-center",
        ].join(" ")}>
          <span className="live-dot block w-2.5 h-2.5 rounded-full bg-[#FF4D00] shrink-0" />
          {isOpen && (
            <span className="font-medium text-[#444]" style={{ fontSize: 13 }}>
              System live
            </span>
          )}
        </div>

      </aside>
    </>
  );
}
