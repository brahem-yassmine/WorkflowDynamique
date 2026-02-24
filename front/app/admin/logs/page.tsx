'use client'

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Terminal,
    Search,
    Filter,
    Download,
    AlertCircle,
    CheckCircle2,
    Clock,
    Shield,
    User,
    Cpu,
    Network,
    RefreshCw,
    MoreHorizontal,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditLog {
    id: string;
    timestamp: string;
    source: string;
    action: string;
    status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
    details: string;
}

const INITIAL_LOGS: AuditLog[] = [
    { id: 'LOG-4921', timestamp: '10:45:22', source: 'Lattice Node', action: 'SCHEMA_ARCHITECT', status: 'SUCCESS', details: 'New workflow schema [WF-082] Provisioned successfully.' },
    { id: 'LOG-4922', timestamp: '10:46:05', source: 'Persona Auth', action: 'IDENTITY_SYNC', status: 'WARNING', details: 'Persona [Orion Pax] attempted access with L3 token (L4 Required).' },
    { id: 'LOG-4923', timestamp: '10:47:12', source: 'System Core', action: 'MEMORY_PURGE', status: 'SUCCESS', details: 'Redundant task nodes purged from cache layer.' },
    { id: 'LOG-4924', timestamp: '10:48:30', source: 'Security Gate', action: 'THREAT_NEUTRALIZED', status: 'CRITICAL', details: 'Unauthorized script injection detected in Node 04. Terminated.' },
    { id: 'LOG-4925', timestamp: '10:49:15', source: 'Fiscal Agent', action: 'LEDGER_UPDATE', status: 'SUCCESS', details: 'Transaction [TX-5501] Synced with global treasury.' },
];

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
    const [isLive, setIsLive] = useState(true);

    // Simulated live log updates
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => {
            const newLog: AuditLog = {
                id: `LOG-${Math.floor(Math.random() * 9000) + 1000}`,
                timestamp: new Date().toLocaleTimeString('en-GB'),
                source: ['Lattice Node', 'Persona Auth', 'System Core', 'Security Gate'][Math.floor(Math.random() * 4)],
                action: ['UPTIME_CHECK', 'NODE_SYNC', 'CACHE_FLUSH', 'AUTH_VALIDATION'][Math.floor(Math.random() * 4)],
                status: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'WARNING' : 'CRITICAL') : 'SUCCESS',
                details: 'Automated lattice health check synchronized with master node.'
            };
            setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        }, 3000);
        return () => clearInterval(interval);
    }, [isLive]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">


            {/* Live Monitor Feed */}
            <section className="bg-slate-900 rounded-[40px] shadow-2xl border border-slate-800 overflow-hidden">
                <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Forensic Telemetry</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white'}`}
                        >
                            {isLive ? 'Live Feed' : 'Feed Paused'}
                        </button>
                        <button className="p-2 text-white/40 hover:text-white transition-colors">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                {/* Monospaced Log Stream */}
                <div className="p-10 font-mono text-xs overflow-y-auto max-h-[400px] custom-scrollbar space-y-3">
                    {logs.map((log, idx) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-4 group"
                        >
                            <span className="text-white/20 whitespace-nowrap">[{log.timestamp}]</span>
                            <span className={`font-black whitespace-nowrap min-w-[120px] ${log.status === 'SUCCESS' ? 'text-emerald-500' : log.status === 'WARNING' ? 'text-amber-500' : 'text-rose-500'}`}>
                                ::{log.action}
                            </span>
                            <span className="text-white/60 group-hover:text-white transition-colors underline decoration-white/10">{log.source}</span>
                            <span className="text-white/40 italic">-- {log.details}</span>
                            <span className="ml-auto text-white/20">ID_{log.id}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Analytical Overviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <LogMetricCard label="Uptime Efficiency" value="99.998%" icon={<CheckCircle2 size={18} />} color="text-emerald-500" />
                <LogMetricCard label="Security Intercepts" value="4 detected" icon={<Shield size={18} />} color="text-rose-500" />
                <LogMetricCard label="Active Sync Tasks" value="128 cycles/s" icon={<Activity size={18} />} color="text-indigo-500" />
            </div>

            {/* Historical Audit Table */}
            <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/20">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={16} />
                        <input
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50"
                            placeholder="Filter persistent audit logs..."
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                            <Filter size={14} />
                            Protocol
                        </button>
                        <button className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                            <Download size={14} />
                            Export Forensic Data
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Time Index</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Identity / Source</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Operation</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Lattice Response</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.slice(0, 10).map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-10 py-6 text-sm font-semibold text-slate-400 tracking-tighter">{log.timestamp}</td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                {log.source.includes('Persona') ? <User size={14} /> : <Cpu size={14} />}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{log.source}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-mono text-xs font-black text-indigo-600 uppercase italic tracking-tighter">[{log.action}]</td>
                                    <td className="px-6 py-6 text-xs text-slate-500 font-medium leading-relaxed">{log.details}</td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="p-2 text-slate-300 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function LogMetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <div className="flex items-center gap-3">
                    <div className={`${color}`}>{icon}</div>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
                </div>
            </div>
            <ChevronRight size={20} className="text-slate-100 group-hover:text-indigo-400 transition-colors" />
        </div>
    );
}
