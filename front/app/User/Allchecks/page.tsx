"use client";

import React, { useEffect, useState } from 'react';
import { 
  ListTodo, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Filter,
  MoreVertical,
  ClipboardList,
  AlertCircle,
  Trash2,
  Eye,
  X,
  Plus,
  Briefcase,
  GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';

export default function AllChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchChecklists();
  }, []);



  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const res = await apiService.getChecklists();
      if (res.success) {
        setChecklists(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChecklist = async (e: React.MouseEvent, id: string, instanceId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    // The user wants direct deletion without message
    try {
      // If there is an instanceId, delete the instance (which cascade deletes the checklist)
      // or just delete the checklist if it's standalone.
      let res;
      if (instanceId) {
        res = await apiService.deleteInstance(instanceId);
      } else {
        res = await apiService.deleteChecklist(id);
      }

      if (res.success) {
        setChecklists(prev => prev.filter(c => c._id !== id));
        toast.success('Checklist and tracking data deleted');
      } else {
        toast.error(res.message || 'Failed to delete checklist');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'An error occurred during deletion');
    }
  };

  const filteredChecklists = checklists.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedChecklists = filteredChecklists.reduce((acc, c) => {
    let projectName = "No Project";
    let workflowName = "No Workflow";

    if (c.workflowId) {
      const wId = typeof c.workflowId === 'string' ? null : c.workflowId;
      if (wId) {
        workflowName = wId.name || "Unknown Workflow";
        if (wId.projectId && wId.projectId.name) {
          projectName = wId.projectId.name;
        }
      }
    }

    if (!acc[projectName]) acc[projectName] = {};
    if (!acc[projectName][workflowName]) acc[projectName][workflowName] = [];
    acc[projectName][workflowName].push(c);
    
    return acc;
  }, {} as Record<string, Record<string, any[]>>);

  const uncategorizedChecklists = groupedChecklists["No Project"]?.["No Workflow"] || [];
  if (groupedChecklists["No Project"] && groupedChecklists["No Project"]["No Workflow"]) {
    delete groupedChecklists["No Project"]["No Workflow"];
    if (Object.keys(groupedChecklists["No Project"]).length === 0) {
      delete groupedChecklists["No Project"];
    }
  }

  const getProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const ChecklistDetailModal = ({ checklist, isOpen, onClose }: { checklist: any, isOpen: boolean, onClose: () => void }) => {
    if (!checklist || !isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
        >
          <div className="bg-indigo-600 p-8 text-white shrink-0 relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black tracking-tight uppercase">Strategic Matrix Preview</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">{checklist.name}</p>
          </div>

          <div className="p-8 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
            {(!checklist.tasks || checklist.tasks.length === 0) ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active tactical tasks identified</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checklist.tasks.map((task: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                      task.completed ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                    }`}
                    onClick={async () => {
                      try {
                        const res = await apiService.toggleTaskStatus(checklist._id, task.id);
                        if (res.success) {
                          // Update local State for current modal
                          const updatedChecklist = { ...checklist };
                          updatedChecklist.tasks[idx].completed = !task.completed;
                          setSelectedChecklist(updatedChecklist);
                          
                          // Update list state
                          setChecklists(prev => prev.map(c => c._id === checklist._id ? res.data : c));
                          
                          toast.success(task.completed ? 'Task marked as pending' : 'Task marked as completed');
                        }
                      } catch (err: any) {
                        toast.error('Failed to update task status');
                      }
                    }}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                      {task.completed ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-black tracking-tight leading-none uppercase transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                        {task.completed ? 'Achieved' : 'Click to validate'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      task.priority === 'high' ? 'bg-rose-100 text-rose-600' : 
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {task.priority || 'standard'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-8 pt-0 shrink-0">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-100"
            >
              Exit Overview
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 lg:p-12">
      <Toaster position="top-right" richColors />
      {/* Header Section */}
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                <ListTodo size={28} strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">All CheckLists </h1>
            </div>
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
              Track real-time execution progress of checklists generated across all tactical workflow instances.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group flex-grow md:flex-grow-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search matrices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-72 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <Link href="/User/newCheck">
              <button 
                className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-indigo-100 whitespace-nowrap hover:bg-indigo-700"
              >
                <Plus size={18} strokeWidth={3} />
                Create Checklist
              </button>
            </Link>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardList size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Units</p>
              <h3 className="text-2xl font-black text-slate-900">{checklists.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed</p>
              <h3 className="text-2xl font-black text-slate-900">{checklists.filter(c => c.status === 'completed').length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Clock size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">In Progress</p>
              <h3 className="text-2xl font-black text-slate-900">{checklists.filter(c => c.status !== 'completed').length}</h3>
            </div>
          </div>
        </div>

        {/* Checklists Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanning Network...</p>
          </div>
        ) : filteredChecklists.length > 0 ? (
          <div className="space-y-12 pb-8">
            {Object.entries(groupedChecklists).map(([projectName, w]) => {
              const workflows = w as Record<string, any[]>;
              const projectKeys = Object.keys(workflows);
              const totalProjectChecklists = projectKeys.reduce((acc, curr) => acc + workflows[curr].length, 0);

              return (
                <div key={projectName} className="space-y-6">
                  {/* Project Header */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{projectName}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">Project Collection</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-100">
                      {totalProjectChecklists} Checklists
                    </span>
                  </div>

                  {/* Checklists within Project */}
                  <div className="pl-4 md:pl-8 border-l-2 border-slate-100 mt-6 md:mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                      {(Object.values(workflows) as any[][]).flat().map((checklist: any) => {
                            const progress = getProgress(checklist.tasks);
                            return (
                              <div 
                                key={checklist._id}
                                className="group bg-white border border-slate-100 rounded-[32px] p-8 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden flex flex-col h-full"
                              >
                                {/* Status Indicator Bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 ${checklist.status === 'completed' ? 'bg-emerald-500' : checklist.instanceId ? 'bg-amber-500' : 'bg-indigo-600'}`}></div>

                                <div className="flex justify-between items-start mb-8">
                                  <div className={`p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 ${checklist.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <ListTodo size={24} strokeWidth={2.5} />
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedChecklist(checklist);
                                        setIsPreviewModalOpen(true);
                                      }}
                                      className="p-3 bg-white border border-slate-100 transition-all shadow-sm rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                      title="Quick Preview"
                                    >
                                      <Eye size={20} strokeWidth={2.5} />
                                    </button>
                                    <button 
                                      onClick={(e) => { handleDeleteChecklist(e, checklist._id, checklist.instanceId); }}
                                      className="p-3 bg-white border border-slate-100 transition-all shadow-sm rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                      title="Delete"
                                    >
                                      <Trash2 size={20} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 flex-grow">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                      checklist.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                      {checklist.status || 'Active'}
                                    </span>
                                    {checklist.workflowId && !checklist.instanceId && (
                                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        Workflow Template
                                      </span>
                                    )}
                                    {checklist.instanceId && (
                                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                        Live Instance
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight truncate">
                                    {checklist.name}
                                  </h3>
                                  <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                    {checklist.description || "No tactical objectives defined for this checkpoint matrix."}
                                  </p>
                                </div>

                                {/* Progress Matrix */}
                                <div className="mt-8 space-y-4">
                                  <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Progress</p>
                                    <p className="text-sm font-black text-slate-900">{progress}%</p>
                                  </div>
                                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                                        checklist.status === 'completed' ? 'bg-emerald-500' : checklist.instanceId ? 'bg-amber-500' : 'bg-indigo-600'
                                      }`}
                                      style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle2 size={14} className="text-emerald-500" />
                                      <span>{checklist.tasks?.filter((t: any) => t.completed).length || 0} Tasked</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={14} className="text-indigo-400" />
                                      <span>{checklist.tasks?.length || 0} Total</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50">
                                  <Link 
                                    href={checklist.instanceId ? `/Workflows/instances/${checklist.instanceId}` : (checklist.workflowId ? `/admin/workflows/${(typeof checklist.workflowId === 'string' ? checklist.workflowId : checklist.workflowId._id)}` : `/User/newCheck?id=${checklist._id}`)}
                                    className="flex items-center justify-between w-full group/btn"
                                  >
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover/btn:text-indigo-600 transition-colors">
                                      {checklist.instanceId ? "View Workflow Task" : (checklist.workflowId ? "View Workflow Designer" : "View Detailed Log")}
                                    </span>
                                    <div className="p-2 bg-slate-50 text-slate-400 group-hover/btn:bg-indigo-600 group-hover/btn:text-white rounded-xl transition-all duration-300">
                                      <ArrowRight size={18} />
                                    </div>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </div>
              );
            })}

            {uncategorizedChecklists.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                      <ListTodo size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Standalone Checklists</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">No Project assigned</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {uncategorizedChecklists.length} Checklists
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {uncategorizedChecklists.map((checklist: any) => {
                    const progress = getProgress(checklist.tasks);
                    return (
                      <div 
                        key={checklist._id}
                        className="group bg-white border border-slate-100 rounded-[32px] p-8 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden flex flex-col h-full"
                      >
                        {/* Status Indicator Bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 ${checklist.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>

                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 ${checklist.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                            <ListTodo size={24} strokeWidth={2.5} />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedChecklist(checklist);
                                setIsPreviewModalOpen(true);
                              }}
                              className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all shadow-sm"
                              title="Quick Preview"
                            >
                              <Eye size={20} strokeWidth={2.5} />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteChecklist(e, checklist._id, checklist.instanceId)}
                              className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"
                            >
                              <Trash2 size={20} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                              checklist.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {checklist.status || 'Active'}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-slate-600 transition-colors leading-tight truncate">
                            {checklist.name}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {checklist.description || "No tactical objectives defined for this checkpoint matrix."}
                          </p>
                        </div>

                        {/* Progress Matrix */}
                        <div className="mt-8 space-y-4">
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Progress</p>
                            <p className="text-sm font-black text-slate-900">{progress}%</p>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                                checklist.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              <span>{checklist.tasks?.filter((t: any) => t.completed).length || 0} Tasked</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-slate-400" />
                              <span>{checklist.tasks?.length || 0} Total</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50">
                          <Link 
                            href={checklist.instanceId ? `/Workflows/instances/${checklist.instanceId}` : (checklist.workflowId ? `/admin/workflows/${(typeof checklist.workflowId === 'string' ? checklist.workflowId : checklist.workflowId._id)}` : `/User/newCheck?id=${checklist._id}`)}
                            className="flex items-center justify-between w-full group/btn"
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover/btn:text-slate-600 transition-colors">
                              {checklist.instanceId ? "View Workflow Task" : (checklist.workflowId ? "View Workflow Designer" : "View Detailed Log")}
                            </span>
                            <div className="p-2 bg-slate-50 text-slate-400 group-hover/btn:bg-slate-600 group-hover/btn:text-white rounded-xl transition-all duration-300">
                              <ArrowRight size={18} />
                            </div>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-24 text-center">
            <div className="inline-flex p-6 bg-slate-50 rounded-full text-slate-300 mb-6">
              <AlertCircle size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">No Tactical Data Found</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              Strategic matrices are automatically generated upon workflow initialization. Start a new workflow to begin tracking.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPreviewModalOpen && (
          <ChecklistDetailModal 
            checklist={selectedChecklist} 
            isOpen={isPreviewModalOpen} 
            onClose={() => setIsPreviewModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
