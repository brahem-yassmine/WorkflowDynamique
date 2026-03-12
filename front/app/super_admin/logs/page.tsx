'use client'

import React, { useState, useEffect } from 'react';
import { 
    Terminal, 
    History as HistoryIcon, 
    ShieldCheck, 
    Search,
    Clock,
    Activity,
    ChevronRight,
    SearchX,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

type Category = 'LOG' | 'HISTORY' | 'AUDIT';

export default function SuperAdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<Category>('LOG');
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const router = useRouter();

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/logs`, {
                params: {
                    page,
                    limit: 50,
                    search
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setLogs(res.data.data.logs);
                setTotal(res.data.data.pagination.total);
            }
        } catch (e) {
            console.error('Error fetching logs:', e);
            toast.error('Failed to fetch activity logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, search]);

    // Map backend action types to Admin-style categories
    const getCategory = (actionType: string): Category => {
        if (['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'ERROR'].includes(actionType)) return 'LOG';
        if (['CREATE', 'DELETE'].includes(actionType)) return 'HISTORY';
        return 'AUDIT'; // UPDATE, STATUS_CHANGE, etc.
    };

    const filteredLogs = logs.filter(log => getCategory(log.actionType) === activeTab);

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/logs/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'master_logs.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            toast.error('Failed to export logs');
        }
    };

    const handleNavigate = (log: any) => {
        if (log.entityType === 'TENANT') {
            router.push(`/super_admin/companies`);
        }
    };

    const tabs = [
        { id: 'LOG', label: 'Technical Logs', icon: <Terminal size={14} />, desc: 'System traces and connections' },
        { id: 'HISTORY', label: 'Business History', icon: <HistoryIcon size={14} />, desc: 'Creations and deletions' },
        { id: 'AUDIT', label: 'Audit Trail', icon: <ShieldCheck size={14} />, desc: 'Detailed modifications' }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 p-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">ACTIVITY REGISTRY</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Master System Synchronization Protocol</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download size={14} />
                        Export Data
                    </button>
                    <button 
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Sync Registry
                    </button>
                </div>
            </div>

            {/* Matrix Tabs */}
            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as Category);
                            setPage(1);
                        }}
                        className={`flex-1 min-w-[200px] flex flex-col items-start p-5 rounded-2xl transition-all ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100' 
                            : 'hover:bg-slate-50 text-slate-400'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-white/10' : 'bg-slate-50'}`}>
                                {tab.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </div>
                        <span className={`text-[10px] font-medium opacity-60 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                            {tab.desc}
                        </span>
                    </button>
                ))}
            </div>

            {/* Advanced Search & Filtering */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search in ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                    className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 shadow-sm"
                />
            </div>

            {/* Entity List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <Activity className="animate-spin text-indigo-600" size={48} />
                                <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse"></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Filtering Matrix...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="py-24 text-center bg-white rounded-[48px] border border-dashed border-slate-200"
                        >
                            <SearchX className="mx-auto text-slate-200 mb-6" size={64} />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No logs found for this category.</p>
                        </motion.div>
                    ) : (
                        filteredLogs.map((log) => (
                            <motion.div
                                key={log._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-xl hover:translate-x-2 transition-all flex items-center gap-8 group"
                            >
                                {/* Time marker */}
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                                        <Clock size={16} />
                                        <span className="text-[9px] font-black mt-1">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0" onClick={() => handleNavigate(log)}>
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full ${
                                            log.actionType === 'DELETE' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 
                                            log.actionType === 'CREATE' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 
                                            log.actionType === 'ERROR' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' :
                                            'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                        }`}>
                                            {log.actionType}
                                        </span>
                                        <div className="h-4 w-px bg-slate-100"></div>
                                        <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {log.userName || log.userEmail}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                            {log.userRole?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-slate-600 font-bold truncate max-w-xl">
                                            {log.description}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Target</span>
                                            <span className="text-[9px] font-black text-slate-700">{log.entityName || log.entityType}</span>
                                        </div>
                                        {log.ipAddress && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                                <span className="text-[8px] font-black text-slate-400 uppercase">IP</span>
                                                <span className="text-[9px] font-black text-slate-700">{log.ipAddress}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Meta */}
                                <div className="hidden lg:flex flex-col items-end gap-1 px-8 border-l border-slate-100 h-12 justify-center">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Master Protocol</span>
                                    <span className="text-[10px] font-black text-slate-900 opacity-60">
                                        {new Date(log.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                {/* Action */}
                                <button 
                                    onClick={() => handleNavigate(log)}
                                    className="p-4 rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
            
            {/* Pagination Grid */}
            {!isLoading && total > 50 && (
                <div className="flex justify-center pt-8">
                    <div className="bg-white p-2 rounded-2xl flex gap-1 shadow-sm border border-slate-100">
                        {Array.from({ length: Math.ceil(total / 50) }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                                    page === i + 1 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                    : 'text-slate-400 hover:bg-slate-50'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
