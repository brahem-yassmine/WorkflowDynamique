'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Bell,
  Workflow,
  Users,
  User,
  HelpCircle,
  Zap,
  LogOut,
  CheckSquare,
  Layers,
  ListTodo,
  LayoutGrid,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  FileText,
  Eye,
  X
} from 'lucide-react';
import { apiService } from '@/service/api.service';

function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [taskCount, setTaskCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await apiService.getMyTasks();
        if (response.success && response.data) {
          const activeTasks = response.data.filter((t: any) => t.status !== 'completed').length;
          setTaskCount(activeTasks);
        }
      } catch (err) {
        console.warn('Failed to fetch task count for sidebar');
      }
    };
    fetchCount();
  }, [pathname]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('tenantId');
      window.location.href = '/signin';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    { icon: LayoutGrid, label: "Command Center", href: "/User" },
    { icon: Zap, label: "Smart Actions", href: "/User/quick-actions", color: "text-emerald-400", badge: "NEW" },
    { icon: User, label: "My Profile", href: "/User/prof" },
    { icon: CheckSquare, label: "Action Center", href: "/User/tasks", badge: taskCount },
    { icon: Bell, label: "Alert Inbox", href: "/User/Notifications" },
    { icon: ShieldAlert, label: "Critical Requests", href: "/User/requests", color: "text-rose-400" },
    { icon: Users, label: "Team Space", href: "/User/InviteTeam" },
    { icon: Layers, label: "Forms Lab", href: "/User/Allforms" },
    { icon: Zap, label: "AI Co-pilot", href: "/User/AIGenerate", color: "text-amber-400" },
  ];

  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-900/20 rounded-full -ml-12 -mb-12 blur-xl"></div>

      <div className="p-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-indigo-600 opacity-20"></div>
            <LayoutGrid size={24} className="text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">Axia Core</h1>
            <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest mt-1.5 opacity-80">User Workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-4 overflow-y-auto px-4 relative z-10 scrollbar-hide">
        <div className="space-y-1">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                  ${isActive
                    ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-900/20 font-black'
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white font-bold'}
                `}
              >
                <item.icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : (item.color || 'text-indigo-300')} group-hover:text-white`} />
                <span className="text-xs tracking-tight flex-1">{item.label}</span>

                {item.badge !== null && item.badge !== undefined && (typeof item.badge === 'string' || item.badge > 0) && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-[9px] font-black 
                    ${isActive ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-indigo-700'}
                  `}>
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeIndicatorUser"
                    className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                  />
                )}

                {!isActive && (
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                )}
              </Link>
            );
          })}

          <div className="my-6 border-t border-white/10 mx-4"></div>

          <Link href="/User/Help&FirstSteps" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold ${pathname === "/User/Help&FirstSteps" ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-100 hover:bg-white/10'}`}>
            <HelpCircle size={18} className="text-indigo-300" />
            <span className="text-xs tracking-tight">Assistance Center</span>
          </Link>
        </div>
      </nav>

      <div className="p-6 mt-auto relative z-10">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-5 border border-white/5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></div>
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.2em]">Matrix Status</span>
          </div>
          <p className="text-xs font-bold text-white tracking-tight">Verified Protocol</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 text-indigo-100 hover:bg-rose-500/10 hover:text-rose-300 rounded-2xl w-full transition-all group"
        >
          <div className="w-9 h-9 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
            <LogOut size={16} />
          </div>
          <span className="text-xs font-bold tracking-tight">Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}

export default UserSidebar;

