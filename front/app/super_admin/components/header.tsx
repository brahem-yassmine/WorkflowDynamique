"use client";

import React from 'react';
import { Bell, Menu, UserCircle, Search, HelpCircle } from 'lucide-react';
import useUser from '@/hooks/useUser';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Hamburger Button */}
        <button
          onClick={toggleSidebar}
          className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl lg:hidden transition-all active:scale-95"
          aria-label="Open Menu"
        >
          <Menu size={22} />
        </button>

        {/* Search Bar - Premium Styled */}
        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl w-80 text-slate-400 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 focus-within:bg-white transition-all duration-200">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations or logs..."
            className="bg-transparent text-sm font-medium outline-none text-slate-600 w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Help Icon */}
        <button className="hidden sm:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <HelpCircle size={20} />
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 bg-rose-500 w-2.5 h-2.5 rounded-full border-2 border-white animate-bounce group-hover:animate-none"></span>
        </button>

        {/* User Profile Section */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-800 leading-none capitalize">
              {user?.firstName || user?.name || user?.email?.split('@')[0] || 'Super Admin'}
            </p>
            <p className="text-[10px] text-indigo-500 mt-1 uppercase font-extrabold tracking-widest flex items-center justify-end gap-1">
              Global Master <span className="w-1 h-1 bg-indigo-500 rounded-full"></span> Territory
            </p>
          </div>
          <div className="relative group cursor-pointer">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm group-hover:shadow-md transition-all">
              <UserCircle size={26} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
