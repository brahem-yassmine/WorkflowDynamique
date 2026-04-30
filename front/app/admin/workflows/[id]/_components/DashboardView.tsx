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
  Activity,
  Layers,
  LayoutGrid,
  GitBranch,
  Edit2
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
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

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
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
      console.log('🏗️ [Dashboard] Current Tenant ID:', tenantId);
      const [wfRes, instancesRes] = await Promise.all([
        apiService.getWorkflowById(workflowId),
        apiService.getInstances({ workflowId })
      ]);

      if (wfRes.success && instancesRes.success) {
        const workflow = wfRes.data || { nodes: [] };
        setWorkflow(workflow);
        const instances = instancesRes.data || [];
        console.log('📊 [Dashboard] Raw Instances Res:', instancesRes);
        console.log('📊 [Dashboard] Parsed Instances:', instances);
        
        // Comprehensive list of system nodes to exclude from manual task counts
        const systemNodes = [
          'start', 'end', 'parallel', 'sync_join', 'exclusive', 'inclusive', 
          'parallel_split', 'parallel_join', 'start_parallel', 'parallelstart', 
          'condition', 'timer', 'webhook', 'script', 'delay', 'email', 'timer_start'
        ];

        // 1. Identify actual task nodes (manual actions)
        const taskNodeCount = workflow.nodes?.filter((n: any) => {
          const type = (n.type || 'TASK').toUpperCase();
          return !['START', 'END', 'CONDITION', 'PARALLEL_SPLIT', 'PARALLEL_JOIN', 'AUTO', 'NOTIFICATION'].includes(type);
        }).length || 0;

        let totalCompleted = 0;
        let totalRejected = 0;
        let activeInstCount = 0;
        let pendingInActiveInstances = 0;

        instances.forEach((inst: any) => {
          const isInstanceActive = ['active', 'pending', 'in_progress'].includes((inst.status || '').toLowerCase());
          if (isInstanceActive) {
            activeInstCount++;
          }

          // Count completed steps from history
          inst.history?.forEach((step: any) => {
            // Find if this step corresponds to a manual task node
            const nodeDef = workflow.nodes?.find((n: any) => n.id === (step.nodeId || step.stepId));
            const nodeType = (nodeDef?.type || step.nodeType || 'TASK').toUpperCase();
            const isManualTask = !['START', 'END', 'CONDITION', 'PARALLEL_SPLIT', 'PARALLEL_JOIN', 'AUTO', 'NOTIFICATION'].includes(nodeType);
            
            if (isManualTask) {
              const action = (step.action || '').toUpperCase();
              if (action === 'REJECTED' || action === 'REJECT') {
                totalRejected++;
              } else if (['APPROVED', 'APPROVE', 'COMPLETED', 'COMPLETE', 'VALIDATED', 'VALIDATE', 'SIGNED', 'FILL', 'UPLOAD'].some(a => action.includes(a))) {
                totalCompleted++;
              }
            }
          });

          // Also count current pending nodes if instance is active
          if (isInstanceActive && inst.state) {
            inst.state.forEach((node: any) => {
              const nodeDef = workflow.nodes?.find((n: any) => n.id === (node.nodeId || node.stepId));
              const nodeType = (nodeDef?.type || 'TASK').toUpperCase();
              const isManualTask = !['START', 'END', 'CONDITION', 'PARALLEL_SPLIT', 'PARALLEL_JOIN', 'AUTO', 'NOTIFICATION'].includes(nodeType);
              if (isManualTask && ['PENDING', 'IN_PROGRESS'].includes((node.status || '').toUpperCase())) {
                pendingInActiveInstances++;
              }
            });
          }
        });

        // Heuristic for total tasks: total instances * nodes per instance
        // But if history suggests more, we adapt
        const totalPotentialActions = Math.max(
          taskNodeCount * instances.length,
          totalCompleted + totalRejected + pendingInActiveInstances
        );

        const totalRemainingWork = Math.max(0, totalPotentialActions - totalCompleted - totalRejected);
        
        setStats({
          totalTasks: totalPotentialActions,
          completedTasks: totalCompleted,
          pendingTasks: totalRemainingWork,
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

  const handleLaunch = async () => {
    try {
      console.log('🚀 [Dashboard] Launching workflow:', workflowId);
      setLaunching(true);
      const res = await apiService.request(`/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ 
          title: `Manual Launch: ${new Date().toLocaleString()}`,
          priority: 'medium'
        })
      });
      if (res.success) {
        // Refresh stats
        await fetchStats();
      }
    } catch (err) {
      console.error('Launch error:', err);
    } finally {
      setLaunching(false);
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

  if (workflow?.isTemplate) {
    const templateCards = [
      {
        title: 'Organization Domain',
        value: workflow.domain || workflow.domainId?.name || 'Generic',
        icon: <LayoutGrid className="text-indigo-500" />,
        color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        description: 'Primary structural categorization'
      },
      {
        title: 'Parent Module',
        value: workflow.moduleId?.name || 'Standard',
        icon: <Layers className="text-blue-500" />,
        color: 'bg-blue-50 text-blue-600 border-blue-100',
        description: 'Module classification of this blueprint'
      },
      {
        title: 'Structural Blocks',
        value: workflow.nodes?.length || 0,
        icon: <GitBranch className="text-fuchsia-500" />,
        color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
        description: 'Number of logic nodes in the lattice'
      }
    ];

    return (
      <div className="space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[40px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
        >
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-black tracking-tight">Modify Base Blueprint</h2>
            <p className="text-slate-400 font-medium max-w-md">Enter the architect mode to restructure the logic nodes, add new edges, or configure step parameters for this workflow.</p>
          </div>
          <button 
            onClick={() => window.location.href = `/create-workflow?id=${workflowId}&isTemplate=true&returnUrl=${encodeURIComponent(window.location.pathname)}`}
            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
          >
            <Edit2 size={20} />
            Architect Mode
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templateCards.map((card, idx) => (
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
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blueprint Metadata</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2 truncate" title={card.value.toString()}>{card.value}</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.title}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Empty State / Launch Action */}
      {stats.totalInstances === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 rounded-[40px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-200"
        >
          <div className="space-y-4 text-center md:text-left">
             <h2 className="text-3xl font-black tracking-tight">Ready to activate this unit?</h2>
             <p className="text-indigo-100 font-medium max-w-md">This workflow schema is currently dormant. Initialize the first operational instance to start tracking performance and task advancement.</p>
          </div>
          <button 
            onClick={handleLaunch}
            disabled={launching}
            className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
          >
            {launching ? (
              <div className="w-5 h-5 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <Activity size={20} />
            )}
            {launching ? 'Initializing...' : 'Launch Operational Unit'}
          </button>
        </motion.div>
      )}

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
