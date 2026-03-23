import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const PAGE_LABELS: Record<string, string> = {
  overview:  "Overview",
  tickets:   "Tickets",
  decisions: "AI Decisions",
  audit:     "Audit Logs",
  feedback:  "Feedback",
  settings:  "Settings",
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId]       = useState("overview");

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
          {/* Content coming soon */}
        </main>
      </div>
    </div>
  );
}
