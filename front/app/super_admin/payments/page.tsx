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
  Target,
  Download,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
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
  const [isExporting, setIsExporting] = useState(false);
  
  // Subscriber Details Modal State
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  const handleOpenPlanDetails = async (plan: any) => {
    setSelectedPlanDetails(plan);
    setIsModalOpen(true);
    setLoadingSubscribers(true);
    setSubscribers([]); // Reset previous
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/plans/${plan._id}/subscribers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (expiringTenants.length === 0) return;
    
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('RENEWAL RISK REPORT', 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`ANALYTIC NODE: SYSTEM_ADMIN_FINANCE`, 14, 32);
      doc.text(`TIMESTAMP: ${new Date().toLocaleString().toUpperCase()}`, 14, 37);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(14, 42, 196, 42);

      // Summary Stats in PDF
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Executive Summary`, 14, 52);
      
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const criticalCount = expiringTenants.filter((t: any) => t.isExpired).length;
      doc.text(`Total Organizations at Risk: ${expiringTenants.length}`, 14, 60);
      doc.text(`Critical (Expired): ${criticalCount}`, 14, 65);
      doc.text(`Warning (Near Expiration): ${expiringTenants.length - criticalCount}`, 14, 70);
      
      const tableData = expiringTenants.map((t: any) => [
        t.name || 'Unknown Organization',
        t.isExpired ? 'CRITICAL / EXPIRED' : 'WARNING / NEAR',
        t.selectedPlan?.name || t.planDetails?.name || 'No Plan Active',
        t.currentPeriodEnd ? new Date(t.currentPeriodEnd).toLocaleDateString() : 'LIFETIME'
      ]);
      
      autoTable(doc, {
        startY: 80,
        head: [['ORGANIZATION', 'RISK LEVEL', 'SUBSCRIPTION TIER', 'EXPIRATION DATE']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [79, 70, 229], 
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 5,
          valign: 'middle'
        },
        columnStyles: {
          1: { fontStyle: 'bold' }
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text('CONFIDENTIAL FINANCIAL DATA - INTERNAL USE ONLY', 14, doc.internal.pageSize.height - 10);
          doc.text(`PAGE ${data.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        }
      });
      
      doc.save(`renewal-risks-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

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
          const now = new Date();
          const risk = tenantsData.data
            .filter((t: any) => {
              if (t.isExpired || t.status === 'suspended') return true;
              if (t.currentPeriodEnd) {
                const end = new Date(t.currentPeriodEnd);
                const diffTime = end.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7 && diffDays > 0;
              }
              return false;
            })
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
          value={`${((totalRevenue || 0) / 1000).toFixed(1)}k DT`}
          trend={`${stats?.revenue?.growthTrend || "+0.0%"} from forecast`}
          icon={<Wallet className="text-emerald-500" />}
          color="bg-emerald-50"
        />
        <KPIPaymentCard
          label="Active Subscription Nodes"
          value={totalSubscribers || 0}
          trend={`${stats?.revenue?.retentionRate || 0}% Retention Rate`}
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
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Service Tier Adoption</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Number of organizations per plan</p>
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
                <Bar dataKey="subscribers" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={50}>
                  {revenueBreakdown?.map((entry: any, index: number) => (
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
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                    <p className="text-sm font-black text-slate-600 truncate max-w-[120px]">{item.selectedPlan?.name || item.planDetails?.name || 'No Plan'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting || expiringTenants.length === 0}
            className="w-full mt-8 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Generating PDF...' : 'Download Risk Report'}
          </button>
        </div>
      </div>

      {/* Service Tiers Interaction Zone */}
      <h3 className="text-xl font-black text-slate-800 tracking-tight border-b-2 border-indigo-600 w-fit pb-1">Subscription Plans</h3>
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
                  <p className={`text-[10px] font-black uppercase tracking-widest ${plan.isActive !== false ? 'text-emerald-500' : 'text-slate-400'}`}>{plan.isActive !== false ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="space-y-4 mb-8">
                  <TierMetric label="User Capacity" value={(plan.features?.maxUsers || 0) >= 999999 ? 'Unlimited' : (plan.features?.maxUsers || 0)} icon={<Users size={14} />} />
                  <TierMetric label="Workflows Allowed" value={(plan.features?.maxWorkflows || 0) >= 999999 ? 'Unlimited' : (plan.features?.maxWorkflows || 0)} icon={<Zap size={14} />} />
                  <TierMetric label="Cloud Lattice" value={plan.interval === 'month' ? 'Monthly' : 'Yearly'} icon={<CreditCard size={14} />} />
                </div>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Price</p>
                    <p className="text-xl font-black text-indigo-600 mt-1">{plan.price.toLocaleString()} DT</p>
                  </div>
                  <button 
                    onClick={() => handleOpenPlanDetails(plan)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <ChevronRight size={20} className="group-hover:rotate-45 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Subscriber Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Modal Header */}
            <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter mb-1">{selectedPlanDetails?.name}</h2>
                  <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-xs">Capacity Overview & Active Subscribers</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Features Summary */}
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-indigo-600 transition-colors">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">User Limit</p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                      <Users size={16} />
                    </div>
                    <span className="text-2xl font-black text-slate-800">
                      {(selectedPlanDetails?.features?.maxUsers || 0) >= 999999 ? 'Unlimited' : (selectedPlanDetails?.features?.maxUsers || 0)}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-amber-500 transition-colors">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Workflow Limit</p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
                      <Zap size={16} />
                    </div>
                    <span className="text-2xl font-black text-slate-800">
                      {(selectedPlanDetails?.features?.maxWorkflows || 0) >= 999999 ? 'Unlimited' : (selectedPlanDetails?.features?.maxWorkflows || 0)}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-emerald-500 transition-colors">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Assigned</p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
                      <Target size={16} />
                    </div>
                    <span className="text-2xl font-black text-slate-800">{subscribers.length} Entities</span>
                  </div>
                </div>
              </div>

              {/* Subscribers Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Active Organizations
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full">{subscribers.length}</span>
                </h3>

                {loadingSubscribers ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                    <p className="text-indigo-900 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing instances...</p>
                  </div>
                ) : subscribers.length > 0 ? (
                  <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Organization Name</th>
                          <th className="px-6 py-4 text-center">User Load</th>
                          <th className="px-6 py-4 text-center">Workflows Usage</th>
                          <th className="px-6 py-4 text-right">Domain Access</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscribers.map((sub) => {
                          const isUserUnlimited = (selectedPlanDetails?.features?.maxUsers || 0) >= 999999;
                          const isWorkflowUnlimited = (selectedPlanDetails?.features?.maxWorkflows || 0) >= 999999;
                          const userPercent = isUserUnlimited ? 0 : (sub.consumption?.users / (selectedPlanDetails?.features?.maxUsers || 1)) * 100;
                          const workflowPercent = isWorkflowUnlimited ? 0 : (sub.consumption?.workflows / (selectedPlanDetails?.features?.maxWorkflows || 1)) * 100;
                          const isHighUsage = !isUserUnlimited && (userPercent > 80 || workflowPercent > 80);

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                                    {sub.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-slate-800">{sub.name}</span>
                                      {isHighUsage && <AlertTriangle size={12} className="text-amber-500" />}
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase w-fit ${
                                      sub.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                    }`}>
                                      {sub.status}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 ${userPercent > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                      style={{ width: `${Math.min(userPercent, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-500">
                                    {sub.consumption?.users || 0}/{isUserUnlimited ? '∞' : selectedPlanDetails?.features?.maxUsers}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 ${workflowPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(workflowPercent, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-500">
                                    {sub.consumption?.workflows || 0}/{isWorkflowUnlimited ? '∞' : selectedPlanDetails?.features?.maxWorkflows}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <span className="text-[10px] font-bold text-slate-400 tracking-tight">{sub.domain}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>                ) : (
                  <div className="py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                        <Users className="text-slate-300" size={32} />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active subscribers documented</p>
                      <p className="text-xs text-slate-300 mt-1">This cluster has zero entities assigned currently.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all text-xs"
              >
                Close Window
              </button>
              
            </div>
          </motion.div>
        </div>
      )}
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
            {typeof value === 'number' && isNaN(value) ? '0' : value}
          </h2>
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
