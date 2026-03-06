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
import TaskExecutionPanel from '../../Workflows/_components/TaskExecutionPanel';

interface WorkflowTask {
    _id: string;
    instanceId: string;
    nodeId: string;
    title: string;
    workflowName: string;
    instanceTitle: string;
    projectName: string;
    type: 'workflow' | 'kanban';
    taskType: 'Formulaire' | 'Tâche' | 'validation' | 'upload' | 'informative' | 'form' | 'normal' | string;
    status: 'pending' | 'completed';
    priority: string;
    createdAt: string;
    dueDate?: string;
    description?: string;
    linkedFormId?: string;
}

export default function UserTasksPage() {
    const [tasks, setTasks] = useState<WorkflowTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

    // Side Panel State
    const [selectedInstance, setSelectedInstance] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isFetchingTask, setIsFetchingTask] = useState(false);

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

    const handleTaskClick = async (task: WorkflowTask) => {
        if (task.status === 'completed') {
            toast.info("This task is already completed.");
            return;
        }

        try {
            setIsFetchingTask(true);
            if (task.type === 'kanban') {
                // Mock instance and node for Kanban task
                setSelectedInstance({
                    _id: task._id,
                    title: task.instanceTitle || 'Direct Task',
                    status: 'in_progress',
                    isKanban: true
                } as any);

                setSelectedNode({
                    id: task._id,
                    data: {
                        label: task.title,
                        description: task.description,
                        taskType: task.taskType === 'Formulaire' || task.taskType === 'form' ? 'Form' : 'normal',
                        linkedObjectId: task.linkedFormId,
                        userAction: (task.taskType === 'Formulaire' || task.taskType === 'form') ? 'Fill Form' : 'Complete Task'
                    }
                } as any);
            } else {
                const res = await apiService.getInstance(task.instanceId);
                if (res.success) {
                    const instance = res.data;
                    const node = (instance.workflowId?.nodes || []).find((n: any) => n.id === task.nodeId);

                    if (node) {
                        setSelectedInstance(instance);
                        setSelectedNode(node);
                    } else {
                        toast.error("Task details not found in workflow lattice");
                    }
                } else {
                    toast.error("Failed to fetch instance details");
                }
            }
        } catch (err) {
            console.error("Task fetch error:", err);
            toast.error("Network synchronization failed");
        } finally {
            setIsFetchingTask(false);
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.workflowName && t.workflowName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.projectName && t.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.instanceTitle && t.instanceTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

    const displayTasks = activeTab === 'active'
        ? filteredTasks.filter(t => t.status !== 'completed')
        : filteredTasks.filter(t => t.status === 'completed');

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Tab Section */}
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="bg-white p-1.5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 inline-flex items-center gap-1 w-fit">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'active'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-y-[-1px]'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            My Action Center ({activeTasksCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'completed'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-y-[-1px]'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Workflow Registry ({completedTasksCount})
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search in ${activeTab === 'active' ? 'Action Center' : 'Registry'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none w-full md:w-80 transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Mapping Process Lattice...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Queue Clear</h3>
                    <p className="text-slate-500 font-medium text-center mt-2 max-w-sm">
                        No tasks are currently assigned to you.
                    </p>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="flex items-center gap-3 px-2">
                        {activeTab === 'active' ? (
                            <>
                                <Activity className="text-indigo-600 w-5 h-5" />
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Pending Actions</h2>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Completed History</h2>
                            </>
                        )}
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    {displayTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                            <Layers className="w-16 h-16 mb-4 text-slate-300" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching results in this section</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {displayTasks.map((task) => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onClick={() => handleTaskClick(task)}
                                        isFetching={isFetchingTask}
                                        currentSelected={selectedNode?.id}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {selectedNode && selectedInstance && (
                    <TaskExecutionPanel
                        instance={selectedInstance || {}}
                        node={selectedNode}
                        onClose={() => {
                            setSelectedNode(null);
                            setSelectedInstance(null);
                        }}
                        onRefresh={() => {
                            fetchTasks();
                        }}
                    />
                )}
            </AnimatePresence>

            {isFetchingTask && (
                <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] z-[99] flex items-center justify-center">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Syncing Task Data...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskCard({ task, onClick, isFetching, currentSelected }: { task: WorkflowTask, onClick: () => void, isFetching: boolean, currentSelected: any }) {
    const isCompleted = task.status === 'completed';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={!isCompleted ? { y: -5, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' } : {}}
            onClick={onClick}
            className={`p-6 rounded-[2rem] border transition-all h-full group relative overflow-hidden ${isCompleted
                ? 'bg-slate-50/50 border-slate-100 border-dashed'
                : 'bg-white border-slate-100 shadow-sm cursor-pointer'
                }`}
        >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50 ${isCompleted ? 'bg-emerald-50' : 'bg-slate-50'
                }`}></div>

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${isCompleted
                    ? 'bg-emerald-50 text-emerald-500'
                    : task.taskType === 'Formulaire' || task.taskType === 'form' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> :
                        (task.taskType === 'Formulaire' || task.taskType === 'form' ? <FileText size={20} /> : <Zap size={20} />)}
                </div>
                {!isCompleted && (
                    <div className="flex flex-col items-end gap-2 text-right">
                        <div className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                            {task.priority || 'Medium'}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {task.taskType}
                        </span>
                    </div>
                )}
                {isCompleted && (
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Completed
                    </span>
                )}
            </div>

            <div className="flex-1 relative z-10">
                <h4 className={`text-lg font-black leading-tight mb-3 transition-colors ${isCompleted ? 'text-slate-500' : 'text-slate-800 group-hover:text-indigo-600'
                    }`}>
                    {task.title}
                </h4>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-500">
                        <FolderKanban size={14} className={isCompleted ? "text-slate-300" : "text-indigo-400"} />
                        <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                            Project: <span className={isCompleted ? "text-slate-400" : "text-slate-700"}>{task.projectName}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <Workflow size={14} className={isCompleted ? "text-slate-300" : "text-indigo-400"} />
                        <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                            Flow: <span className={isCompleted ? "text-slate-400" : "text-slate-700"}>{task.workflowName}</span>
                        </span>
                    </div>
                    {task.instanceTitle && (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Layers size={14} className={isCompleted ? "text-slate-300" : "text-indigo-400"} />
                            <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                                Instance: <span className={isCompleted ? "text-slate-400" : "text-slate-700"}>{task.instanceTitle}</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between text-slate-400 relative z-10">
                <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                </div>
                {!isCompleted && (
                    <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all">
                        {isFetching && currentSelected === task.nodeId ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <ChevronRight size={16} />
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
