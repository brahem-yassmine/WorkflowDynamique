"use client";

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  Zap,
  MessageSquare,
  Activity,
  BarChart4
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import useUser from '@/hooks/useUser';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Global Dashboard", href: "/super_admin" },
  { icon: Building2, label: "Company Management", href: "/super_admin/companies" },
  { icon: CreditCard, label: "Payment", href: "/super_admin/payments" },
  { icon: ShieldCheck, label: "Security", href: "/super_admin/security" },
  { icon: Activity, label: "Log", href: "/super_admin/Log" },
  { icon: BarChart4, label: "Statistics", href: "/super_admin/statistics" },
  { icon: MessageSquare, label: "Companies Feedback", href: "/super_admin/feedback" },
  { icon: Settings, label: " Settings", href: "/super_admin/settings" },
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      router.push('/signin');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={toggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-indigo-700 text-white 
          transition-all duration-300 ease-in-out shadow-2xl
          w-80 lg:translate-x-0 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-indigo-600/50">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Axia Solutions
            </h1>
            <p className="text-[10px] text-indigo-200 uppercase tracking-widest mt-1 font-bold opacity-80">
              {user?.role === 'super_admin' ? 'Super Admin' : (user?.role || 'Admin')}
            </p>
          </div>

          <button
            onClick={toggle}
            className="lg:hidden text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                  ${isActive
                    ? 'bg-white text-indigo-700 shadow-lg shadow-indigo-900/20 font-bold'
                    : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'}
                `}
              >
                <item.icon
                  size={20}
                  className={`transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-indigo-200 group-hover:text-white'}`}
                />
                <span className="text-sm">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* AI Branding/Quick Action Zone */}
        <div className="mx-4 my-6 p-4 bg-indigo-600/50 rounded-2xl border border-indigo-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-tighter">Instance Health</span>
          </div>
          <p className="text-[10px] text-indigo-100 leading-relaxed font-medium">
            System uptime is optimal at 99.9%. All nodes operating normally.
          </p>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-indigo-600/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 w-full rounded-xl transition-all group font-bold"
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-sm">
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
