export interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function Navbar({ sidebarOpen, onSidebarToggle }: NavbarProps) {
  return (
    <header className="h-16 w-full bg-[#E9E9E9] border-b border-black/[0.08] flex items-center px-6 shrink-0">
      <span className="text-sm text-[#ABABAB]">Navbar — coming soon</span>
    </header>
  );
}