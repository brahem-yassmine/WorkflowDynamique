'use client';

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
  ListTodo
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: "Command Center", href: "/admin" },
  { icon: Users, label: "User Network", href: "/admin/userManagement" },
  { icon: LayoutGrid, label: "Structural Domains", href: "/admin/domains" },
  { icon: ShieldCheck, label: "Authority Roles", href: "/admin/roles" },
  { icon: FolderKanban, label: "Project ", href: "/admin/projects" },
  { icon: GitBranch, label: "All Workflows", href: "/admin/workflows" },
  { icon: PlusSquare, label: "create Workflow", href: "/admin/create_workflows" },
  { icon: FolderKanban, label: "Kanban Boards", href: "/admin/AllKanban" },
  { icon: ListTodo, label: "All Checklists", href: "/admin/AllCheck" },
  { icon: CreditCard, label: "Fiscal / Billing", href: "/admin/billing" },
  { icon: FileText, label: "System Logs", href: "/admin/logs" },
  { icon: FileText, label: "Forms", href: "/admin/AllForms" },
  { icon: UserCircle, label: "Personal Node", href: "/admin/profile" },
];




function Sidebar({ isExpired = false }: { isExpired?: boolean }) {
  const pathname = usePathname();
  const { subscriptionExpired } = useAuth();

  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
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

      <nav className={`flex-1 mt-4 overflow-y-auto px-4 space-y-1 relative z-10 custom-scrollbar transition-all duration-500 ${isExpired ? 'grayscale blur-[2px] opacity-40 pointer-events-none' : ''}`}>
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          const isBilling = item.href === '/admin/billing';
          const isRestricted = subscriptionExpired && !isBilling;
          
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
                ${isActive ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-900/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}
                ${isRestricted ? 'grayscale blur-[2px] opacity-40 cursor-not-allowed' : ''}
              `}
            >
              <item.icon size={18} className={`${isActive ? 'text-indigo-600' : 'text-indigo-300 group-hover:text-white'} transition-colors`} />
              <span className={`text-xs font-bold tracking-tight flex-1 ${isActive ? 'font-black' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div layoutId="activeDot" className="w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-sm"></motion.div>
              )}
              {!isActive && (
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto relative z-10">
        <div className={`bg-indigo-800/50 rounded-2xl p-4 border border-indigo-400/20 mb-6 transition-all duration-500 ${isExpired ? 'grayscale blur-[2px] opacity-40' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Lattice Security</span>
=        {subscriptionExpired ? (
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

import { motion } from 'framer-motion';
export default Sidebar;














