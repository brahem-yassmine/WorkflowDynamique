'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import UserSidebar from "../User/comp";
import UserHeader from "../User/header";
import AdminSidebar from "../admin/components/sidebar";
import AdminHeader from "../admin/components/header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setRole(user.role);
    }
  }, []);

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isMonitorPage = pathname.includes('/Workflows/instances/');

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* Sidebar Section */}
      {!isMonitorPage && (
        <>
          {/* Mobile Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <div className={`
            fixed inset-y-0 left-0 z-50 bg-white transition-all duration-300 ease-in-out lg:relative flex-none shadow-2xl lg:shadow-none
            ${role === 'admin' || role === 'super_admin' ? 'border-r-0' : 'border-r border-slate-200'}
            ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:-ml-72 w-72'}
          `}>
            <div className={`h-full ${role === 'admin' || role === 'super_admin' ? '' : 'bg-white'}`}>
              {isAdmin ? <AdminSidebar /> : <UserSidebar />}
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-[-48px] bg-indigo-700 text-white p-2 rounded-r-lg lg:hidden shadow-lg shadow-indigo-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </>
      )}

      {/* Content Vertical Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Dynamic Header */}
        <div className="flex-none">
          {isAdmin ? (
            <AdminHeader
              title="Execution Monitor"
              subtitle="Real-time flow forensic and node synchronization audit."
              toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            />
          ) : (
            <UserHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          )}
        </div>

        {/* Main Fluid Content */}
        <main className={`flex-1 overflow-y-auto ${isMonitorPage ? 'p-0' : 'p-4 sm:p-6 md:p-8'} bg-[#F8FAFC]`}>
          <div className={isMonitorPage ? "h-full w-full" : "max-w-7xl mx-auto"}>
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
