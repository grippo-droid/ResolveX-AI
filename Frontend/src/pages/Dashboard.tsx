import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleToggle = () => setSidebarOpen(v => !v);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggle} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#E9E9E9]">
        <Navbar sidebarOpen={sidebarOpen} onSidebarToggle={handleToggle} />
        <main className="flex-1 overflow-y-auto px-7 py-7" role="main">
          {/* Content coming soon */}
        </main>
      </div>
    </div>
  );
}
