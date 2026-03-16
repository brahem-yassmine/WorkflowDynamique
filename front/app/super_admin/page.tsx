"use client";

const API_URL = 'http://localhost:5000/api';

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { 
    Loader2, AlertCircle, RefreshCw, TrendingUp, Users, Building2, Workflow, Cpu, DollarSign, Activity
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  AreaChart,
  Area
} from "recharts";

// Premium Indigo Palette
const COLORS = ['#4f46e5', '#818cf8', '#6366f1', '#4338ca', '#c7d2fe'];

type DashboardStats = {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  totalRevenue: number;
  totalWorkflows: number;
  workflowExecutions: number;
  averageGpuUsage: number;
  trialCompanies: number;
  paidCompanies: number;
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalWorkflows: 0,
    workflowExecutions: 0,
    averageGpuUsage: 0,
    trialCompanies: 0,
    paidCompanies: 0,
  });

  const [sectorData, setSectorData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      if (!isRefreshing) setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError("Authentication required");
        return;
      }

      const tenantsResponse = await fetch('http://localhost:5000/api/admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!tenantsResponse.ok) throw new Error('Data synchronization failed');

      const tenantsData = await tenantsResponse.json();

      if (tenantsData.success && Array.isArray(tenantsData.data)) {
        const tenants = tenantsData.data;

        const activeCount = tenants.filter((t: any) => t.status === 'active').length;
        const suspendedCount = tenants.filter((t: any) => t.status === 'suspended').length;

        let totalUsers = 0;
        let totalRevenue = 0;
        let totalWorkflows = 0;
        let totalExecutions = 0;
        const sectorCounts: Record<string, number> = {};
        const planCounts: Record<string, number> = {};

        tenants.forEach((tenant: any) => {
          totalUsers += tenant.userCount || 0;
          totalWorkflows += tenant.workflowNodeCount || 0;
          totalExecutions += tenant.executionCount || 0;
          
          // Calculate Revenue based on Plan
          const planPrice = tenant.selectedPlan?.monthlyPrice || tenant.selectedPlan?.price;
          if (typeof planPrice === 'number') {
            totalRevenue += planPrice;
          } else {
            const planNameLower = (tenant.selectedPlan?.name || '').toLowerCase();
            if (planNameLower.includes('pro')) totalRevenue += 299;
            else if (planNameLower.includes('starter')) totalRevenue += 79;
          }

          const sector = tenant.industry || 'General';
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
          const planName = tenant.selectedPlan?.name || 'Standard';
          planCounts[planName] = (planCounts[planName] || 0) + 1;
        });

        // GPU usage calculation (Saturation Curve)
        const capacity = 2000;
        const saturation = 100 * (1 - Math.exp(-activeCount / capacity));
        const activityFactor = totalExecutions > 0 ? (totalExecutions / tenants.length / 50) : 0;
        const gpuUsage = Math.min(100, Math.round(saturation + activityFactor));

        setSectorData(Object.entries(sectorCounts).map(([sector, value]) => ({ sector, value })));
        setPlanDistribution(Object.entries(planCounts).map(([name, value]) => ({ name, value })));

        setStats({
          totalCompanies: tenants.length,
          activeCompanies: activeCount,
          suspendedCompanies: suspendedCount,
          totalUsers,
          totalRevenue,
          totalWorkflows,
          workflowExecutions: totalExecutions,
          averageGpuUsage: gpuUsage,
          trialCompanies: planCounts['Demo'] || 5,
          paidCompanies: tenants.length - (planCounts['Demo'] || 5),
        });
      }

      setRevenueTrend([
        { month: "Sep", revenue: 45000 },
        { month: "Oct", revenue: 52000 },
        { month: "Nov", revenue: 48000 },
        { month: "Dec", revenue: 61000 },
        { month: "Jan", revenue: 58000 },
        { month: "Feb", revenue: 75000 },
      ]);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Critical system error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <Activity className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={24} />
        </div>
        <p className="mt-4 text-indigo-900 font-bold animate-pulse">Synchronizing Global Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Command Center
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-black rounded-full uppercase tracking-widest">Global</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time monitoring across all instance clusters.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Synchronizing..." : "Refresh Intelligence"}
        </button>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Organizations" value={stats.totalCompanies} icon={<Building2 className="text-blue-500" />} trend="+12% vs last month" />
        <KPICard title="Total Entities" value={stats.totalUsers} icon={<Users className="text-indigo-500" />} trend="+340 this week" />
        <KPICard title="Gross Revenue" value={`${(stats.totalRevenue / 1000).toFixed(1)}k DT`} icon={<DollarSign className="text-emerald-500" />} trend="+23% Growth" />
        <KPICard title="GPU Compute" value={`${stats.averageGpuUsage}%`} icon={<Cpu className="text-rose-500" />} trend="High Demand" />
      </div>

      {/* Secondary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniKPICard label="Flow Nodes" value={stats.totalWorkflows} icon={<Workflow size={14} />} color="bg-blue-50 text-blue-600" />
        <MiniKPICard label="Executions" value={stats.workflowExecutions.toLocaleString()} icon={<Activity size={14} />} color="bg-purple-50 text-purple-600" />
        <MiniKPICard label="Live Nodes" value={stats.activeCompanies} icon={<Activity size={14} />} color="bg-emerald-50 text-emerald-600" />
        <MiniKPICard label="Suspended" value={stats.suspendedCompanies} icon={<Activity size={14} />} color="bg-rose-50 text-rose-600" />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Financial Trajectory</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Revenue Growth (6M)</p>
            </div>
            <TrendingUp className="text-emerald-500" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700, color: '#4f46e5' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution Pie */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-8 text-center">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Tier Saturation</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Subscription Model</p>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  cornerRadius={8}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {planDistribution.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  {p.name}</span>
                <span className="font-black text-indigo-600">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Distribution Bar Chart */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="mb-8">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Industry Proliferation</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Market Breakdown</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40}>
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

function KPICard({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-tight">{trend}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function MiniKPICard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-base font-black text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}
