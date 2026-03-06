'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckSquare,
    Workflow,
    Clock,
    AlertCircle,
    ChevronRight,
    Search,
    CheckCircle2,
    Calendar,
    Layers,
    Zap,
    Loader2,
    FolderKanban,
    FileText,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiService } from '@/service/api.service';
import Link from 'next/link';

interface WorkflowTask {
    _id: string;
    instanceId: string;
    nodeId: string;
    title: string;
    workflowName: string;
    instanceTitle: string;
    projectName: string;
    type: 'workflow';
    taskType: 'Formulaire' | 'Tâche';
    priority: string;
    createdAt: string;
    dueDate?: string;
    description?: string;
}

export default function UserTasksPage() {
    const [tasks, setTasks] = useState<WorkflowTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTasks = async () => {
        try {
            const res = await apiService.getMyTasks();
            if (res.success) {
                setTasks(res.data);
            }
        } catch (error) {
            console.error('Fetch tasks error:', error);
            toast.error('Failed to load your tasks');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.instanceTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <CheckSquare className="text-indigo-600 w-10 h-10" />
                        My Action Center
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 pl-13">
                        {tasks.length} validation steps requiring your attention
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by task, flow or project..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none w-full md:w-80 transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Workflow Lattice...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Queue Clear</h3>
                    <p className="text-slate-500 font-medium text-center mt-2 max-w-sm">
                        No workflow validations are currently assigned to you.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Activity className="text-indigo-600 w-5 h-5" />
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Active Validations</h2>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredTasks.map((task) => (
                                <Link key={task._id} href={`/Workflows/instances/${task.instanceId}`}>
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full group relative overflow-hidden"
                                    >
                                        {/* Background Accent */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50"></div>

                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <div className={`p-3 rounded-2xl ${task.taskType === 'Formulaire' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {task.taskType === 'Formulaire' ? <FileText size={20} /> : <Zap size={20} />}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                    {task.priority}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                    {task.taskType}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 relative z-10">
                                            <h4 className="text-lg font-black text-slate-800 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">
                                                {task.title}
                                            </h4>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <FolderKanban size={14} className="text-indigo-400" />
                                                    <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                                                        Project: <span className="text-slate-700">{task.projectName}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Workflow size={14} className="text-indigo-400" />
                                                    <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                                                        Flow: <span className="text-slate-700">{task.workflowName}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Layers size={14} className="text-indigo-400" />
                                                    <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                                                        Instance: <span className="text-slate-700">{task.instanceTitle}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between text-slate-400 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
