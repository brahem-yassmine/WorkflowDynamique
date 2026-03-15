'use client'

import React, { useState, useEffect } from 'react';
import {
    Terminal,
    History as HistoryIcon,
    ShieldCheck,
    Search,
    User,
    Clock,
    Activity,
    ChevronRight,
    SearchX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';

type Category = 'LOG' | 'HISTORY' | 'AUDIT';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<Category>('HISTORY');
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const router = useRouter();

    const fetchLogs = async () => {
        try {
            const res = await api.get('/api/tenants/logs');
            if (res.data.success) setLogs(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = logs.filter(log => {
        const catMatch = log.category === activeTab;
        const searchMatch = !search ||
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            log.resource?.name?.toLowerCase().includes(search.toLowerCase());
        return catMatch && searchMatch;
    });

    const handleNavigate = (log: any) => {
        const { resource } = log;
        if (!resource || !resource.type) return;

        const routes: Record<string, string> = {
            'Form': resource.id ? `/form?id=${resource.id}` : '/admin/AllForms',
            'User': '/admin/userManagement',
            'Workflow': '/admin/workflows',
            'Project': '/admin/projects',
            'Task': '/admin/tasks',
            'Checklist': '/admin/AllCheck'
        };

        const path = routes[resource.type];
        if (path) router.push(path);
    };

    const tabs = [
        { id: 'LOG', label: 'Technical Logs', icon: <Terminal size={14} />, desc: 'System traces and connections' },
        { id: 'HISTORY', label: 'Business History', icon: <HistoryIcon size={14} />, desc: 'Creations and deletions' },
        { id: 'AUDIT', label: 'Audit Trail', icon: <ShieldCheck size={14} />, desc: 'Detailed modifications' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Tabs */}
            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Category)}
                        className={`flex-1 min-w-[150px] flex flex-col items-start p-4 rounded-2xl transition-all ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                : 'hover:bg-slate-50 text-slate-400'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {tab.icon}
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </div>
                        <span className={`text-[10px] font-medium opacity-60 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                            {tab.desc}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filter */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search in ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                    className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 shadow-sm"
                />
            </div>

            {/* Content List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
                            <Activity className="animate-spin" size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Fetching data...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200"
                        >
                            <SearchX className="mx-auto text-slate-200 mb-4" size={40} />
                            <p className="text-slate-400 text-xs font-bold">No logs found for this category.</p>
                        </motion.div>
                    ) : (
                        filteredLogs.map((log) => (
                            <motion.div
                                key={log._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Clock size={14} />
                                    <span className="text-[8px] font-black mt-1">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${log.action.includes('DELETE') ? 'bg-rose-50 text-rose-500' :
                                                log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-500' :
                                                    'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {log.action}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 truncate">
                                            {log.user?.name || log.user?.email}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">
                                        Target: <span className="text-slate-600">{log.resource?.type}</span> • {log.resource?.name || 'Unknown'}
                                    </p>
                                </div>

                                <div className="hidden md:flex flex-col items-end gap-1 px-6 border-l border-slate-50">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">Timestamp</span>
                                    <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleDateString('en-US')}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleNavigate(log)}
                                    className="p-3 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
