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

import { api } from '../../services/api';

interface AuditLog {
    _id: string;
    timestamp: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    action: string;
    resource: {
        type: string;
        id: string;
        name: string;
    };
    metadata: any;
}

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/api/tenants/logs');
            if (response.data.success) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        if (isLive) {
            const interval = setInterval(fetchLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [isLive]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-GB');
    };

    const getStatusColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-rose-500';
        if (action.includes('UPDATE')) return 'text-amber-500';
        if (action.includes('CREATE')) return 'text-emerald-500';
        if (action.includes('SIGN_IN')) return 'text-indigo-500';
        return 'text-slate-500';
    };

    const getActionIcon = (action: string) => {
        if (action.includes('USER')) return <User size={16} />;
        if (action.includes('WORKFLOW')) return <Network size={16} />;
        if (action.includes('PROJECT')) return <Cpu size={16} />;
        if (action.includes('SIGN_IN')) return <Shield size={16} />;
        if (action.includes('FORM')) return <Activity size={16} />;
        return <Terminal size={16} />;
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Live Monitor Feed */}
            <section className="bg-slate-900 rounded-[40px] shadow-2xl border border-slate-800 overflow-hidden">
                <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'} rounded-full`}></div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Forensic Telemetry</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white'}`}
                        >
                            {isLive ? 'Live Feed' : 'Feed Paused'}
                        </button>
                        <button 
                            onClick={fetchLogs}
                            className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Monospaced Log Stream */}
                <div className="p-10 font-mono text-xs overflow-y-auto max-h-[400px] custom-scrollbar space-y-3">
                    {logs.length === 0 ? (
                        <div className="text-white/20 italic">No activity logs found...</div>
                    ) : (
                        logs.map((log) => (
                            <motion.div
                                key={log._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-4 group"
                            >
                                <span className="text-white/20 whitespace-nowrap">[{formatTime(log.timestamp)}]</span>
                                <span className={`font-black whitespace-nowrap min-w-[120px] ${getStatusColor(log.action)}`}>
                                    ::{log.action}
                                </span>
                                <span className="text-white/60 group-hover:text-white transition-colors underline decoration-white/10">{log.user?.name || log.user?.email || 'System'}</span>
                                <span className="text-white/40 italic">-- {log.resource?.type}: {log.resource?.name || log.resource?.id || 'N/A'}</span>
                                <span className="ml-auto text-white/20">ID_{log._id.substring(log._id.length - 6)}</span>
                            </motion.div>
                        ))
                    )}
                </div>
            </section>

            {/* Analytical Overviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <LogMetricCard label="Session Continuity" value="Stable" icon={<CheckCircle2 size={18} />} color="text-emerald-500" />
                <LogMetricCard label="Total Events" value={logs.length.toString()} icon={<Activity size={18} />} color="text-indigo-500" />
                <LogMetricCard label="Active Users" value={Array.from(new Set(logs.map(l => l.user?.id))).length.toString()} icon={<User size={18} />} color="text-amber-500" />
            </div>

            {/* Visual Activity Timeline */}
            <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Admin Activity Timeline</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sequential Event Reconstruction</p>
                    </div>
                </div>

                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-100 before:to-transparent">
                    {logs.slice(0, 10).map((log, index) => (
                        <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            {/* Icon */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                {getActionIcon(log.action)}
                            </div>
                            {/* Content */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-black text-slate-800 text-sm tracking-tight">{log.user?.name || log.user?.email}</div>
                                    <time className="font-mono text-[10px] font-black text-indigo-500 uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                                </div>
                                <div className="text-xs font-bold text-slate-500">
                                    Executed <span className={`uppercase tracking-widest text-[10px] ${getStatusColor(log.action)}`}>[{log.action}]</span>
                                </div>
                                <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-400 font-bold flex items-center gap-2">
                                    <Terminal size={12} className="text-slate-300" />
                                    <span>Target: {log.resource?.type} / {log.resource?.name || 'ID_'+log.resource?.id?.toString().substring(0,6)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

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
                            Action
                        </button>
                        <button className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                            <Download size={14} />
                            Export Data
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Time Index</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">User / Email</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Action</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Resource Details</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-10 py-6 text-sm font-semibold text-slate-400 tracking-tighter">{new Date(log.timestamp).toLocaleString('en-GB')}</td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{log.user?.name || log.user?.email}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{log.user?.role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-6 font-mono text-xs font-black uppercase italic tracking-tighter ${getStatusColor(log.action)}`}>
                                        <div className="flex items-center gap-2">
                                            {getActionIcon(log.action)}
                                            [{log.action}]
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-xs text-slate-500 font-medium leading-relaxed">
                                        <span className="text-slate-400 uppercase tracking-widest text-[10px] mr-2">{log.resource?.type}:</span>
                                        {log.resource?.name || log.resource?.id}
                                    </td>
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
