'use client'

import React, { useState, useEffect } from 'react';
import { apiService } from '@/service/api.service';
import {
  Activity,
  Users,
  GitBranch,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  Filter,
  Layers,
  Zap
} from 'lucide-react';
import VisualHint from '@/components/VisualHint';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const COLORS = ['#4f46e5', '#818cf8', '#6366f1', '#4338ca'];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        apiService.getTenantStats(),
        apiService.getTenantLogs()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (logsRes.success) setLogs(logsRes.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate log distribution for the bar chart
  const getLogDistribution = () => {
    if (!stats) return [];
    if (!logs || logs.length === 0) return [
      { name: 'WORKFLOW', active: stats.totalWorkflows || 0 },
      { name: 'ACTIVE', active: stats.activeInstances || 0 },
      { name: 'PENDING', active: stats.totalPendingTasks || 0 },
      { name: 'USERS', active: stats.totalUsers || 0 },
    ];

    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const action = (log.action || 'PROCESS').split('_').pop() || 'UNIT';
      counts[action] = (counts[action] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, active]) => ({ name, active }));
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white animate-bounce shadow-xl shadow-indigo-200">
            <Zap size={24} fill="white" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Synchronizing Command Center...</span>
        </div>
      </div>
    );
  }

  const logDistribution = getLogDistribution();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            id="dashboard-search"
            type="text"
            placeholder="Search processes, users, or audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Filter size={20} />
          </button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Lattice Status</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div id="stat-workflows">
          <StatCard
            label="Architectures"
            value={stats.totalWorkflows}
            trend={`${stats.activeInstances} Running`}
            icon={<GitBranch size={20} />}
            color="bg-indigo-50 text-indigo-600"
          />
        </div>
        <StatCard
          label="User Network"
          value={stats.totalUsers}
          trend="Live Connection"
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Completed Units"
          value={stats.completedInstances}
          trend={`${stats.completionRate}% Success`}
          icon={<CheckCircle2 size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Pending Load"
          value={stats.totalPendingTasks || 0}
          trend="Queue backlog"
          icon={<AlertCircle size={20} />}
          color="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div id="performance-chart" className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">System Throughput</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global lattice activity (Weekly)</p>
            </div>
            <BarChart3 className="text-indigo-500" />
          </div>
          <div className="flex-grow h-[300px] w-full bg-slate-50/50 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.performanceData?.length > 0 ? stats.performanceData : [
                { label: 'Sun', usage: 0 },
                { label: 'Mon', usage: 0 },
                { label: 'Tue', usage: 0 },
                { label: 'Wed', usage: 0 },
                { label: 'Thu', usage: 0 },
                { label: 'Fri', usage: 0 },
                { label: 'Sat', usage: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis 
                  dataKey="label" 
                  axisLine={{ stroke: '#1e293b', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#1e293b' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={{ stroke: '#1e293b', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 900, fill: '#1e293b' }} 
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '2px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#1e293b" 
                  strokeWidth={6} 
                  fill="#6366f1" 
                  fillOpacity={0.4}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Real-time Feed</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Latest system executions</p>
          </div>
          <div className="h-[250px] w-full mb-6 bg-slate-50/50 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={logDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" axisLine={{ stroke: '#1e293b' }} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#1e293b' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="active" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={false}>
                  {logDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {logs.length > 0 ? logs.slice(0, 3).map((log, idx) => (
              <ActivityItem
                key={idx}
                label={log.action || 'System Process'}
                status={new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                color={log.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}
              />
            )) : (
              <>
                <ActivityItem label="Master Core" status="Nominal" color="bg-emerald-500" />
                <ActivityItem label="Audit System" status="Active" color="bg-indigo-500" />
              </>
            )}
          </div>
        </div>
      </div>
      <VisualHint 
        id="hint-search" 
        targetId="dashboard-search" 
        title="Global Search" 
        content="Quickly find any workflow, user, or log entry within your organization's lattice."
        position="bottom"
        delay={1}
      />
      <VisualHint 
        id="hint-workflows" 
        targetId="stat-workflows" 
        title="Architecture Metrics" 
        content="Monitor your structural protocols and live execution instances here."
        position="bottom"
        delay={2}
      />
      <VisualHint 
        id="hint-performance" 
        targetId="performance-chart" 
        title="Throughput Analysis" 
        content="Analyze real-time system performance and Weekly activity vectors."
        position="top"
        delay={3}
      />
    </div>
  );
}

function StatCard({ label, value, trend, icon, color }: { label: string; value: string; trend: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-tight">{trend}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-3xl font-black text-slate-800 mt-2">{value}</p>
      </div>
    </div>
  );
}

function ActivityItem({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status}</span>
    </div>
  );
}
