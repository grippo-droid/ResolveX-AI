import { useState, useEffect } from "react";

interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  activeLabel: string;        // ← added
}

export default function Navbar({ sidebarOpen, onSidebarToggle, activeLabel }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const onScroll = () => setScrolled(main.scrollTop > 10);
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  return (
   <header
  className={[
    "shrink-0 h-16 flex items-center justify-between px-7 z-30 transition-all duration-300 border-b border-black/20",
    scrolled
      ? "bg-[#E9E9E9]/90 backdrop-blur-md shadow-[0_1px_0_rgba(10,10,10,0.08)]"
      : "bg-transparent",
  ].join(" ")}
>
      {/* Left — sidebar toggle (mobile) + page title */}
      <div className="flex items-center gap-4">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onSidebarToggle}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-1"
        >
          <span className={`block w-5 h-0.5 bg-[#0A0A0A] rounded transition-transform duration-200 ${sidebarOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#0A0A0A] rounded transition-opacity duration-200 ${sidebarOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#0A0A0A] rounded transition-transform duration-200 ${sidebarOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        {/* Page title */}
        <div>
          <h1 className="text-[25px] font-bold text-[#0A0A0A] tracking-tight leading-none">
            {activeLabel}     {/* ← was hardcoded "Dashboard" */}
          </h1>
          <p className="text-[12px] text-[#6B6B6B] mt-0.5">
            Welcome back — system is live
          </p>
        </div>
      </div>

      {/* Right — status pill + avatar */}
      <div className="flex items-center gap-3">

        {/* Live status */}
        <div className="hidden sm:flex items-center gap-2 bg-white/60 border border-black/10 rounded-full px-3.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0 animate-pulse" />
          <span className="text-[12px] font-medium text-[#0A0A0A]">All systems operational</span>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-[#FF4D00]/50 transition-all duration-200">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="5.5" r="2.5" stroke="#E9E9E9" strokeWidth="1.3"/>
            <path d="M2.5 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#E9E9E9" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>

      </div>
    </header>
  );
}
