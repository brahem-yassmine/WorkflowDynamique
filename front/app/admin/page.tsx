'use client'

import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
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

const data = [
  { name: 'Mon', active: 12, completed: 8 },
  { name: 'Tue', active: 15, completed: 10 },
  { name: 'Wed', active: 18, completed: 12 },
  { name: 'Thu', active: 22, completed: 15 },
  { name: 'Fri', active: 20, completed: 18 },
  { name: 'Sat', active: 10, completed: 5 },
  { name: 'Sun', active: 8, completed: 4 },
];

const COLORS = ['#4f46e5', '#818cf8', '#6366f1', '#4338ca'];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">


      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">System Status</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Nominal
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Active Workflows"
          value="42"
          trend="+12% vs last week"
          icon={<GitBranch size={20} />}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Total Users"
          value="128"
          trend="+4 joined today"
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Avg. Completion"
          value="84%"
          trend="+3% improvement"
          icon={<CheckCircle2 size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Pending Tasks"
          value="15"
          trend="6 urgent"
          icon={<AlertCircle size={20} />}
          color="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Execution Velocity</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Workflow throughput (Weekly)</p>
            </div>
            <BarChart3 className="text-indigo-500" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700, color: '#4f46e5' }}
                />
                <Area type="monotone" dataKey="active" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorActive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Node Load</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Resource distribution</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 4)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="completed" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-4">
            <ActivityItem label="Budget Renewal" status="In Progress" color="bg-amber-500" />
            <ActivityItem label="Member Onboarding" status="Completed" color="bg-emerald-500" />
          </div>
        </div>
      </div>
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
