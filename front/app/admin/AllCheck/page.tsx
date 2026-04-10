"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  ListTodo,
  Copy,
  Edit3,
  Trash2,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  FolderTree,
  Briefcase,
  GitBranch
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/service/api.service';
import useUser from '@/hooks/useUser';
import { toast, Toaster } from 'sonner';

interface Checklist {
  _id: string;
  name: string;
  tasks: any[];
  status: 'draft' | 'completed';
  createdAt: string;
  workflowId?: any;
  instanceId?: string;
}

export default function AllChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { btnDisabledClass } = useUser();

  const fetchChecklists = async () => {
    try {
      const response = await apiService.request('/checklists');
      if (response.success) {
        setChecklists(response.data);
      }
    } catch (error) {
      console.error("Fetch checklists error:", error);
      toast.error("Failed to load checklists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleClone = async (id: string) => {
    try {
      const response = await apiService.request(`/checklists/${id}/clone`, {
        method: 'POST'
      });
      if (response.success) {
        toast.success("Checklist cloned successfully!");
        fetchChecklists();
      }
    } catch (error) {
      toast.error("Failed to clone checklist");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.request(`/checklists/${id}`, {
        method: 'DELETE'
      });
      if (response.success) {
        toast.success("Checklist deleted");
        setChecklists(checklists.filter(c => c._id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete checklist");
    }
  };

  const filteredChecklists = checklists.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group checklists by Project > Workflow
  const groupedChecklists: Record<string, Record<string, Checklist[]>> = {};
  const uncategorizedChecklists: Checklist[] = [];

  filteredChecklists.forEach(checklist => {
    const workflow = checklist.workflowId;
    if (!workflow || typeof workflow === 'string') {
      uncategorizedChecklists.push(checklist);
    } else {
      const workflowName = workflow.name || 'Unknown Workflow';
      const projectName = workflow.projectId?.name || 'Unassigned Project';

      if (!groupedChecklists[projectName]) {
        groupedChecklists[projectName] = {};
      }
      if (!groupedChecklists[projectName][workflowName]) {
        groupedChecklists[projectName][workflowName] = [];
      }
      groupedChecklists[projectName][workflowName].push(checklist);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" richColors />
      
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search checklists..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => router.push('/checklist/designer?source=allchecks')}
          className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap ${btnDisabledClass('CHECKLIST_CREATE')}`}
        >
          <Plus size={18} />
          Create Checklist
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-white rounded-[40px] border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filteredChecklists.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <ListTodo className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Registry Empty</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 mb-8">No dynamic checklists or automated schemas identified in this lattice.</p>
          <button 
            onClick={() => router.push('/checklist/designer?source=allchecks')}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} /> Generate Schema
          </button>
        </div>
      ) : (
        <div className="space-y-12 pb-8">
          {Object.entries(groupedChecklists).map(([projectName, workflows]) => {
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {(Object.values(workflows) as any[][]).flat().map((checklist: any) => (
                          <div
                            key={checklist._id}
                            onClick={() => {
                              if (checklist.instanceId) {
                                router.push(`/Workflows/instances/${checklist.instanceId}?source=allchecks`);
                              } else {
                                router.push(`/checklist/designer?id=${checklist._id}&source=allchecks`);
                              }
                            }}
                            className="cursor-pointer group bg-white rounded-[32px] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all relative overflow-hidden flex flex-col"
                          >
                            <div className={`absolute top-0 left-0 w-1.5 h-full transition-opacity ${checklist.status === 'completed' ? 'bg-emerald-500' : checklist.instanceId ? 'bg-amber-500' : 'bg-indigo-600 opacity-0 group-hover:opacity-100'}`}></div>

                            <div className="flex items-center justify-between mb-6">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Layers size={18} />
                              </div>
                              <div className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                <Calendar size={12} />
                                {new Date(checklist.createdAt).toLocaleDateString()}
                              </div>
                            </div>

                            <h3 className="text-lg font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors">
                              {checklist.name}
                            </h3>

                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                              {checklist.workflowId && !checklist.instanceId && (
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  Workflow Template
                                </span>
                              )}
                              {checklist.instanceId && (
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                                  Live Instance
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">Tasks</span>
                                <span className="text-base font-black text-slate-700">{checklist.tasks?.length || 0}</span>
                              </div>
                              <div className="h-6 w-px bg-slate-100"></div>
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">Status</span>
                                <span className={`text-[10px] font-black uppercase ${checklist.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {checklist.status || 'draft'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                              <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClone(checklist._id);
                                    }}
                                    className={`p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all ${btnDisabledClass('CHECKLIST_CLONE')}`}
                                    title="Clone Checklist"
                                  >
                                    <Copy size={18} />
                                  </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (checklist.instanceId) {
                                      router.push(`/Workflows/instances/${checklist.instanceId}`);
                                    } else {
                                      router.push(`/checklist/designer?id=${checklist._id}&source=allchecks`);
                                    }
                                  }}
                                  className={`p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all ${btnDisabledClass('CHECKLIST_EDIT')}`}
                                  title={checklist.instanceId ? "View Instance" : "Edit Checklist"}
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(checklist._id);
                                  }}
                                  className={`p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ${btnDisabledClass('CHECKLIST_DELETE')}`}
                                  title="Delete Checklist"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (checklist.instanceId) {
                                    router.push(`/Workflows/instances/${checklist.instanceId}`);
                                  } else if (checklist.workflowId) {
                                    const wObj = checklist.workflowId;
                                    const wId = typeof wObj === 'string' ? wObj : (wObj._id || wObj.id || '');
                                    if (wId) router.push(`/create-workflow?id=${wId}`);
                                  } else {
                                    router.push(`/checklist/designer?id=${checklist._id}&source=allchecks`);
                                  }
                                }}
                                className="w-10 h-10 bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm border border-transparent group-hover:shadow-lg group-hover:shadow-indigo-100 active:scale-90"
                              >
                                <ArrowRight size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {uncategorizedChecklists.map((checklist) => (
                  <div
                    key={checklist._id}
                    onClick={() => {
                      if (checklist.instanceId) {
                        router.push(`/Workflows/instances/${checklist.instanceId}?source=allchecks`);
                      } else {
                        router.push(`/checklist/designer?id=${checklist._id}&source=allchecks`);
                      }
                    }}
                    className="cursor-pointer group bg-white rounded-[32px] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-500/10 hover:border-slate-200 transition-all relative overflow-hidden flex flex-col"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full transition-opacity bg-slate-400 opacity-0 group-hover:opacity-100"></div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:bg-slate-600 group-hover:text-white transition-all">
                        <ListTodo size={18} />
                      </div>
                      <div className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <Calendar size={12} />
                        {new Date(checklist.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-800 mb-2 truncate group-hover:text-slate-600 transition-colors">
                      {checklist.name}
                    </h3>
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">Tasks</span>
                        <span className="text-base font-black text-slate-700">{checklist.tasks?.length || 0}</span>
                      </div>
                      <div className="h-6 w-px bg-slate-100"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">Status</span>
                        <span className={`text-[10px] font-black uppercase ${checklist.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {checklist.status || 'draft'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleClone(checklist._id); }} className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Copy size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); router.push(checklist.instanceId ? `/Workflows/instances/${checklist.instanceId}` : `/checklist/designer?id=${checklist._id}&source=allchecks`); }} className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(checklist._id); }} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (checklist.instanceId) {
                            router.push(`/Workflows/instances/${checklist.instanceId}`);
                          } else {
                            router.push(`/checklist/designer?id=${checklist._id}&source=allchecks`);
                          }
                        }}
                        className="w-10 h-10 bg-slate-50 text-slate-300 group-hover:bg-slate-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm border border-transparent group-hover:shadow-lg group-hover:shadow-slate-100 active:scale-90"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
