"use client";

import React, { useState, useEffect } from "react";
import { 
    Terminal, History as HistoryIcon, ShieldCheck, Search, Clock, ChevronRight, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface ActivityRegistryProps {
    limit?: number;
    showTitle?: boolean;
}

export default function ActivityRegistry({ limit = 10, showTitle = true }: ActivityRegistryProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'LOG' | 'HISTORY' | 'AUDIT'>('LOG');
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const router = useRouter();

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`http://localhost:5000/api/admin/logs?limit=${limit}&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.data.logs);
            }
        } catch (e) {
            console.error('Error fetching activity logs:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [search, limit]);

    const getCategory = (actionType: string): any => {
        if (['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'ERROR'].includes(actionType)) return 'LOG';
        if (['CREATE', 'DELETE', 'STATUS_CHANGE', 'SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRATION'].includes(actionType)) return 'HISTORY';
        return 'AUDIT';
    };

    const filteredLogs = logs.filter(log => getCategory(log.actionType) === activeTab);

    const tabs = [
        { id: 'LOG', label: 'Technical Logs', icon: <Terminal size={14} />, desc: 'System traces' },
        { id: 'HISTORY', label: 'Business History', icon: <HistoryIcon size={14} />, desc: 'Structural changes' },
        { id: 'AUDIT', label: 'Audit Trail', icon: <ShieldCheck size={14} />, desc: 'Detailed mods' }
    ];

    return (
        <div className="space-y-6">
            {showTitle && (
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Global Activity Registry</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Cross-tenant synchronization matrix</p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1 order-2 md:order-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative group flex-1 min-w-[300px] order-1 md:order-2">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search in ${activeTab.toLowerCase()} matrix...`}
                        className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                            <RefreshCw className="animate-spin text-indigo-600" size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Matrix...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No activity found in this sector.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <motion.div
                                key={log._id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-5 rounded-2xl border border-slate-50 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group cursor-pointer"
                                onClick={() => router.push(log.entityType === 'TENANT' ? '/super_admin/companies' : '/super_admin/logs')}
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                    <Clock size={14} />
                                    <span className="text-[8px] font-black mt-0.5">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">{log.actionType}</span>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                        <span className="text-xs font-black text-slate-900 truncate">{log.userName || log.userEmail}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium truncate">{log.description}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-[10px] font-black text-slate-900 opacity-40 uppercase tracking-widest leading-none mb-1">Target</p>
                                    <p className="text-[10px] font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{log.entityName || log.entityType}</p>
                                </div>
                                <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" size={18} />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
