"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  X 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Global Dashboard", href: "/super_admin" },
  { icon: Building2, label: "Company Management", href: "/super_admin/companies" },
  { icon: CreditCard, label: "Subscriptions & Payments", href: "/super_admin/payments" },
  { icon: ShieldCheck, label: "Security & Logs", href: "/super_admin/security" },
  { icon: Settings, label: "Platform Settings", href: "/super_admin/settings" },
];

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const router = useRouter();

  // ✅ LOGOUT FUNCTION
  const handleLogout = () => {
    try {
      // Supprimer toutes les données d'authentification
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');

      // Optionnel : tout nettoyer
      // localStorage.clear();

      // Redirection vers la page login
      router.push('/signin');
      router.refresh(); // 🔥 force refresh propre

    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden" 
          onClick={toggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-gray-900 text-white 
          transition-transform duration-300 ease-in-out
          w-64 lg:translate-x-0 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Axia Solutions
            </h1>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest mt-1 font-semibold">
              Super Admin
            </p>
          </div>

          <button 
            onClick={toggle} 
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-all group"
            >
              <item.icon 
                size={20} 
                className="group-hover:text-blue-400" 
              />
              <span className="font-medium text-sm">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full rounded-lg transition-colors group"
          >
            <LogOut 
              size={20} 
              className="group-hover:translate-x-1 transition-transform" 
            />
            <span className="font-medium text-sm">
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
