'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  ShieldCheck,
  Workflow,
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
  Copy,
  LifeBuoy,
  Stethoscope,
  ClipboardList,
  ShieldAlert,
  ChevronDown,
  BookOpen,
  Shield,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuGroups = [
  {
    title: "Overview & Analytics",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Command Center", href: "/admin", perm: "Dashboard.VIEW" },
      { icon: Zap, label: "Quick Actions", href: "/admin/quick-actions", perm: "Dashboard.VIEW" },
      { icon: Activity, label: "Live Operations", href: "/admin/operations", perm: "Dashboard.VIEW" },
      { icon: ShieldAlert, label: "Alerts Center", href: "/admin/alerts", perm: "Dashboard.VIEW" },
      // Tasks represent workflows/instances now or checklists depending on global scope
      { icon: ClipboardList, label: "Global Tasks", href: "/admin/tasks", perm: "Dashboard.VIEW" },
    ]
  },
  {
    title: "Process & Automation",
    icon: Workflow,
    items: [
      { icon: Workflow, label: "Workflow Studio", href: "/admin/workflows", perm: "Workflow.VIEW" },
      { icon: Copy, label: "Workflow Templates", href: "/admin/templates", perm: "Template.VIEW" },
      { icon: Briefcase, label: "Project Workspace", href: "/admin/projects", perm: "Project.VIEW" },
    ]
  },
  {
    title: "Assets & Repositories",
    icon: BookOpen,
    items: [
      { icon: FileText, label: "Dynamic Forms", href: "/admin/AllForms", perm: "Form.VIEW" },
      { icon: FolderKanban, label: "Kanban Boards", href: "/admin/AllKanban", perm: "Kanban.VIEW" },
      { icon: ListTodo, label: "Checklists", href: "/admin/AllCheck", perm: "Checklist.VIEW" },
      { icon: LayoutGrid, label: "Domains", href: "/admin/domains", perm: "Domain.VIEW" },
    ]
  },
  {
    title: "Access & Security",
    icon: Shield,
    items: [
      // Usually users are domain-controlled, let's lock them with Domain.VIEW
      { icon: Users, label: "User Management", href: "/admin/userManagement", perm: "Domain.VIEW" },
      { icon: ShieldCheck, label: "Roles & Permissions", href: "/admin/roles", perm: "Domain.VIEW" },
      { icon: FileText, label: "System Logs", href: "/admin/Log", perm: "Dashboard.VIEW" },
    ]
  },
  {
    title: "Help & Discovery",
    icon: LifeBuoy,
    items: [
      { icon: BookOpen, label: "Platform Guide", href: "/admin/guide" }, // No perm required
      { icon: LifeBuoy, label: "Support Reports", href: "/admin/reports" },
    ]
  },
  {
    title: "System & Identity",
    icon: Settings,
    items: [
      { icon: CreditCard, label: "Billing & Licenses", href: "/admin/billing" },
      { icon: UserCircle, label: "My Profile", href: "/admin/profile" },
    ]
  }
];

function Sidebar({ isExpired = false }: { isExpired?: boolean }) {
  const pathname = usePathname();
  const { can } = usePermissions();
  
  const effectiveExpired = isExpired;

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Automatically expand group that contains current path
  useEffect(() => {
    const defaultExpanded = menuGroups.find(group => 
      group.items.some(item => item.href === pathname)
    )?.title;

    if (defaultExpanded && !expandedGroups.includes(defaultExpanded)) {
      setExpandedGroups(prev => [...prev, defaultExpanded]);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) 
        ? prev.filter(g => g !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="w-full bg-indigo-700 border-r border-white/10 text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-900/20 rounded-full -ml-24 -mb-24 blur-2xl pointer-events-none"></div>

      <div className="p-6 relative z-10 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/10">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">Axia Core</h1>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-[0.2em] mt-1">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto w-full relative z-10 scrollbar-hide py-4 px-3 space-y-1">
        {menuGroups.map((group, groupIndex) => {
          const isExpanded = expandedGroups.includes(group.title);
          const hasActiveChild = group.items.some(item => item.href === pathname);
          
          return (
            <div key={groupIndex} className="mb-2">
              <button
                onClick={() => toggleGroup(group.title)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group
                  ${isExpanded ? 'bg-white/10 text-white' : 'text-indigo-100 hover:bg-white/5 hover:text-white'}
                  ${hasActiveChild && !isExpanded ? 'bg-white/5 text-white' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${hasActiveChild ? 'bg-indigo-500 shadow-sm' : 'bg-transparent group-hover:bg-white/10'}`}>
                    <group.icon size={16} className={`${hasActiveChild ? 'text-white' : 'text-indigo-200 group-hover:text-white'} transition-colors`} />
                  </div>
                  <span className={`text-xs font-bold tracking-wide ${isExpanded ? 'text-white' : ''}`}>
                    {group.title}
                  </span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`text-indigo-300 group-hover:text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 pb-2 pl-4 pr-0 space-y-1 relative">
                      {/* Connection line */}
                      <div className="absolute left-6 top-1 bottom-3 w-px bg-white/10 rounded-full"></div>
                      
                      {group.items.map((item: any, index) => {
                        const isActive = pathname === item.href;
                        const isBilling = item.href === '/admin/billing';
                        const hasAccess = item.perm ? can(item.perm) : true;
                        const isExpiredLocked = effectiveExpired && !isBilling;
                        const isRestricted = isExpiredLocked || !hasAccess;

                        return (
                          <Link
                            key={index}
                            id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            href={isRestricted ? '#' : item.href}
                            onClick={(e) => {
                              if (isRestricted) {
                                e.preventDefault();
                                if (isExpiredLocked) {
                                  toast.error("Access Restricted: Subscription Protocol Terminated.", {
                                    description: "Please renew your matrix access in the Fiscal center.",
                                  });
                                } else {
                                  toast.error("Access Denied", {
                                    description: `The permission ${item.perm} is required.`,
                                  });
                                }
                              }
                            }}
                            className={`
                              flex items-center gap-3 py-2.5 px-4 rounded-2xl transition-all duration-300 group relative ml-5
                              ${isActive
                                ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-900/20 font-black'
                                : 'text-indigo-100 hover:bg-white/10 hover:text-white font-bold'}
                              ${isRestricted ? 'grayscale blur-[1px] opacity-40 cursor-not-allowed' : ''}
                            `}
                          >
                            <item.icon size={15} className={`${isActive ? 'text-indigo-600' : 'text-indigo-300 group-hover:text-white'} transition-colors`} />
                            <span className="text-xs tracking-tight flex-1">
                              {item.label}
                            </span>
                            
                            {/* Line connecting to the child item */}
                            <div className="absolute -left-5 top-1/2 w-3 h-px bg-white/10 group-hover:bg-white/30 transition-all duration-300"></div>
                            
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute -left-6 w-1 h-5 bg-white rounded-r-full"
                              />
                            )}
                            
                            {!isActive && !isRestricted && (
                              <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity translate-x-2 group-hover:translate-x-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto relative z-10 border-t border-white/5 bg-indigo-700/50 backdrop-blur-md">
        {effectiveExpired ? (
          <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/20 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
               <Zap size={14} className="text-rose-400 fill-rose-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-rose-300 tracking-wider">Protocol Terminal</p>
              <p className="text-xs font-semibold text-white tracking-tight leading-none mt-1">Access Restricted</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5 mb-4 flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
               <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse"></div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-[0.1em]">System Status</span>
              <p className="text-xs font-semibold text-white tracking-tight mt-0.5">Master Node Active</p>
            </div>
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
          <span className="text-xs font-bold tracking-tight">End Session</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
