'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/service/api.service';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardViewProps {
  workflowId: string;
}

export default function DashboardView({ workflowId }: DashboardViewProps) {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    rejectedTasks: 0,
    totalInstances: 0,
    activeInstances: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [workflowId]);

  const fetchStats = async () => {
    if (workflowId === 'standard') {
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        rejectedTasks: 0,
        totalInstances: 0,
        activeInstances: 0,
        completionRate: 0
      });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [wfRes, instancesRes] = await Promise.all([
        apiService.getWorkflowById(workflowId),
        apiService.getInstances({ workflowId })
      ]);

      if (wfRes.success && instancesRes.success) {
        const workflow = wfRes.data;
        const instances = instancesRes.data;
        const systemNodes = ['start', 'end', 'parallel', 'sync_join', 'exclusive', 'inclusive', 'parallel_split', 'parallel_join', 'start_parallel', 'parallelstart', 'condition', 'timer', 'webhook', 'script', 'delay'];
        const taskNodeCount = workflow.nodes?.filter((n: any) => 
          n.type && !systemNodes.includes(n.type.toLowerCase())
        ).length || 0;

        let totalCompleted = 0;
        let totalRejected = 0;
        let activeInstCount = 0;

        instances.forEach((inst: any) => {
          if (inst.status === 'active' || inst.status === 'pending' || inst.status === 'in_progress') {
            activeInstCount++;
          }

          inst.executionPath?.forEach((step: any) => {
            const nodeDef = workflow.nodes?.find((n: any) => n.id === step.nodeId);
            const isTask = nodeDef && !systemNodes.includes((nodeDef.type || '').toLowerCase());
            
            if (isTask) {
              if (step.action === 'rejected') {
                totalRejected++;
              } else if (['approved', 'completed', 'validated'].includes(step.action)) {
                totalCompleted++;
              }
            }
          });
        });

        const totalPotentialActions = taskNodeCount * instances.length;
        const totalPending = Math.max(0, totalPotentialActions - totalCompleted - totalRejected);

        setStats({
          totalTasks: totalPotentialActions,
          completedTasks: totalCompleted,
          pendingTasks: totalPending,
          rejectedTasks: totalRejected,
          totalInstances: instances.length,
          activeInstances: activeInstCount,
          completionRate: totalPotentialActions > 0 ? Math.round((totalCompleted / totalPotentialActions) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: <CheckCircle2 className="text-emerald-500" />,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      description: 'Total tasks validated across all instances'
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: <Clock className="text-amber-500" />,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      description: 'Tasks currently in progress/waiting'
    },
    {
      title: 'Rejected Tasks',
      value: stats.rejectedTasks,
      icon: <AlertCircle className="text-rose-500" />,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      description: 'Tasks that were rejected by validators'
    },
    {
      title: 'Workflow Instances',
      value: stats.totalInstances,
      icon: <Activity className="text-indigo-500" />,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      description: 'Total times this workflow was triggered'
    }
  ];

  return (
    <div className="space-y-10">
      {/* Header Stat Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${card.color.split(' ')[0]} transition-transform group-hover:scale-110`}>
                {React.cloneElement(card.icon as any, { size: 24 })}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Feed</span>
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-2">{card.value}</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.title}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Circle Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-8"
        >
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-0">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="16"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="16"
                strokeDasharray={552.92}
                strokeDashoffset={552.92 - (552.92 * stats.completionRate) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-slate-800 tracking-tight">{stats.completionRate}%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">Advancement Status</h4>
            <p className="text-xs font-medium text-slate-500 max-w-[200px]">
              {stats.completionRate > 70 ? 'Excellent throughput detected in this lattice.' : 'Throughput optimization recommended.'}
            </p>
          </div>
        </motion.div>

        {/* Detailed Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-10"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Operational Velocity</h4>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Execution Metrics</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <TrendingUp className="text-indigo-400" size={24} />
            </div>
          </div>

          <div className="space-y-8">
            <ProgressBar label="Task Success" value={stats.totalTasks > 0 ? ((stats.completedTasks - stats.rejectedTasks) / stats.totalTasks) * 100 : 0} color="bg-indigo-600" />
            <ProgressBar label="Pending Load" value={stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0} color="bg-amber-400" />
            <ProgressBar label="Rejection Rate" value={stats.totalTasks > 0 ? (stats.rejectedTasks / stats.totalTasks) * 100 : 0} color="bg-rose-500" />
          </div>

          <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Instances</p>
              <p className="text-2xl font-black text-slate-800">{stats.activeInstances}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Throughput</p>
              <p className="text-2xl font-black text-slate-800">{stats.totalTasks}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
        <span className="text-xs font-black text-slate-800">{Math.round(value)}%</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
