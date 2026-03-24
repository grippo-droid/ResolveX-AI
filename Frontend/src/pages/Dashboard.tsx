import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Simulation from "./Simulation";
import TicketHistory from "./TicketHistory";

const PAGE_LABELS: Record<string, string> = {
  overview:      "Overview",
  tickets:       "Tickets",
  decisions:     "AI Decisions",
  audit:         "Audit Logs",
  feedback:      "Feedback",
  simulation:    "Simulation",
  tickethistory: "Ticket History",
};

const STORAGE_KEY = "resolvex_active_page";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem("resolvex_sidebar") !== "false";
  });

  const [activeId, setActiveId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && PAGE_LABELS[saved] ? saved : "overview";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeId);
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem("resolvex_sidebar", String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleToggle = () => setSidebarOpen(v => !v);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggle}
        activeId={activeId}
        onActiveChange={setActiveId}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#E9E9E9]">
        <Navbar
          sidebarOpen={sidebarOpen}
          onSidebarToggle={handleToggle}
          activeLabel={PAGE_LABELS[activeId] ?? "Dashboard"}
        />
        <main className="flex-1 overflow-y-auto px-7 py-7" role="main">
          {activeId === "simulation"    && <Simulation />}
          {activeId === "tickethistory" && <TicketHistory />}
          {/* other sections coming soon */}
        </main>
      </div>
    </div>
  );
}
