'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Layers,
  Calendar,
  Zap,
  CheckSquare,
  Bell,
  GitBranch,
  ArrowRight,
  Plus,
  ArrowUpRight,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';

interface DashboardStats {
  activeTasks: number;
  activeWorkflows: number;
  pendingRequests: number;
  unreadNotifications: number;
}

export default function UserDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeTasks: 0,
    activeWorkflows: 0,
    pendingRequests: 0,
    unreadNotifications: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { can } = usePermissions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setProfile(user);

          // Concurrent data fetching
          const [tasksRes, workflowsRes, requestsRes, notificationsRes] = await Promise.all([
            apiService.getMyTasks(),
            apiService.getInstances(),
            apiService.getTaskReports(),
            apiService.getNotifications()
          ]);

          const tasks = tasksRes.data || tasksRes || [];
          const activeTasks = tasks.filter((t: any) => t.status !== 'done' && t.status !== 'completed').length;
          setRecentTasks(tasks.slice(0, 5));

          setStats({
            activeTasks,
            activeWorkflows: (workflowsRes.data || workflowsRes || []).length,
            pendingRequests: (requestsRes.data || requestsRes || []).filter((r: any) => r.status === 'pending').length,
            unreadNotifications: (notificationsRes.data || notificationsRes || []).filter((n: any) => !n.read).length
          });
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);





  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 pb-12"
    >
      {/* Welcome Matrix Header */}
      <motion.section 
        variants={itemVariants}
        className="relative group perspective"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[44px] opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-center bg-white p-10 md:p-12 rounded-[40px] border border-indigo-50/50 shadow-xl shadow-indigo-500/5 overflow-hidden">
          {/* Abstract decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -mr-48 -mt-48"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 rotate-3 transition-transform">
              <Zap size={36} fill="white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                  Functional <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Matrix</span>
                </h1>
                <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 hidden sm:block">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none animate-pulse">Operational Node Active</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-4 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-indigo-600/20 rounded-full" />
                Welcome Back, {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : (profile?.name || 'User')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 relative z-10 mt-8 md:mt-0">
            <Link 
              href="/User/prof"
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              System Profile
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={<CheckSquare size={22} />} 
          label="Active Operations" 
          value={stats.activeTasks} 
          subValue="Tasks Assigned"
          color="indigo" 
        />
        <MetricCard 
          icon={<GitBranch size={22} />} 
          label="Workflow Load" 
          value={stats.activeWorkflows} 
          subValue="Active Instances"
          color="emerald" 
        />
        <MetricCard 
          icon={<Layers size={22} />} 
          label="Pending Clearances" 
          value={stats.pendingRequests} 
          subValue="Reports & Requests"
          color="amber" 
        />
        <MetricCard 
          icon={<Bell size={22} />} 
          label="Alert Frequency" 
          value={stats.unreadNotifications} 
          subValue="Unread Notifications"
          color="rose" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Operations Registry */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Operation Registry</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live Task Stream</p>
            </div>
            <Link 
              href="/User/tasks" 
              className="group flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
            >
              Access Complete Log <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {recentTasks.length > 0 ? (
              recentTasks.map((task, idx) => (
                <div 
                  key={task._id || idx}
                  className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all cursor-default"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:shadow-md transition-shadow">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-700 tracking-tight group-hover:text-indigo-900 transition-colors">{task.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                        <Clock size={10} /> {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${getStatusStyle(task.status)} group-hover:scale-105 transition-transform`}>
                    {task.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <CheckSquare size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active operations in registry</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Command Hub */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
                <Zap size={20} className="text-indigo-400" /> Command Hub
              </h3>
              
              <div className="space-y-4">
                <CommandButton 
                  icon={<Plus size={18} />} 
                  label="Initialize Request" 
                  href="/User/requests"
                  color="indigo"
                />
                <CommandButton 
                  icon={<Layers size={18} />} 
                  label="Generate AI Logic" 
                  href="/User/AIGenerate"
                  color="white"
                />
                <CommandButton 
                  icon={<Shield size={18} />} 
                  label="Create New Project" 
                  href="/User/PRO"
                  permission="Project.CREATE"
                  color="white"
                />
              </div>
            </div>
          </div>

          {/* System Health Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                   <Activity size={18} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node Performance</h4>
             </div>
             
             <div className="space-y-5">
                <div>
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-500">Lattice Sync</span>
                      <span className="text-emerald-500">99.9% Optimal</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '99.9%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                      />
                   </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Integrity</span>
                   <span className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      SECURED
                   </span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MetricCard({ icon, label, value, subValue, color, permission }: any) {
  const { can } = usePermissions();
  const isLocked = permission && !can(permission);
  
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <motion.div 
      whileHover={!isLocked ? { y: -5, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } : {}}
      className={`bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between transition-all duration-500 ${
        isLocked ? 'opacity-30 grayscale' : ''
      }`}
      title={isLocked ? "Matrix Restricted" : ""}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border ${colors[color as keyof typeof colors]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{isLocked ? "---" : value}</h4>
          <span className="text-[10px] font-bold text-slate-400">{subValue}</span>
        </div>
      </div>
    </motion.div>
  );
}

function CommandButton({ icon, label, href, color, permission }: any) {
  const { can } = usePermissions();
  const isIndigo = color === 'indigo';
  const isLocked = permission && !can(permission);
  
  return (
    <Link 
      href={isLocked ? "#" : href}
      onClick={(e) => isLocked && e.preventDefault()}
      className={`
        w-full flex items-center justify-between p-5 rounded-2xl transition-all active:scale-[0.98] group
        bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 hover:bg-indigo-500
      `}
      title={isLocked ? "Matrix Restricted" : ""}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isIndigo ? 'bg-indigo-500' : 'bg-white/10'}`}>
          {icon}
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
    </Link>
  );
}

function getStatusStyle(status: string) {
  switch (status?.toLowerCase()) {
    case 'doing':
    case 'in-progress':
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    case 'done':
    case 'completed':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'up-next':
    case 'pending':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'backlog':
      return 'bg-slate-50 text-slate-400 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-400 border-slate-200';
  }
}
