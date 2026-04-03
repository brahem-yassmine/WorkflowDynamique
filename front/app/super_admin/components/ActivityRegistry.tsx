"use client";

import React, { useState, useEffect } from "react";
import { 
    Terminal, History as HistoryIcon, ShieldCheck, Search, Clock, ChevronRight, RefreshCw, Trash2, AlertTriangle, ShieldX 
} from "lucide-react";
import { showAlert, showConfirm } from "@/lib/alerts";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface ActivityRegistryProps {
    limit?: number;
    showTitle?: boolean;
    includeActions?: string[];
    excludeActions?: string[];
    customTabLabels?: {
        LOG?: string;
        HISTORY?: string;
        AUDIT?: string;
    };
    defaultTab?: 'LOG' | 'HISTORY' | 'AUDIT';
    variant?: 'light' | 'dark';
    useMonospace?: boolean;
    isSecurityView?: boolean;
    apiEndpoint?: string;
    isTenantView?: boolean;
}

export default function ActivityRegistry({ 
    limit = 10, 
    showTitle = true,
    includeActions,
    excludeActions,
    customTabLabels,
    defaultTab,
    variant = 'light',
    useMonospace = false,
    isSecurityView = false,
    apiEndpoint = 'http://localhost:5000/api/admin/logs',
    isTenantView = false
}: ActivityRegistryProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'LOG' | 'HISTORY' | 'AUDIT'>(defaultTab || 'LOG');
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const router = useRouter();

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const url = apiEndpoint.startsWith('http') 
                ? `${apiEndpoint}?limit=${limit}&search=${search}`
                : `http://localhost:5000${apiEndpoint}?limit=${limit}&search=${search}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Support both {logs: [], pagination: {}} and simple []
                let fetchedLogs = Array.isArray(data.data) ? data.data : (data.data.logs || []);
                
                // Filter by include/exclude actions if provided
                if (includeActions && includeActions.length > 0) {
                    fetchedLogs = fetchedLogs.filter((log: any) => includeActions.includes(log.actionType || log.action));
                }
                if (excludeActions && excludeActions.length > 0) {
                    fetchedLogs = fetchedLogs.filter((log: any) => !excludeActions.includes(log.actionType || log.action));
                }

                setLogs(fetchedLogs);
            }
        } catch (e) {
            console.error('Error fetching activity logs:', e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteLog = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation
        const confirmed = await showConfirm({
            title: 'Delete Log Entry',
            text: 'Are you sure you want to permanently delete this audit record?',
            confirmButtonText: 'Yes, Delete',
            danger: true
        });

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('auth_token');
            const baseUrl = apiEndpoint.startsWith('http') ? apiEndpoint : `http://localhost:5000${apiEndpoint}`;
            const res = await fetch(`${baseUrl}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLogs(logs.filter(l => l._id !== id));
            }
        } catch (e) {
            console.error('Error deleting log:', e);
        }
    };

    const handlePurgeCategory = async () => {
        const confirmed = await showConfirm({
            title: `Purge ${activeTab} Matrix`,
            text: `This will permanently delete ALL logs in the ${activeTab} category. This action is irreversible.`,
            confirmButtonText: `Purge ${activeTab}`,
            danger: true
        });

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('auth_token');
            const baseUrl = apiEndpoint.startsWith('http') ? apiEndpoint : `http://localhost:5000${apiEndpoint}`;
            const res = await fetch(`${baseUrl}/purge`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    category: activeTab,
                    isSecurityView
                })
            });
            const data = await res.json();
            if (data.success) {
                fetchLogs();
            }
        } catch (e) {
            console.error('Error purging logs:', e);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [search, limit]);

    const getCategory = (log: any): any => {
        if (log.category) return log.category; // Trust explicit category if provided (Tenant)
        
        const action = log.actionType || log.action || '';
        
        if (isSecurityView) {
            if (['LOGIN_FAILED', 'ERROR'].includes(action)) return 'LOG'; 
            if (['LOGIN_SUCCESS', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'SIGN_IN', 'SIGN_OUT'].includes(action)) return 'HISTORY'; 
            return 'AUDIT';
        }
        if (['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'ERROR', 'SIGN_IN', 'SIGN_OUT'].includes(action)) return 'LOG';
        if (['CREATE', 'DELETE', 'STATUS_CHANGE', 'SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_EXPIRATION', 'CREATE_FORM', 'DELETE_FORM', 'CREATE_USER', 'DELETE_USER', 'CREATE_WORKFLOW', 'DELETE_WORKFLOW', 'CREATE_TASK', 'DELETE_TASK', 'CREATE_PROJECT', 'DELETE_PROJECT'].includes(action)) return 'HISTORY';
        return 'AUDIT';
    };

    const getActionColor = (action: string) => {
        if (!action) return 'text-slate-600 bg-slate-50 border-slate-100';
        if (action.includes('FAILED') || action === 'ERROR' || action.includes('DELETE')) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (action.includes('SUCCESS') || action.includes('CREATE') || action === 'SIGN_IN') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    };

    const filteredLogs = activeTab === 'AUDIT' ? logs : logs.filter(log => getCategory(log) === activeTab);

    const tabs = [
        { id: 'LOG', label: customTabLabels?.LOG || 'Technical Logs', icon: <Terminal size={14} />, desc: 'System traces' },
        { id: 'HISTORY', label: customTabLabels?.HISTORY || 'Business History', icon: <HistoryIcon size={14} />, desc: 'Structural changes' },
        { id: 'AUDIT', label: customTabLabels?.AUDIT || 'Audit Trail', icon: <ShieldCheck size={14} />, desc: 'Detailed mods' }
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
                <div className={`flex ${variant === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-1.5 rounded-2xl shadow-sm border gap-1 order-2 md:order-1`}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                ? (variant === 'dark' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100')
                                : (variant === 'dark' ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50')
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 order-3 md:order-3">
                    <button
                        onClick={handlePurgeCategory}
                        disabled={filteredLogs.length === 0}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                            variant === 'dark' 
                            ? 'bg-rose-950/30 text-rose-500 border border-rose-900/50 hover:bg-rose-600 hover:text-white' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <ShieldX size={14} />
                        Purge {activeTab}
                    </button>
                    <button 
                        onClick={() => fetchLogs()}
                        className={`p-2.5 rounded-xl border shadow-sm transition-all ${
                            variant === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-600'
                        }`}
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="relative group flex-1 min-w-[300px] order-1 md:order-2">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 ${variant === 'dark' ? 'text-slate-600 group-focus-within:text-rose-500' : 'text-slate-300 group-focus-within:text-indigo-500'} transition-colors`} size={16} />
                    <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search in ${activeTab.toLowerCase()} matrix...`}
                        className={`w-full pl-12 pr-6 py-3 ${variant === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300 focus:ring-rose-900/20' : 'bg-white border-slate-100 text-slate-700 focus:ring-indigo-50'} border rounded-2xl text-sm font-bold outline-none focus:ring-4 transition-all placeholder:text-slate-600 shadow-sm`}
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
                                className={`${variant === 'dark' ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-50 hover:shadow-md'} p-5 rounded-2xl border shadow-sm transition-all flex items-center gap-6 group cursor-pointer`}
                                onClick={() => router.push(log.entityType === 'TENANT' ? '/super_admin/companies' : '/super_admin/Log')}
                            >
                                <div className={`w-10 h-10 rounded-xl ${variant === 'dark' ? 'bg-slate-950 text-slate-500 group-hover:bg-rose-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'} flex flex-col items-center justify-center transition-all transform group-hover:rotate-6`}>
                                    <Clock size={14} />
                                    <span className="text-[8px] font-black mt-0.5">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border ${getActionColor(log.actionType || log.action)}`}>
                                            {log.actionType || log.action}
                                        </span>
                                        <div className={`w-1 h-1 ${variant === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} rounded-full`}></div>
                                        <span className={`text-xs font-black truncate ${variant === 'dark' ? 'text-slate-200' : 'text-slate-900'} ${useMonospace ? 'font-mono' : ''}`}>
                                            {log.userName || log.userEmail || log.user?.name || log.user?.email || 'System'}
                                        </span>
                                    </div>
                                    <p className={`text-xs font-medium truncate ${variant === 'dark' ? 'text-slate-500' : 'text-slate-500'} ${useMonospace ? 'font-mono tracking-tight' : ''}`}>
                                        {log.description || log.action.replace(/_/g, ' ')}
                                    </p>
                                    
                                    {(isSecurityView || isTenantView) && (
                                        <div className={`mt-3 pt-3 border-t ${variant === 'dark' ? 'border-slate-800' : 'border-slate-100'} flex items-center gap-6 text-[10px] font-mono text-slate-400`}>
                                            <div className="flex items-center gap-2">
                                                <span className="opacity-40 font-black uppercase tracking-tighter">IP:</span>
                                                <span className={variant === 'dark' ? 'text-rose-400' : 'text-indigo-600'}>{log.ipAddress || log.ip || '127.0.0.1'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="opacity-40 font-black uppercase tracking-tighter">Res:</span>
                                                <span className="truncate max-w-[150px]">{log.resource?.type || log.entityType || '---'}</span>
                                            </div>
                                            {(log.requestId || log.sessionId) && (
                                                <div className="hidden lg:flex items-center gap-2">
                                                    <span className="opacity-40 font-black uppercase tracking-tighter">ID:</span>
                                                    <span className="truncate max-w-[100px]">{log.requestId || log.sessionId}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className={`text-[10px] font-black opacity-40 uppercase tracking-widest leading-none mb-1 ${variant === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>{isTenantView ? 'Resource' : 'Target'}</p>
                                    <p className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${variant === 'dark' ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                                        {log.entityName || log.entityType || log.resource?.name || log.resource?.type || '---'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 border-l pl-4 border-slate-100">
                                    <button
                                        onClick={(e) => handleDeleteLog(log._id, e)}
                                        className={`p-2 rounded-lg transition-all ${
                                            variant === 'dark' ? 'text-slate-700 hover:bg-rose-900/30 hover:text-rose-500' : 'text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                                        }`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <ChevronRight 
                                        onClick={() => {
                                            if (isTenantView && log.resource?.type) {
                                                const routes: Record<string, string> = {
                                                    'Form': log.resource.id ? `/form?id=${log.resource.id}` : '/admin/AllForms',
                                                    'User': '/admin/userManagement',
                                                    'Workflow': '/admin/workflows',
                                                    'Project': '/admin/projects'
                                                };
                                                const path = routes[log.resource.type];
                                                if (path) router.push(path);
                                            } else {
                                                router.push(log.entityType === 'TENANT' ? '/super_admin/companies' : '/super_admin/Log');
                                            }
                                        }}
                                        className={`${variant === 'dark' ? 'text-slate-700 group-hover:text-rose-500' : 'text-slate-200 group-hover:text-indigo-600'} transition-colors cursor-pointer`} 
                                        size={18} 
                                    />
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
