"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/header';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useUser from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== 'super_admin') {
      console.warn('🛑 Unauthorized access to Super Admin area. Redirecting...');
      router.push('/admin');
    }
  }, [user, loading, router]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar with responsive behavior */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform bg-indigo-700 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 flex-none
      `}>
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
        {/* Mobile Close Button Overlay */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-[-48px] bg-indigo-700 text-white p-2 rounded-r-xl lg:hidden shadow-xl"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Navbar Header */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shadow-sm flex-none">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <MenuIcon />
          </button>
          <span className="text-sm font-extrabold text-slate-800 tracking-tighter uppercase">Super Admin</span>
        </div>

        {/* Desktop/Common Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Scrollable Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}