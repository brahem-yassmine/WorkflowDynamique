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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        fixed inset-y-0 left-0 z-50 bg-indigo-700 transition-all duration-300 ease-in-out lg:relative flex-none
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:-ml-64 w-64'}
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
