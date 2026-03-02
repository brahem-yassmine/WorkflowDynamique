'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setRole(user.role);
    }
  }, []);

  const isAdmin = role === 'admin' || role === 'super_admin';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">

      {/* Sidebar Section */}
      <div className="w-64 flex-none">
        <div className="h-full bg-white border-r border-slate-200">
          {isAdmin ? <AdminSidebar /> : <UserSidebar />}
        </div>
      </div>

      {/* Content Vertical Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Dynamic Header */}
        <div className="flex-none">
          {isAdmin ? (
            <AdminHeader
              title="Execution Monitor"
              subtitle="Real-time flow forensic and node synchronization audit."
            />
          ) : (
            <UserHeader />
          )}
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
