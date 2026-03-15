'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  ShieldCheck,
  GitBranch,
  PlusSquare,
  CheckSquare,
  FolderKanban,
  CreditCard,
  FileText,
  UserCircle,
  LogOut,
  Zap,
  ChevronRight,
  ListTodo,
  Activity,
  Briefcase,
  LifeBuoy
} from 'lucide-react';

const menuGroups = [
  {
    title: "Global",
    items: [
      { icon: LayoutDashboard, label: "Command Center", href: "/admin" },
      { icon: Activity, label: "Live Operations Global", href: "/admin/operations" },
      { icon: GitBranch, label: "All workflows", href: "/admin/workflows" },
      { icon: ListTodo, label: "Checklists", href: "/admin/AllCheck" },
      { icon: FileText, label: "Formulaires", href: "/admin/AllForms" },
      { icon: FolderKanban, label: "Kanbans", href: "/admin/AllKanban" },
    ]
  },
  {
    title: "Spécifique",
    items: [
      { icon: Briefcase, label: "Project workspace", href: "/admin/projects" },
      { icon: Zap, label: "Standard Flows", href: "/admin/workflows/standard" },
    ]
  },
  {
    title: "Configuration and Security",
    items: [
      { icon: UserCircle, label: "Profile", href: "/admin/profile" },
      { icon: FileText, label: "Logs", href: "/admin/logs" },
      { icon: CreditCard, label: "Billing", href: "/admin/billing" },
      { icon: LifeBuoy, label: "Reports", href: "/admin/reports" },
    ]
  },
  {
    title: "Permission and User",
    items: [
      { icon: LayoutGrid, label: "Domain", href: "/admin/domains" },
      { icon: ShieldCheck, label: "Roles", href: "/admin/roles" },
      { icon: Users, label: "User", href: "/admin/userManagement" },
    ]
  }
];

function Sidebar({ isExpired = false }: { isExpired?: boolean }) {
  const pathname = usePathname();
  const { subscriptionExpired } = useAuth();

  // Combine local and auth state
  const effectiveExpired = isExpired || subscriptionExpired;

  return (
    <aside className="w-full bg-indigo-700 text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-900/20 rounded-full -ml-12 -mb-12 blur-xl"></div>

      <div className="p-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <Zap size={22} className="text-indigo-600 fill-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">Axia Core</h1>
            <p className="text-[10px] text-indigo-200 font-black uppercase tracking-widest opacity-80">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-2 overflow-y-auto px-4 space-y-8 relative z-10 custom-scrollbar pb-10">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <h2 className="px-4 text-[14px] font-black text-indigo-200/60 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 bg-white/40 rounded-full"></span>
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item, index) => {
                const isActive = pathname === item.href;
                const isBilling = item.href === '/admin/billing';
                const isRestricted = effectiveExpired && !isBilling;

                return (
                  <Link
                    key={index}
                    href={isRestricted ? '#' : item.href}
                    onClick={(e) => {
                      if (isRestricted) {
                        e.preventDefault();
                        toast.error("Access Restricted: Subscription Protocol Terminated.", {
                          description: "Please renew your matrix access in the Fiscal center.",
                        });
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                      ${isActive
                        ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-900/20 font-black'
                        : 'text-indigo-100 hover:bg-white/10 hover:text-white font-bold'}
                      ${isRestricted ? 'grayscale blur-[1px] opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <item.icon size={18} className={`${isActive ? 'text-indigo-600' : 'text-indigo-300 group-hover:text-white'} transition-colors`} />
                    <span className="text-xs tracking-tight flex-1">
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                      />
                    )}
                    {!isActive && !isRestricted && (
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 mt-auto relative z-10">
        {effectiveExpired ? (
          <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-400/30 mb-6 animate-pulse">
            <div className="flex items-center gap-2 mb-2 text-rose-300">
              <Zap size={14} className="fill-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Protocol Terminal</span>
            </div>
            <p className="text-[11px] font-black text-white uppercase tracking-tight">Access Restricted</p>
          </div>
        ) : (
          <div className="bg-indigo-800/50 rounded-2xl p-4 border border-indigo-400/20 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Lattice Security</span>
            </div>
            <p className="text-[11px] font-bold text-white/90">Master Node Active</p>
          </div>
        )}

        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tenant');
            localStorage.removeItem('tenantId');
            localStorage.removeItem('user_pass_sync');
            window.location.href = '/signin';
          }}
          className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/10 hover:text-white rounded-2xl w-full transition-all group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold tracking-tight">Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
