'use client';

import { Search, HelpCircle, User, Bell, Menu, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import useUser from '@/hooks/useUser';
import NotificationBell from '@/components/NotificationBell';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, tenant } = useUser();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-[100] transition-all duration-300">
      <div className="flex items-center gap-6">
        {/* Hamburger - Squared & Premium */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-12 h-12 bg-white border border-slate-100 flex items-center justify-center rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all active:scale-95 group"
            aria-label="Toggle Menu"
          >
            <Menu size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        )}

        {/* Search Bar - Refined */}
        <div className="relative group hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search tasks, workflows, or projects..."
            className="w-[400px] h-12 bg-slate-50/50 border border-slate-100 pl-12 pr-4 rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:w-[450px] transition-all font-bold text-slate-600 placeholder:text-slate-300 shadow-sm"
          />
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-6">
        <Link href="/User/Help&FirstSteps" className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group">
          <HelpCircle size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:rotate-12 transition-all" />
        </Link>

        <div className="h-8 w-px bg-slate-100 mx-1"></div>

        <div className="relative">
          <NotificationBell />
        </div>

        <Link href="/User/prof" className="flex items-center gap-4 bg-slate-50/80 p-1.5 pr-4 rounded-[20px] border border-slate-100/50 group hover:border-indigo-100 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-[15px] bg-white border border-slate-100 flex items-center justify-center text-slate-400 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/20 group-hover:-rotate-3 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>

          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-black text-slate-900 leading-none capitalize tracking-tight">
                {user?.firstName || user?.name || user?.email?.split('@')[0] || 'Member'}
              </p>
              <ShieldCheck size={10} className="text-indigo-400" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] text-white font-black uppercase tracking-widest bg-indigo-600 px-1.5 py-0.5 rounded-[4px] shadow-sm shadow-indigo-200">
                {user?.specificRole || (user?.role === 'admin' ? 'Member' : user?.role) || 'User'}
              </span>
              {tenant?.name && (
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[70px]">
                  {tenant.name}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}

