'use client';

import { useState, useEffect } from 'react';
import UserSidebar from "./comp";
import Header from "./header";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { usePathname } from 'next/navigation';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const isFullscreenPage = pathname.includes('/User/create_workflows') || pathname.startsWith('/User/MODULES') || pathname.startsWith('/User/create') || pathname.startsWith('/User/Workflows/');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* Sidebar Section */}
      {!isFullscreenPage && (
        <div className={`
          fixed inset-y-0 left-0 z-50 bg-white transition-all duration-300 ease-in-out lg:relative flex-none shadow-2xl lg:shadow-none border-r border-slate-200
          ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:-ml-72 w-72'}
        `}>
          <div className="h-full">
            <UserSidebar />
            {/* Mobile Close Button Inside Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-[-48px] bg-white text-indigo-600 p-2 rounded-r-xl lg:hidden shadow-xl border-y border-r border-slate-100"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {!isFullscreenPage && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Content Vertical Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Existing Dynamic Header (Desktop & Mobile) */}
        {!isFullscreenPage && (
          <div className="flex-none">
            <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>
        )}

        {/* Main Fluid Content */}
        <main className={`flex-1 overflow-y-auto ${isFullscreenPage ? 'p-0' : 'p-4 sm:p-6 md:p-8'} bg-[#F8FAFC]`}>
          <div className={isFullscreenPage ? 'h-full w-full' : 'max-w-7xl mx-auto'}>
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
