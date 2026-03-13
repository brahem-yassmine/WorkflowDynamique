"use client";

import { useEffect, useState } from "react";
import { 
  BarChart4, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Workflow, 
  Users, 
  ArrowUpRight,
  PieChart as PieChartIcon,
  Calendar
} from "lucide-react";
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
  Cell,
  PieChart,
  Pie
} from "recharts";

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate weekly growth from historical data
  const newCompaniesWeek = stats?.growth?.reduce((acc: number, curr: any) => acc + curr.companies, 0) || 0;
  const newWorkflowsWeek = stats?.growth?.reduce((acc: number, curr: any) => acc + curr.workflows, 0) || 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          Growth Analytics
          <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest">Real-Time Insight</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">Measuring the expansion and activity levels across the entire lattice.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GrowthCard 
          label="New Companies" 
          value={newCompaniesWeek} 
          period="Last 7 Days" 
          icon={<Building2 size={24} />} 
          trend={newCompaniesWeek > 2 ? "+12%" : "Stable"}
        />
        <GrowthCard 
          label="New Workflows" 
          value={newWorkflowsWeek} 
          period="Last 7 Days" 
          icon={<Workflow size={24} />} 
          trend={newWorkflowsWeek > 10 ? "+28%" : "Steady"}
        />
        <GrowthCard 
          label="Total Entities" 
          value={stats?.totalCompanies + stats?.totalUsers} 
          period="Cumulative" 
          icon={<Users size={24} />} 
          trend="Live"
        />
        <GrowthCard 
          label="Platform Load" 
          value={`${stats?.averageGpuUsage}%`} 
          period="Current" 
          icon={<TrendingUp size={24} />} 
          trend="Optimal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company & Workflow Growth Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={120} className="text-indigo-900" />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Ecosystem Expansion</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.growth}>
                <defs>
                  <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWorkflows" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="companies" name="New Companies" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCompanies)" />
                <Area type="monotone" dataKey="workflows" name="New Workflows" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWorkflows)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Interest Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <PieChartIcon size={120} className="text-indigo-900" />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Industry Penetration</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.sectorDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats?.sectorDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrowthCard({ label, value, period, icon, trend }: { label: string; value: string | number; period: string; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
          {trend}
          {trend.includes('+') && <ArrowUpRight size={10} />}
        </div>
      </div>
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-1">{value}</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[10px] font-medium text-slate-300 mt-2 flex items-center gap-1">
          <Calendar size={10} />
          {period}
        </p>
      </div>
    </div>
  );
}
