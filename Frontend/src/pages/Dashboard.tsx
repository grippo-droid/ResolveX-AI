import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar  from "../components/Navbar";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set body overflow to hidden ONLY while on dashboard
  // Restore it when navigating away (e.g. back to landing page)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleToggle = () => {
    try {
      setSidebarOpen(v => !v);
    } catch (err) {
      console.error("[Dashboard] sidebar toggle error:", err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">

      {/* Sidebar — black theme, collapsible */}
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggle} />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#E9E9E9]">

        {/* Navbar */}
        <Navbar sidebarOpen={sidebarOpen} onSidebarToggle={handleToggle} />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto px-7 py-7" role="main">
          {/* Content coming soon */}
        </main>

      </div>
    </div>
  );
}