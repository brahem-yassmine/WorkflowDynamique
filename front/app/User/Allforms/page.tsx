"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Copy,
  Edit3,
  Trash2,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Briefcase,
  GitBranch
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { apiService } from '@/service/api.service';

interface Form {
  _id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'approved' | 'rejected';
  submissionCount: number;
  workflowId?: any;
  createdAt: string;
  steps?: any[];
}

export default function UserAllFormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchForms = async () => {
    try {
      const response = await apiService.getForms();
      if (response.success) {
        setForms(response.data);
      }
    } catch (error: any) {
      console.error("Fetch forms error:", error);
      toast.error("Failed to load forms: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchForms();
  }, []);



  const handleClone = async (id: string) => {
    try {
      const response = await apiService.request(`/forms/${id}/clone`, {
        method: 'POST'
      });
      if (response.success) {
        toast.success("Form cloned successfully!");
        fetchForms();
      }
    } catch (error: any) {
      toast.error("Failed to clone form: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.request(`/forms/${id}`, {
        method: 'DELETE'
      });
      if (response.success) {
        toast.success("Form deleted");
        setForms(forms.filter(f => f._id !== id));
      }
    } catch (error: any) {
      toast.error("Failed to delete form: " + error.message);
    }
  };

  const filteredForms = forms.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  );

  const groupedForms = filteredForms.reduce((acc, form) => {
    let projectName = "Standalone Assets";
    let workflowName = "Directly Initialized Forms";

    if (form.workflowId) {
      const wId = typeof form.workflowId === 'string' ? null : form.workflowId;
      if (wId) {
        workflowName = wId.name || "Unknown Workflow";
        if (wId.projectId && wId.projectId.name) {
          projectName = wId.projectId.name;
        } else {
          projectName = "Uncategorized Workflows";
        }
      } else {
        projectName = "Uncategorized Workflows";
        workflowName = "Unresolved Links";
      }
    }

    if (!acc[projectName]) acc[projectName] = {};
    if (!acc[projectName][workflowName]) acc[projectName][workflowName] = [];
    acc[projectName][workflowName].push(form);
    
    return acc;
  }, {} as Record<string, Record<string, Form[]>>);

  return (
    <div className="min-h-screen pb-20">
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="mt-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-xl shadow-indigo-100 flex-shrink-0">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">All Forms </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1"> Form Management & Protocol Assets</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex-1 min-w-[320px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for specific forms..."
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-bold text-slate-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Link
                href="/form?from=user"
                className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 group支撑 whitespace-nowrap hover:bg-indigo-600"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Initialize Form
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-10">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 p-20 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Empty Registry</h2>
            <p className="text-slate-500 mt-3 font-medium max-w-sm mb-10 leading-relaxed text-sm">No protocols have been committed to this sector. Start by creating a dynamic interactive form.</p>
            <Link
              href="/User/form"
              className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" /> Start Ledger Creation
            </Link>
          </div>
        ) : (
          <div className="space-y-12 pb-8">
            {Object.entries(groupedForms).map(([projectName, w]) => {
              const workflows = w as Record<string, Form[]>;
              const projectKeys = Object.keys(workflows);
              const totalProjectForms = projectKeys.reduce((acc, curr) => acc + workflows[curr].length, 0);

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
                      {totalProjectForms} Forms
                    </span>
                  </div>

                  {/* Forms within Project */}
                  <div className="pl-4 md:pl-8 border-l-2 border-slate-100 mt-6 md:mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {(Object.values(workflows) as any[][]).flat().map((form: any) => (
                            <div
                              key={form._id}
                              onClick={() => router.push(`/form/form3?id=${form._id}&from=user`)}
                              className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all relative overflow-hidden flex flex-col h-full cursor-pointer"
                            >
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="flex items-center justify-between mb-6">
                                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border ${form.status === 'published' || form.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : form.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                                      : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                  }`}>
                                  {form.status === 'published' || form.status === 'approved' ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : form.status === 'rejected' ? (
                                    <Clock className="w-3 h-3" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  {form.status || 'Draft'}
                                </div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                  {new Date(form.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors truncate mb-2 tracking-tight">
                                {form.name}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-8 flex-1 leading-relaxed">
                                {form.description || "Active procedural mapping for organizational consistency and automated tracking."}
                              </p>

                              <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Field Complexity</span>
                                  <span className="text-xl font-black text-slate-800">
                                    {(form.steps || []).reduce((acc: number, step: any) => acc + (step.fields?.length || 0), 0)}{' '}
                                    <span className="text-xs font-bold text-slate-400">Entries</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleClone(form._id); }}
                                    className="p-3 transition-all rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Duplicate Unit"
                                  >
                                    <Copy className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/form?id=${form._id}&from=user`); }}
                                    className="p-3 transition-all rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Reconfigure"
                                  >
                                    <Edit3 className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(form._id); }}
                                    className="p-3 transition-all rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Decommission"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                  <Link
                                    href={`/form/form3?id=${form._id}&from=user`}
                                    className="ml-2 w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 group-hover:bg-indigo-600 group-hover:text-white"
                                    title="Run Interactive"
                                  >
                                    <ArrowRight className="w-5 h-5" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              );
            })}


          </div>
        )}
      </div>
    </div>
  );
}
