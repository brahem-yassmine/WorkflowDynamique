"use client";

import { useEffect, useState, useRef } from "react";
import { 
  BarChart4, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Workflow, 
  Users, 
  ArrowUpRight,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  FileImage,
  Loader2
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
  Pie,
  Legend
} from "recharts";
// @ts-ignore
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Refs for chart elements
  const areaChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  const handleExport = async (ref: React.RefObject<HTMLDivElement | null>, title: string) => {
    if (!ref.current) return;
    try {
      setExporting(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;

      // Title
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`${title} Report`, margin, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 28);

      // Capture Chart with style sanitization
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false, // Reduce noise from unsupported CSS
        onclone: (clonedDoc: Document) => {
          // 1. Hide the export buttons and other UI noise in the PDF
          const actionButtons = clonedDoc.querySelectorAll('button');
          actionButtons.forEach(btn => {
            if (btn instanceof HTMLElement) btn.style.display = 'none';
          });

          // 2. Fix: html2canvas doesn't support modern oklch/lab colors perfectly
          // We find all elements and ensure they have standard fallbacks
          const elements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = el.style;
            
            if (style.backgroundColor && (style.backgroundColor.includes("oklch") || style.backgroundColor.includes("lab"))) {
                style.backgroundColor = "#ffffff";
            }
            if (style.color && (style.color.includes("oklch") || style.color.includes("lab"))) {
                style.color = "#1e293b";
            }

            const computedStyle = clonedDoc.defaultView?.getComputedStyle(el);
            if (computedStyle) {
              if (computedStyle.backgroundColor.includes("oklch") || computedStyle.backgroundColor.includes("lab")) {
                el.style.backgroundColor = "#ffffff";
              }
              if (computedStyle.color.includes("oklch") || computedStyle.color.includes("lab")) {
                el.style.color = "#1e293b";
              }
            }
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.height / imgProps.width;
      const imgHeight = usableWidth * ratio;

      pdf.addImage(imgData, "PNG", margin, 40, usableWidth, imgHeight);
      pdf.save(`Axia_${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

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
  const newCompaniesWeek = stats?.growth?.reduce((acc: number, curr: any) => acc + (curr.companies || 0), 0) || 0;
  const newWorkflowsWeek = stats?.growth?.reduce((acc: number, curr: any) => acc + (curr.workflows || 0), 0) || 0;

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
          trend={stats?.companiesTrend || "Stable"}
        />
        <GrowthCard 
          label="New Workflows" 
          value={newWorkflowsWeek} 
          period="Last 7 Days" 
          icon={<Workflow size={24} />} 
          trend={stats?.workflowsTrend || "Stable"}
        />
        <GrowthCard 
          label="Total Entities" 
          value={(stats?.totalCompanies || 0) + (stats?.totalUsers || 0)} 
          period="Cumulative" 
          icon={<Users size={24} />} 
          trend="Live"
        />
        <GrowthCard 
          label="Platform Load" 
          value={`${stats?.averageGpuUsage || 0}%`} 
          period="Current" 
          icon={<TrendingUp size={24} />} 
          trend="Optimal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company & Workflow Growth Chart */}
        <div 
          ref={areaChartRef}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group"
        >
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Ecosystem Expansion</h3>
            <button
              onClick={() => handleExport(areaChartRef, "Ecosystem Expansion")}
              disabled={exporting}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
              title="Download Graph"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <TrendingUp size={120} className="text-indigo-900" />
          </div>
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
                  tickFormatter={(val) => {
                    if (!val || typeof val !== 'string') return '';
                    const parts = val.split('-');
                    return parts.length >= 2 ? parts.slice(1).join('/') : val;
                  }}
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
        <div 
          ref={pieChartRef}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group"
        >
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Industry Penetration</h3>
            <button
              onClick={() => handleExport(pieChartRef, "Industry Penetration")}
              disabled={exporting}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
              title="Download Graph"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <PieChartIcon size={120} className="text-indigo-900" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.sectorDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="sector"
                  label={({ percent }: any) => ` ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats?.sectorDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   formatter={(value: any, name: any, props: any) => [value || 0, props.payload.sector || name || ""]}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}
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
        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${(trend.includes('+') || trend === 'New') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
          {trend}
          {(trend.includes('+') || trend === 'New') && <ArrowUpRight size={10} />}
        </div>
      </div>
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-1">
          {typeof value === 'number' && isNaN(value) ? '0' : value}
        </h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[10px] font-medium text-slate-300 mt-2 flex items-center gap-1">
          <Calendar size={10} />
          {period}
        </p>
      </div>
    </div>
  );
}
