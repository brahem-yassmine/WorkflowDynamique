"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, ChevronLeft, Search, Filter, Activity, Clock, User, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';

const InstancesListPage = () => {
    const [instances, setInstances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchInstances = async () => {
            try {
                setLoading(true);
                const res = await apiService.getInstances();
                if (res.success) {
                    setInstances(res.data);
                }
            } catch (err: any) {
                console.error('Error fetching instances:', err);
                toast.error('Failed to load activity history');
            } finally {
                setLoading(false);
            }
        };
        fetchInstances();
    }, []);

    const filteredInstances = instances.filter(inst => {
        const matchesSearch = inst.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.workflowId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst._id.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/Workflows" className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Execution Registry</h1>
                        <p className="text-slate-500 font-medium">Complete audit trail of all automated processes.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 border border-emerald-100 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Search by ID, title or workflow model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-slate-50 border-none rounded-2xl font-medium focus-visible:ring-indigo-500/20"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="text-slate-400 ml-2" size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-14 px-6 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none ring-0 focus:ring-2 focus:ring-indigo-500/20 min-w-[160px]"
                    >
                        <option value="all">All Status</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Loading registry...</p>
                    </div>
                ) : filteredInstances.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <Activity size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">No records match your criteria.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredInstances.map((inst) => (
                            <Link
                                key={inst._id}
                                href={`/Workflows/instances/${inst._id}`}
                                className="group block bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:border-indigo-100 hover:-translate-y-1 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${inst.status === 'completed' ? 'bg-emerald-50 text-emerald-500' :
                                                inst.status === 'rejected' ? 'bg-rose-50 text-rose-500' :
                                                    inst.status === 'in_progress' ? 'bg-blue-50 text-blue-500' :
                                                        'bg-slate-50 text-slate-400'
                                            }`}>
                                            {inst.status === 'completed' ? <ShieldCheck size={28} /> : <Activity size={28} />}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                    {inst.title}
                                                </h3>
                                                <span className="text-[11px] font-mono text-indigo-400 font-black bg-indigo-50/50 px-2 py-0.5 rounded-md">
                                                    #{inst._id.slice(-6).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        Started {new Date(inst.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <User size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {inst.createdBy?.firstName ? `${inst.createdBy.firstName} ${inst.createdBy.lastName}` : 'System'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <ArrowRight size={14} className="text-indigo-300" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                                        Model: {inst.workflowId?.name || 'Deleted'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 justify-between md:justify-end">
                                        <div className="text-right">
                                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${inst.status === 'in_progress' ? 'bg-blue-500 text-white shadow-blue-200' :
                                                    inst.status === 'completed' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                                        inst.status === 'rejected' ? 'bg-rose-500 text-white shadow-rose-200' :
                                                            'bg-slate-400 text-white shadow-slate-200'
                                                }`}>
                                                {inst.status.replace('_', ' ')}
                                            </div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 group-hover:text-indigo-300 transition-colors">
                                                Click to monitor flow
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Add missing sub-component
const ShieldCheck = ({ size, className }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

export default InstancesListPage;
