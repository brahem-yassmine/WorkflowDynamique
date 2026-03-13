"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
  Terminal,
  Cpu,
  Globe,
  Fingerprint,
  Clock
} from "lucide-react";
import ActivityRegistry from "../components/ActivityRegistry";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { toast } from "sonner";

const defaultChartData = [
  { day: "Day 1", attempts: 0 },
  { day: "Day 2", attempts: 0 },
  { day: "Day 3", attempts: 0 },
  { day: "Day 4", attempts: 0 },
  { day: "Day 5", attempts: 0 },
  { day: "Day 6", attempts: 0 },
  { day: "Day 7", attempts: 0 },
];

export default function GlobalLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>(defaultChartData);
  const [lastPulse, setLastPulse] = useState<string>("Initializing...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        // 1. Fetch Logs (for Registry & Export)
        const logsRes = await fetch(`http://localhost:5000/api/admin/logs?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const logsData = await logsRes.json();
        if (logsData.success) {
          setLogs(logsData.data.logs);
        }

        // 2. Fetch Log Stats (for KPIs & Chart)
        const statsRes = await fetch(`http://localhost:5000/api/admin/logs/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          const s = statsData.data;
          setStats(s);

          // Handle Chart Data (Daily)
          if (s.byDay && Array.isArray(s.byDay)) {
            const mapped = s.byDay.map((d: any) => ({
              day: new Date(d._id).toLocaleDateString(undefined, { weekday: 'short' }),
              attempts: d.count
            }));
            setChartData(mapped.length > 0 ? mapped : defaultChartData);
          }

          // Handle Last Pulse
          if (s.latestLog && s.latestLog[0]?.timestamp) {
            const diff = Date.now() - new Date(s.latestLog[0].timestamp).getTime();
            const min = Math.floor(diff / 60000);
            if (min < 1) setLastPulse("Just Now");
            else if (min < 60) setLastPulse(`${min}m ago`);
            else setLastPulse(`${Math.floor(min / 60)}h ago`);
          } else {
            setLastPulse("No activity");
          }
        }

        // 3. Fetch Global Stats (for Network Nodes)
        const globalRes = await fetch(`http://localhost:5000/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const globalData = await globalRes.json();
        if (globalData.success) {
          setGlobalStats(globalData.data);
        }

      } catch (e) {
        console.error('Error fetching system logs data:', e);
      }
    };
    fetchData();
  }, []);

  const exportPDF = async () => {
    if (logs.length === 0) {
      toast.error("No activity logs available to export.");
      return;
    }

    try {
      // @ts-ignore
      const { jsPDF } = await import('jspdf');
      // @ts-ignore
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("System Activity & Log Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      const tableColumn = ["Timestamp", "Node/User", "Action", "Observation"];
      const tableRows = logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.userName || log.userEmail || "System",
        log.actionType,
        log.description
      ]);

      // @ts-ignore
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo primary
        styles: { fontSize: 8 }
      });
      
      doc.save(`system_logs_${new Date().getTime()}.pdf`);
      toast.success("Log report exported successfully.");
    } catch (error) {
      console.error("PDF Export failed:", error);
      toast.error("Export failed. Please ensure 'jspdf' and 'jspdf-autotable' are installed.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            System Log Explorer
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Live Feed</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Centralized registry for all system-wide operations and audit events.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95"
          >
            <Download size={18} />
            Export Logs
          </button>
        </div>
      </div>

      {/* Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PulseCard label="System Status" value="ACTIVE" status="secure" icon={<ShieldCheck size={20} />} />
        <PulseCard 
          label="Total Events" 
          value={stats?.totalLogs[0]?.total?.toLocaleString() || logs.length.toString()} 
          status="info" 
          icon={<Activity size={20} />} 
        />
        <PulseCard label="Last Pulse" value={lastPulse} status="info" icon={<Clock size={20} />} />
        <PulseCard 
          label="Network Nodes" 
          value={globalStats?.totalCompanies?.toLocaleString() || "..."} 
          status="info" 
          icon={<Globe size={20} />} 
        />
      </div>

      {/* Analytics Chart */}
      <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Terminal size={140} className="text-indigo-900" />
        </div>
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Event Frequency</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Log Activity (7D)</p>
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">SYSTEM OPERATIONAL</div>
        </div>
        <div className="h-72 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 700, color: '#4f46e5' }}
              />
              <Area type="monotone" dataKey="attempts" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorAttempts)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Global Activity Matrix */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldCheck size={140} className="text-indigo-900" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Historical Log Matrix</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Complete system-wide audit history</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Integration</span>
            </div>
          </div>

          <ActivityRegistry 
            showTitle={false} 
            limit={100} 
            excludeActions={['ERROR', 'LOGIN_FAILED']}
            customTabLabels={{
              LOG: 'System Activity',
              HISTORY: 'Business History',
              AUDIT: 'Structural Audit'
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PulseCard({ label, value, status, icon }: { label: string; value: string; status: 'secure' | 'warning' | 'info'; icon: React.ReactNode }) {
  const accentClass = status === 'secure' ? 'text-emerald-500 bg-emerald-50' : status === 'warning' ? 'text-rose-500 bg-rose-50' : 'text-indigo-500 bg-indigo-50';

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${accentClass}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h2 className={`text-2xl font-black mt-1 tracking-tight ${status === 'secure' ? 'text-slate-800' : status === 'warning' ? 'text-rose-600' : 'text-indigo-600'}`}>
        {value}
      </h2>
    </div>
  );
}
