"use client";

import { useEffect, useMemo, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LogLevel = "info" | "warning" | "error" | "critical";
type LogType = "LOGIN" | "SERVER" | "SECURITY" | "ADMIN" | "2FA";

interface LogItem {
  id: number;
  type: LogType;
  level: LogLevel;
  message: string;
  ip: string;
  user: string;
  date: string;
}

const initialLogs: LogItem[] = [
  { id: 1, type: "LOGIN", level: "warning", message: "Multiple authentication failures detected", ip: "192.168.1.15", user: "system_root", date: "2026-02-12 09:15" },
  { id: 2, type: "SERVER", level: "error", message: "Unexpected 500 terminating /api/lattice/sync", ip: "internal_cluster_3", user: "kernel", date: "2026-02-12 08:42" },
  { id: 3, type: "SECURITY", level: "critical", message: "Encryption key rotation anomaly detected", ip: "88.45.22.11", user: "nexus_admin", date: "2026-02-11 22:10" },
  { id: 4, type: "ADMIN", level: "info", message: "Cross-tenant privilege escalation check: passed", ip: "10.0.0.2", user: "super_master", date: "2026-02-11 16:30" },
  { id: 5, type: "2FA", level: "warning", message: "Biometric bypass attempt originating from mobile node", ip: "41.90.12.8", user: "finance_lead", date: "2026-02-11 14:02" },
];

const loginAttemptsData = [
  { day: "Mon", attempts: 120 }, { day: "Tue", attempts: 98 }, { day: "Wed", attempts: 140 },
  { day: "Thu", attempts: 110 }, { day: "Fri", attempts: 160 }, { day: "Sat", attempts: 70 },
  { day: "Sun", attempts: 90 },
];

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Real-time log stream simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogItem = {
        id: Date.now(),
        type: "SECURITY",
        level: Math.random() > 0.7 ? "warning" : "info",
        message: "Incremental lattice integrity check synchronized",
        ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user: "lattice_daemon",
        date: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => log.message.toLowerCase().includes(search.toLowerCase()) || log.user.toLowerCase().includes(search.toLowerCase()))
      .filter((log) => (levelFilter === "all" ? true : log.level === levelFilter))
      .filter((log) => (typeFilter === "all" ? true : log.type === typeFilter));
  }, [logs, search, levelFilter, typeFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const headers = "Type,Level,Message,IP,User,Date\n";
    const rows = filteredLogs.map((l) => `${l.type},${l.level},${l.message},${l.ip},${l.user},${l.date}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axia_audit_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Cyber Defense Hub
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Live Audit</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Lattice-wide cryptographic integrity and administrative forensics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95"
          >
            <Download size={18} />
            Export Forensics
          </button>
        </div>
      </div>

      {/* Security Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PulseCard label="System Integrity" value="OPTIMAL" status="secure" icon={<ShieldCheck size={20} />} />
        <PulseCard label="Active Threats" value="0" status="secure" icon={<Activity size={20} />} />
        <PulseCard label="Encryption Depth" value="4096-bit" status="info" icon={<Fingerprint size={20} />} />
        <PulseCard label="Lattice Nodes" value="1,240" status="info" icon={<Globe size={20} />} />
      </div>

      {/* Analytics Chart */}
      <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Terminal size={140} className="text-indigo-900" />
        </div>
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Access Frequency</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Authentication Attempts (7D)</p>
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">99.9% VALIDATED</div>
        </div>
        <div className="h-72 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={loginAttemptsData}>
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

      {/* Advanced Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by trace packet, user, or IP signature..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select onValueChange={(v) => setLevelFilter(v)}>
            <SelectTrigger className="w-full md:w-[180px] h-12 rounded-2xl border-slate-100 font-bold text-slate-600 bg-slate-50">
              <SelectValue placeholder="Security Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Full Spectrum</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="error">Error State</SelectItem>
              <SelectItem value="warning">Potential Risk</SelectItem>
              <SelectItem value="info">General Flow</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => setTypeFilter(v)}>
            <SelectTrigger className="w-full md:w-[180px] h-12 rounded-2xl border-slate-100 font-bold text-slate-600 bg-slate-50">
              <SelectValue placeholder="Event Vector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vectors</SelectItem>
              <SelectItem value="LOGIN">Auth Points</SelectItem>
              <SelectItem value="SECURITY">Core Shield</SelectItem>
              <SelectItem value="SERVER">Lattice Nodes</SelectItem>
              <SelectItem value="ADMIN">Command Center</SelectItem>
              <SelectItem value="2FA">Biometrics/2FA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Lattice Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Terminal size={18} className="text-indigo-600" />
            Live Audit Lattice
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stream Active</span>
          </div>
        </div>
        <div className="p-2 space-y-2">
          <AnimatePresence mode="popLayout">
            {paginatedLogs.map((log, index) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="md:col-span-2">
                  <div className={`px-3 py-1 rounded-lg text-center font-black text-[9px] uppercase tracking-tighter ${log.type === 'SECURITY' ? 'bg-indigo-100 text-indigo-700' :
                      log.type === '2FA' ? 'bg-purple-100 text-purple-700' :
                        log.type === 'LOGIN' ? 'bg-slate-100 text-slate-700' :
                          'bg-slate-100 text-slate-400'
                    }`}>
                    {log.type}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 px-1">
                    <Clock size={10} /> {log.date}
                  </p>
                </div>

                <div className="md:col-span-4 flex items-center">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{log.message}</p>
                </div>

                <div className="md:col-span-2 flex items-center">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] bg-slate-100 px-3 py-1.5 rounded-xl">
                    <Globe size={12} className="text-slate-400" />
                    {log.ip}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-black">
                      {log.user.slice(0, 2).toUpperCase()}
                    </div>
                    {log.user}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-end">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${log.level === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                      log.level === 'error' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                        log.level === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                    {log.level}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        <div className="px-8 py-5 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400">
            SHOWING <span className="text-slate-700 font-black">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredLogs.length)}</span> OF <span className="text-slate-700 font-black">{filteredLogs.length}</span> LOG PACKETS
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 text-xs font-black text-indigo-600">PAGE {page} / {totalPages}</div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
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
