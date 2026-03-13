"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  TrendingUp,
  Users,
  Search,
  Zap,
  ChevronRight,
  Clock,
  Wallet,
  ArrowUpRight,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#c7d2fe'];

// const plans = [
//   { name: "Starter Tier", maxUsers: 10, maxWorkflows: 20, storage: "10GB", monthlyRevenue: 2400, subscribers: 120, growth: "+8%" },
//   { name: "Pro Cluster", maxUsers: 50, maxWorkflows: 100, storage: "100GB", monthlyRevenue: 8400, subscribers: 210, growth: "+12%" },
//   { name: "Flow Master", maxUsers: 200, maxWorkflows: 500, storage: "1TB", monthlyRevenue: 15200, subscribers: 95, growth: "+5%" },
//   { name: "Lattice Demo", maxUsers: 5, maxWorkflows: 5, storage: "2GB", monthlyRevenue: 0, subscribers: 60, growth: "Stable" },
// ];

// const nearExpiration = [
//   { company: "TechNova Solutions", daysLeft: 3, amount: "$4,200", status: "Critical" },
//   { company: "HealthCorp International", daysLeft: 5, amount: "$1,850", status: "Warning" },
//   { company: "FinGroup Global", daysLeft: 2, amount: "$12,400", status: "Critical" },
// ];

export default function SubscriptionPaymentPage() {
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [expiringTenants, setExpiringTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Financial Stats
        const statsRes = await fetch('http://localhost:5000/api/admin/stats', { headers });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        // 2. Fetch All Plans for Tier Orchestration
        const plansRes = await fetch('http://localhost:5000/api/admin/plans', { headers });
        const plansData = await plansRes.json();
        if (plansData.success) {
          setAllPlans(plansData.data);
        }

        // 3. Fetch Tenants for Expiration Risk
        const tenantsRes = await fetch('http://localhost:5000/api/admin/tenants', { headers });
        const tenantsData = await tenantsRes.json();
        if (tenantsData.success) {
          // Filter tenants expiring in < 7 days or already expired but active
          const risk = tenantsData.data
            .filter((t: any) => t.isExpired || (t.status === 'active' && t.virtualStatus === 'suspended'))
            .slice(0, 3); // Take top 3
          setExpiringTenants(risk);
        }

      } catch (err) {
        console.error('Error fetching financial data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = stats?.revenue?.total || 0;
  const totalSubscribers = stats?.activeCompanies || 0;

  // Map backend stats to chart data
  const revenueBreakdown = stats?.revenue?.perPlan || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Revenue Intelligence
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">Global</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Lattice-level fiscal monitoring and subscription tier analysis.</p>
        </div>
        <div className="relative w-full md:max-w-xs group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search tiers or organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <KPIPaymentCard
          label="Total Monthly Liquidity"
          value={`€${(totalRevenue / 1000).toFixed(1)}k`}
          trend="+14.2% from forecast"
          icon={<Wallet className="text-emerald-500" />}
          color="bg-emerald-50"
        />
        <KPIPaymentCard
          label="Active Subscription Nodes"
          value={totalSubscribers}
          trend={`${stats?.revenue?.retentionRate || 98.2}% Retention Rate`}
          icon={<Users className="text-indigo-500" />}
          color="bg-indigo-50"
        />
        <KPIPaymentCard
          label="Conversion Velocity"
          value={`${stats?.revenue?.conversionRate || 0}%`}
          trend="Real-time Conversion"
          icon={<Target className="text-rose-500" />}
          color="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Revenue Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-10 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Yield Breakdown</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Monthly Revenue per Service Tier</p>
            </div>
            <ArrowUpRight className="text-indigo-500" />
          </div>
          <div className="h-80 flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={50}>
                  {revenueBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Near Expiration Alert Zone */}
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Renewal Risk</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-rose-500">Critical Timeframes</p>
          </div>
          <div className="space-y-4">
            {expiringTenants.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Critical Risks</p>
              </div>
            ) : (
              expiringTenants.map((item: any, i: number) => (
                <div key={i} className="group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${item.isExpired ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                      {item.isExpired ? 'Critical' : 'Warning'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Clock size={14} />
                      <span className="text-xs font-black">{item.isExpired ? 'EXPIRED' : 'NEAR'}</span>
                    </div>
                    <p className="text-sm font-black text-slate-600">{item.plan}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm">
            Generate Invoices Bulk
          </button>
        </div>
      </div>

      {/* Service Tiers Interaction Zone */}
      <h3 className="text-xl font-black text-slate-800 tracking-tight border-b-2 border-indigo-600 w-fit pb-1">Tier Orchestration</h3>
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {(allPlans.length > 0 ? allPlans : [])
          .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
          .map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 group-hover:w-full group-hover:bg-indigo-600/5 transition-all duration-500 opacity-20"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-black text-slate-800 tracking-tighter">{plan.name}</h4>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</p>
                </div>
                <div className="space-y-4 mb-8">
                  <TierMetric label="User Capacity" value={plan.features?.maxUsers || 0} icon={<Users size={14} />} />
                  <TierMetric label="Flow Nodes" value={plan.features?.maxWorkflows || 0} icon={<Zap size={14} />} />
                  <TierMetric label="Cloud Lattice" value={plan.interval === 'month' ? 'Monthly' : 'Yearly'} icon={<CreditCard size={14} />} />
                </div>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Price</p>
                    <p className="text-xl font-black text-indigo-600 mt-1">€{plan.price.toLocaleString()}</p>
                  </div>
                  <button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPIPaymentCard({ label, value, trend, icon, color }: { label: string; value: string | number; trend: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden group hover:shadow-lg transition-all">
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>{icon}</div>
          <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">{trend}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-1">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );
}

function TierMetric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-700">{value}</span>
    </div>
  );
}
