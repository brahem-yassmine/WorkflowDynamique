'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Search,
    Filter,
    Eye,
    Clock,
    Briefcase,
    CheckCircle2,
    TrendingUp,
    AlertCircle,
    ChevronRight,
    GitBranch,
    FilterX,
    Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';

interface WorkflowInstance {
    _id: string;
    title: string;
    status: string;
    priority: string;
    workflowId: any;
    createdAt: string;
    currentNodes: any[];
    createdBy?: any;
}

export default function AdminOperationsPage() {
    const [instances, setInstances] = useState<WorkflowInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('in_progress');
    const [activeView, setActiveView] = useState<'processes' | 'tasks'>('processes');
    const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        fetchPageData();
    }, []);

    const fetchPageData = async () => {
        try {
            setLoading(true);
            // Fetch all instances for admin
            const res = await apiService.getInstances();
            if (res.success) {
                setInstances(res.data);

                // Extract all current pending tasks from all in-progress instances
                const pendingTasks = res.data
                    .filter((inst: any) => inst.status === 'in_progress')
                    .flatMap((inst: any) =>
                        (inst.currentNodes || []).map((node: any) => ({
                            ...node,
                            instanceId: inst._id,
                            instanceTitle: inst.title,
                            workflowName: inst.workflowId?.name,
                            createdAt: inst.createdAt
                        }))
                    );
                setTasks(pendingTasks);
            }
        } catch (error) {
            console.error('Error fetching operations data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInstances = instances.filter(inst => {
        const matchesSearch = inst.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.workflowId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredTasks = tasks.filter(task =>
        task.instanceTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.workflowName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <Activity size={24} className="text-emerald-400" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Operational Control Tower</h1>
                        </div>
                        <p className="text-slate-400 font-medium max-w-md">
                            Universal oversight of all organizational processes. Validate tasks, monitor progress, and resolve blockers.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10 text-center min-w-[120px]">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 text-emerald-400">Processes</p>
                            <p className="text-2xl font-black">{instances.filter(i => i.status === 'in_progress').length}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10 text-center min-w-[120px]">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 text-amber-400">Pending Tasks</p>
                            <p className="text-2xl font-black">{tasks.length}</p>
                        </div>
                    </div>

                    <div className="md:ml-auto">
                        <Link href="/admin/workflows">
                            <button className="px-8 py-4 bg-emerald-500 text-white rounded-[22px] font-black text-xs uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-2">
                                <Plus size={18} strokeWidth={3} />
                                Launch New Process
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* View Switcher & Filters */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-[22px] border border-slate-100 shadow-sm w-full lg:w-auto">
                    <button
                        onClick={() => setActiveView('processes')}
                        className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'processes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Process View
                    </button>
                    <button
                        onClick={() => setActiveView('tasks')}
                        className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Task Queue
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search registry..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-xs text-slate-700"
                        />
                    </div>

                    {activeView === 'processes' && (
                        <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            {['all', 'in_progress', 'completed'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${statusFilter === f ? 'bg-slate-100 text-indigo-600 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {activeView === 'processes' ? (
                /* Grid Display for Processes */
                filteredInstances.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <FilterX size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">No Processes Found</h3>
                        <p className="text-slate-500 mt-2">No execution records match your current filter criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredInstances.map((instance) => (
                            <Link href={`/Workflows/instances/${instance._id}`} key={instance._id}>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${instance.status === 'in_progress' ? 'bg-blue-500' : instance.status === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <GitBranch size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                    {instance.title}
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {instance.workflowId?.name || 'Standard Procedure'}
                                                    <span className="mx-2 text-slate-200">|</span>
                                                    By {instance.createdBy?.firstName || 'User'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getStatusColor(instance.status)}`}>
                                            {instance.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Initiated</span>
                                                <span className="text-xs font-black text-slate-700">{new Date(instance.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="h-6 w-px bg-slate-100"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Wait Time</span>
                                                <span className="text-xs font-black text-slate-700">None</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-2 transition-all">
                                            Monitor Execution <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )
            ) : (
                /* Grid Display for Tasks */
                filteredTasks.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Operational Queue Clear</h3>
                        <p className="text-slate-500 mt-2">No pending tasks require immediate validation at this moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTasks.map((task, idx) => (
                            <Link href={`/Workflows/instances/${task.instanceId}?nodeId=${task.nodeId}`} key={`${task.instanceId}-${task.nodeId}-${idx}`}>
                                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                                {task.label || 'Standard Step'}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                In: <span className="text-slate-600">{task.instanceTitle}</span>
                                                <span className="mx-2 opacity-30">•</span>
                                                Pattern: <span className="text-indigo-500">{task.workflowName}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden md:block">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Active Since</p>
                                            <p className="text-xs font-black text-slate-700">{new Date(task.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 transition-all flex items-center gap-2">
                                            Validate <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
