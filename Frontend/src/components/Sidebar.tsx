

import { useEffect, useCallback } from "react";
import { useState } from "react";
import { Icons } from "./SidebarIcons";

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeId: string;                      // ← added
  onActiveChange: (id: string) => void;  // ← added
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

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
          <span className="font-semibold flex-1 text-left tracking-tight" style={{ fontSize: 15 }}>
            {item.label}
          </span>
        )}

        {isOpen && item.badge !== undefined && (
          <span className="bg-[#FF4D00] text-white font-bold px-2.5 py-0.5 rounded-full min-w-[24px] text-center shrink-0" style={{ fontSize: 11 }}>
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

export default function Sidebar({ isOpen, onToggle, activeId, onActiveChange }: SidebarProps) {
  // ← activeId & setActiveId removed, now comes from props

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
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        .live-dot { animation: pulse-dot 2.5s ease-in-out infinite; }
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

        {/* ── TOP BAR: Logo + Name + Toggle ── */}
        <div className={[
          "relative z-10 flex items-center shrink-0 border-b border-white/[0.07] py-5",
          isOpen ? "px-5 justify-between" : "px-0 justify-center",
        ].join(" ")}>

          {/* Logo mark + Name */}
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="ResolveX Logo"
              width={36}
              height={36}
              className="shrink-0"
            />
            {isOpen && (
              <p className="font-extrabold tracking-tight text-[#EFEFEF] leading-none" style={{ fontSize: 25 }}>
                Resolve<span className="text-[#FF4D00]">X</span>
                <span style={{ color: "#555" }}>-AI</span>
              </p>
            )}
          </div>

          {/* Toggle button */}
          <button
            onClick={onToggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[#777] hover:text-[#FF4D00] hover:bg-[#FF4D00]/[0.08] hover:border-[#FF4D00]/[0.3] transition-all duration-200 cursor-pointer shrink-0"
          >
            {isOpen ? Icons.chevronLeft : Icons.chevronRight}
          </button>
        </div>

        {/* ── NAV ── */}
        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 flex flex-col gap-6">

          <div className="flex flex-col gap-1.5">
            {isOpen && (
              <p className="font-bold uppercase text-[#404040] px-4 mb-2" style={{ fontSize: 11, letterSpacing: "2.5px" }}>
                Main
              </p>
            )}
            {!isOpen && <div className="h-2" />}
            <ul className="flex flex-col gap-1 p-0 m-0">
              {NAV_MAIN.map(item => (
                <NavRow key={item.id} item={item} isOpen={isOpen} isActive={activeId === item.id} onClick={onActiveChange} />
              ))}
            </ul>
          </div>

          <div className="border-t border-white/[0.06] mx-2" />

          <div className="flex flex-col gap-1.5">
            {isOpen && (
              <p className="font-bold uppercase text-[#404040] px-4 mb-2" style={{ fontSize: 11, letterSpacing: "2.5px" }}>
                System
              </p>
            )}
            <ul className="flex flex-col gap-1 p-0 m-0">
              {NAV_SYSTEM.map(item => (
                <NavRow key={item.id} item={item} isOpen={isOpen} isActive={activeId === item.id} onClick={onActiveChange} />
              ))}
            </ul>
          </div>
        </nav>

        {/* ── BOTTOM ── */}
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
