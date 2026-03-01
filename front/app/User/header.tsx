'use client';

import { Search, HelpCircle, User, Bell } from 'lucide-react';
import useUser from '@/hooks/useUser';
import NotificationBell from '@/components/NotificationBell';

export default function Header() {
  const { user, tenant } = useUser();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
      {/* Search Bar for Traceability */}
      <div className="relative w-96 font-sans">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search workflow history or nodes..."
          className="w-full bg-slate-50 border border-slate-100 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 cursor-pointer transition-all group">
          <HelpCircle size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-bold">Documentation</span>
        </div>

        <div className="h-8 w-px bg-slate-100 mx-2"></div>
        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 leading-none capitalize">
              {user?.firstName || user?.name || user?.email?.split('@')[0] || 'Member'}
            </p>
            <div className="flex items-center gap-1.5 mt-1 justify-end">
              <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">
                {user?.role || 'User'}
              </span>
              {tenant?.name && (
                <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[80px]">
                  {tenant.name}
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-100 transition-all active:scale-95">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
