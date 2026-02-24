'use client';

import { useState } from 'react';
import UserSidebar from "./comp";
import Header from "./header";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* Sidebar Section */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-72
      `}>
        <div className="h-full bg-white border-r border-slate-200 shadow-2xl lg:shadow-none">
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

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Content Vertical Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Header Toggle Bar */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm flex-none">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <MenuIcon />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-sm font-extrabold text-slate-800 tracking-tighter uppercase">Axia Pro</span>
          </div>
        </div>

        {/* Existing Dynamic Header (Desktop & Mobile) */}
        <div className="flex-none">
          <Header />
        </div>

        {/* Main Fluid Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}