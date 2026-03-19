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
  LifeBuoy,
  Stethoscope
} from 'lucide-react';

const menuGroups = [
  {
    title: "Global",
    items: [
      { icon: LayoutGrid, label: "Command Center", href: "/admin" },
      { icon: Activity, label: "Live Operations Global", href: "/admin/operations" },
      { icon: Stethoscope, label: "All workflows", href: "/admin/workflows" },
      { icon: ListTodo, label: "Checklists", href: "/admin/AllCheck" },
      { icon: FileText, label: "Forms", href: "/admin/AllForms" },
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
            <Zap size={26} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">Axia Core</h1>
            <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest mt-1.5">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-2 overflow-y-auto px-4 space-y-8 relative z-10 scrollbar-hide pb-10">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <h2 className="px-4 text-[11px] font-black text-indigo-200/50 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full"></span>
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
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-5 border border-white/5 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></div>
              <span className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.2em]">Lattice Security</span>
            </div>
            <p className="text-xs font-bold text-white tracking-tight">Master Node Active</p>
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
          className="flex items-center gap-4 px-4 py-3 text-indigo-100 hover:bg-white/10 hover:text-white rounded-2xl w-full transition-all group"
        >
          <div className="w-9 h-9 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <LogOut size={16} />
          </div>
          <span className="text-xs font-bold tracking-tight">Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
