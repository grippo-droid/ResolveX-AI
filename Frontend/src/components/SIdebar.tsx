import { useState, useEffect, useCallback } from "react";

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const Icons = {
  overview: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
    </svg>
  ),
  tickets: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 8h8M6 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  decisions: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6v5l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  audit: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 6h10M5 10h7M5 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15.5" cy="14.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M17.3 16.3l1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  feedback: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5l2.5 5.5 6-.5-4.5 4 1.5 6L10 14l-5.5 3.5 1.5-6L1.5 7.5l6 .5L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.2 4.2l1.8 1.8M14 14l1.8 1.8M4.2 15.8l1.8-1.8M14 6l1.8-1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11 4.5L6.5 9l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 4.5L11.5 9 7 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const NAV_MAIN: NavItem[] = [
  { id: "overview",  label: "Overview",     icon: Icons.overview              },
  { id: "tickets",   label: "Tickets",      icon: Icons.tickets,   badge: 12  },
  { id: "decisions", label: "AI Decisions", icon: Icons.decisions, badge: 3   },
  { id: "audit",     label: "Audit Logs",   icon: Icons.audit                 },
  { id: "feedback",  label: "Feedback",     icon: Icons.feedback              },
];

const NAV_SYSTEM: NavItem[] = [
  { id: "settings", label: "Settings", icon: Icons.settings },
];

function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none">
      <div className="bg-[#1C1C1C] text-[#E0E0E0] text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10 shadow-2xl">
        {label}
      </div>
    </div>
  );
}

function NavRow({ item, isOpen, isActive, onClick }: {
  item: NavItem;
  isOpen: boolean;
  isActive: boolean;
  onClick: (id: string) => void;
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
            : "border-transparent text-[#888888] hover:bg-white/[0.06] hover:text-[#D4D4D4]",
        ].join(" ")}
      >
        <span className="shrink-0 flex items-center justify-center">{item.icon}</span>

        {isOpen && (
          <span className="text-base font-semibold flex-1 text-left tracking-tight">
            {item.label}
          </span>
        )}

        {isOpen && item.badge !== undefined && (
          <span className="bg-[#FF4D00] text-white text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[24px] text-center shrink-0">
            {item.badge}
          </span>
        )}

        {!isOpen && item.badge !== undefined && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF4D00] border-2 border-[#0D0D0D]" />
        )}
      </button>

      {!isOpen && hovered && (
        <Tooltip label={item.badge ? `${item.label}  ·  ${item.badge}` : item.label} />
      )}
    </li>
  );
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [activeId, setActiveId] = useState("overview");

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "[" && !e.ctrlKey && !e.metaKey && !e.altKey) onToggle();
  }, [onToggle]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.4; transform: scale(1);    }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        .live-dot { animation: pulse-dot 2.5s ease-in-out infinite; }
        @keyframes logo-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .logo-in { animation: logo-in 0.22s ease both; }
      `}</style>

      <aside
        style={{
          width:    isOpen ? "280px" : "76px",
          minWidth: isOpen ? "280px" : "76px",
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
        className="relative flex flex-col h-screen bg-[#0D0D0D] border-r border-white/[0.07] shrink-0 z-40 overflow-hidden"
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-52 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,77,0,0.09) 0%, transparent 100%)" }}
        />

        {/* ── TOP BAR: Logo + Toggle button side by side ── */}
        <div className={[
          "relative z-10 flex items-center shrink-0 border-b border-white/[0.07] py-5",
          isOpen ? "px-5 justify-between" : "px-0 justify-center",
        ].join(" ")}>

          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Icon mark */}
            <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/[0.12] border border-[#FF4D00]/[0.3] flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h5M9 3v5M9 9l4.5 4.5" stroke="#E9E9E9" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="9" cy="9" r="2.2" fill="#FF4D00"/>
              </svg>
            </div>

            {/* Brand name */}
            {isOpen && (
              <div className="logo-in">
                <p className="text-[20px] font-extrabold tracking-tight text-[#EFEFEF] leading-none">
                  Resolve<span className="text-[#FF4D00]">X</span>-AI
                </p>

              </div>
            )}
          </div>

          {/* ── TOGGLE BUTTON — top right, always visible ── */}
          {isOpen && (
            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse  ["
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[#777777] hover:text-[#FF4D00] hover:bg-[#FF4D00]/[0.08] hover:border-[#FF4D00]/[0.3] transition-all duration-200 cursor-pointer shrink-0"
            >
              {Icons.chevronLeft}
            </button>
          )}

          {/* When collapsed — just the expand button */}
          {!isOpen && (
            <button
              onClick={onToggle}
              aria-label="Expand sidebar"
              title="Expand  ["
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[#777777] hover:text-[#FF4D00] hover:bg-[#FF4D00]/[0.08] hover:border-[#FF4D00]/[0.3] transition-all duration-200 cursor-pointer translate-x-1.5"
            >
              {Icons.chevronRight}
            </button>
          )}
        </div>

        {/* ── NAV ── */}
        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 flex flex-col gap-6">

          {/* Main section */}
          <div className="flex flex-col gap-1.5">
            {isOpen && (
              <p className="text-[11px] font-bold tracking-[2.5px] uppercase text-[#404040] px-4 mb-2">
                Main
              </p>
            )}
            {!isOpen && <div className="h-2" />}
            <ul className="flex flex-col gap-1 p-0 m-0">
              {NAV_MAIN.map(item => (
                <NavRow
                  key={item.id}
                  item={item}
                  isOpen={isOpen}
                  isActive={activeId === item.id}
                  onClick={setActiveId}
                />
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06] mx-2" />

          {/* System section */}
          <div className="flex flex-col gap-1.5">
            {isOpen && (
              <p className="text-[11px] font-bold tracking-[2.5px] uppercase text-[#404040] px-4 mb-2">
                System
              </p>
            )}
            <ul className="flex flex-col gap-1 p-0 m-0">
              {NAV_SYSTEM.map(item => (
                <NavRow
                  key={item.id}
                  item={item}
                  isOpen={isOpen}
                  isActive={activeId === item.id}
                  onClick={setActiveId}
                />
              ))}
            </ul>
          </div>
        </nav>

        {/* ── BOTTOM: Live status only ── */}
        <div className={[
          "relative z-10 shrink-0 border-t border-white/[0.07] flex items-center gap-3 py-4",
          isOpen ? "px-5 justify-start" : "px-0 justify-center",
        ].join(" ")}>
          <span className="live-dot block w-2.5 h-2.5 rounded-full bg-[#FF4D00] shrink-0" />
          {isOpen && (
            <span className="text-sm font-medium text-[#444444]">
              System live
            </span>
          )}
        </div>

      </aside>
    </>
  );
}
    