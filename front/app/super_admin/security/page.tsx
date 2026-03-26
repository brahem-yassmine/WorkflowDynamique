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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import { toast } from "sonner";
import axios from "axios";

// Threat Vector Mock Data
const threatVectorData = [
  { subject: 'Brute Force', A: 120, fullMark: 150 },
  { subject: 'API Anomaly', A: 98, fullMark: 150 },
  { subject: 'Privilege Esc', A: 86, fullMark: 150 },
  { subject: 'SQLi Attempt', A: 99, fullMark: 150 },
  { subject: 'Zero Day', A: 85, fullMark: 150 },
  { subject: 'DOS Vector', A: 65, fullMark: 150 },
];

// Fallback mock data
const loginAttemptsData = [
  { day: "Mon", attempts: 0 },
  { day: "Tue", attempts: 0 },
  { day: "Wed", attempts: 0 },
  { day: "Thu", attempts: 0 },
  { day: "Fri", attempts: 0 },
  { day: "Sat", attempts: 0 },
  { day: "Sun", attempts: 0 },
];

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        // Fetch logs for export
        const logsRes = await fetch(`http://localhost:5000/api/admin/logs?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const logsData = await logsRes.json();
        if (logsData.success) {
          setLogs(logsData.data.logs);
        }

        // Fetch log stats
        const statsRes = await fetch(`http://localhost:5000/api/admin/logs/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
          
          if (statsData.data.byHour && Array.isArray(statsData.data.byHour)) {
            const hourly = statsData.data.byHour.map((h: any) => ({
              day: `${h._id}h`,
              attempts: h.count
            }));
            setChartData(hourly.length > 0 ? hourly : loginAttemptsData);
          } else {
            setChartData(loginAttemptsData);
          }
        }
      } catch (e) {
        console.error('Error fetching security data:', e);
      }
    };
    fetchData();
  }, []);

  // Calculate Real Threat Vector Data
  const realThreatVectorData = [
    { subject: 'Auth Fails', A: stats?.byActionType?.find((a:any) => a._id === 'LOGIN_FAILED')?.count || 0, fullMark: 100 },
    { subject: 'Sys Errors', A: stats?.byActionType?.find((a:any) => a._id === 'ERROR')?.count || 0, fullMark: 100 },
    { subject: 'Creations', A: stats?.byActionType?.find((a:any) => a._id === 'CREATE')?.count || 0, fullMark: 100 },
    { subject: 'Updates', A: stats?.byActionType?.find((a:any) => a._id === 'UPDATE')?.count || 0, fullMark: 100 },
    { subject: 'Deletions', A: stats?.byActionType?.find((a:any) => a._id === 'DELETE')?.count || 0, fullMark: 100 },
    { subject: 'Sessions', A: (stats?.byActionType?.find((a:any) => a._id === 'LOGIN_SUCCESS')?.count || 0) + (stats?.byActionType?.find((a:any) => a._id === 'LOGOUT')?.count || 0), fullMark: 100 },
  ];
  const maxThreatValue = Math.max(...realThreatVectorData.map(d => d.A));
  const domainMax = maxThreatValue > 0 ? maxThreatValue + Math.ceil(maxThreatValue * 0.2) : 10;

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
      doc.text("Cyber Defense Forensics Report", 14, 20);
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
      
      doc.save(`cyber_forensics_${new Date().getTime()}.pdf`);
      toast.success("Forensic report exported successfully.");
    } catch (error) {
      console.error("PDF Export failed:", error);
      toast.error("Export failed. Please ensure 'jspdf' and 'jspdf-autotable' are installed.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Cyber Defense Hub
            <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Lattice Monitor</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Advanced administrative forensics and lattice-wide integrity tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95"
          >
            <Download size={18} />
            Export Forensics
          </button>
        </div>
      </div>

      {/* Security Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PulseCard 
          label="Total Events Analyzed" 
          value={stats?.totalLogs?.[0]?.total || "0"} 
          status="secure" 
          icon={<Search size={20} />} 
        />
        <PulseCard 
          label="Distinct Threat Origins" 
          value={stats?.byTopIPs?.length || "0"} 
          status={ (stats?.byTopIPs?.length > 0) ? 'warning' : 'secure' } 
          icon={<ShieldAlert size={20} />} 
        />
        <PulseCard 
          label="Failed Attempts" 
          value={stats?.byActionType?.find((a:any) => a._id === 'LOGIN_FAILED')?.count || "0"} 
          status={ (stats?.byActionType?.find((a:any) => a._id === 'LOGIN_FAILED')?.count > 0) ? 'warning' : 'info' } 
          icon={<ShieldX size={20} />} 
        />
        <PulseCard 
          label="System Criticals" 
          value={stats?.byActionType?.find((a:any) => a._id === 'ERROR')?.count || "0"} 
          status={ (stats?.byActionType?.find((a:any) => a._id === 'ERROR')?.count > 0) ? 'warning' : 'info' } 
          icon={<Activity size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Analysis */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-10 shadow-sm border border-slate-100 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Globe size={140} className="text-indigo-900" />
          </div>
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Threat Vector Analysis</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Lattice-wide attack surface monitoring</p>
            </div>
          </div>
          <div className="h-80 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={realThreatVectorData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, domainMax]} tick={false} axisLine={false} />
                <Radar
                  name="Threat Level"
                  dataKey="A"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fill="#f43f5e"
                  fillOpacity={0.15}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6 flex items-center gap-2 shrink-0">
            <ShieldAlert className="text-rose-500" size={20} />
            Recent Critical Errors
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar flex-1">
              {logs?.filter((l: any) => l.actionType === 'ERROR' || l.actionType === 'LOGIN_FAILED').slice(0, 4).length > 0 ? (
                  logs.filter((l: any) => l.actionType === 'ERROR' || l.actionType === 'LOGIN_FAILED').slice(0, 4).map((log: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-colors group">
                          <div className="flex justify-between items-start mb-2 gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-rose-600 transition-colors truncate" title={log.userEmail || log.ipAddress || 'System'}>
                                  {log.userEmail || log.ipAddress || 'System'}
                              </span>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded text-white shrink-0 ${log.actionType === 'ERROR' ? 'bg-rose-600' : 'bg-orange-500'}`}>
                                  {log.actionType === 'ERROR' ? 'SYS ERROR' : 'LOGIN FAILED'}
                              </span>
                          </div>
                          <p className="text-xs font-black text-slate-800 line-clamp-2" title={log.description}>{log.description || 'Unknown error occurred'}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                      </div>
                  ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest h-full flex items-center justify-center">
                    No recent errors detected.
                </div>
              )}
          </div>
          <button 
            onClick={() => {
              const el = document.querySelector('[role="tab"][value="LOG"]') as HTMLElement;
              if (el) el.click();
              document.getElementById("security-protocols")?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 transition-colors shrink-0"
          >
              View Full Error Log
          </button>
        </div>
      </div>

      {/* Audit Lattice Matrix */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldCheck size={140} className="text-indigo-900" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Forensic Activity Matrix</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Real-time cryptographic audit trail</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Forensics Matrix</span>
            </div>
          </div>

          <ActivityRegistry 
            showTitle={false} 
            limit={100} 
            customTabLabels={{
              LOG: 'Security Alerts',
              HISTORY: 'Threat History',
              AUDIT: 'Forensic Audit'
            }}
            defaultTab="LOG"
            variant="light"
            useMonospace={true}
            isSecurityView={true}
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
