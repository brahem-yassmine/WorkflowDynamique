"use client";

import React from 'react';
import { UserCircle, Search, HelpCircle, Menu } from 'lucide-react';
import useUser from '@/hooks/useUser';
import NotificationBell from '@/components/NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const isDashboard = pathname === '/super_admin';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Hamburger Button */}
        <button
          onClick={toggleSidebar}
          className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
          aria-label="Toggle Menu"
        >
          <Menu size={22} />
        </button>

        {/* Search Bar - Premium Styled - Only visible on the main dashboard */}
        {isDashboard && (
          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl w-80 text-slate-400 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 focus-within:bg-white transition-all duration-200">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search organizations or logs..."
              className="bg-transparent text-sm font-medium outline-none text-slate-600 w-full placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Help Icon */}
        <Link href="/super_admin/feedback" className="hidden sm:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <HelpCircle size={20} />
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile Section */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-800 leading-none capitalize">
              {user?.firstName || user?.name || user?.email?.split('@')[0] || 'Super Admin'}
            </p>
            <p className="text-[10px] text-indigo-500 mt-1 uppercase font-extrabold tracking-widest flex items-center justify-end gap-1">
              {user?.role === 'super_admin' && (
                <>
                  <span>Super Admin</span>
                  <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                </>
              )}
              {user?.role === 'super_admin' ? 'Global Master' : (user?.role || 'Admin')}
            </p>
          </div>
          <Link href="/super_admin/settings" className="relative group cursor-pointer block">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm group-hover:shadow-md transition-all">
              <UserCircle size={26} />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
