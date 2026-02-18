"use client";

import React from 'react';
import { Bell, Menu, UserCircle, Search } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Hamburger Button */}
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
        
        {/* Search Bar (Optional but looks professional) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md w-64 text-slate-400 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
          <Search size={16} />
          <input type="text" placeholder="Search..." className="bg-transparent text-sm outline-none text-slate-600 w-full" />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 bg-red-500 w-2 h-2 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-900 leading-none">Axia Solutions</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">Administrator</p>
          </div>
          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
            <UserCircle size={28} />
          </div>
        </div>
      </div>
    </header>
  );
}