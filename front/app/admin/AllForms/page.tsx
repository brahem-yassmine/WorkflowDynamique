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
}

export default function AllFormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
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
    let projectName = "No Project";
    let workflowName = "No Workflow";

    if (form.workflowId) {
      const wId = typeof form.workflowId === 'string' ? null : form.workflowId;
      if (wId) {
        workflowName = wId.name || "Unknown Workflow";
        if (wId.projectId && wId.projectId.name) {
          projectName = wId.projectId.name;
        }
      }
    }

    if (!acc[projectName]) acc[projectName] = {};
    if (!acc[projectName][workflowName]) acc[projectName][workflowName] = [];
    acc[projectName][workflowName].push(form);
    
    return acc;
  }, {} as Record<string, Record<string, Form[]>>);

  const uncategorizedForms = groupedForms["No Project"]?.["No Workflow"] || [];
  if (groupedForms["No Project"] && groupedForms["No Project"]["No Workflow"]) {
    delete groupedForms["No Project"]["No Workflow"];
    if (Object.keys(groupedForms["No Project"]).length === 0) {
      delete groupedForms["No Project"];
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">All Forms</h1>
                <p className="text-xs text-gray-500 font-medium">Manage and monitor dynamic workflows</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Link
                href="/form"
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 group whitespace-nowrap"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Create Form
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">No forms found</h2>
            <p className="text-gray-500 mt-2 max-w-sm mb-8">Start by creating your first dynamic form to automate your workflow.</p>
            <Link
              href="/admin/form"
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Start Building
            </Link>
          </div>
        ) : (
          <div className="space-y-12 pb-8">
            {Object.entries(groupedForms).map(([projectName, workflows]) => {
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
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{projectName}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Project Collection</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-100">
                      {totalProjectForms} Forms
                    </span>
                  </div>

                  {/* Workflows within Project */}
                  <div className="space-y-8 pl-4 md:pl-8 border-l-2 border-gray-100">
                    {Object.entries(workflows).map(([workflowName, items]) => (
                      <div key={workflowName} className="space-y-4 relative">
                        {/* Sub-header for Workflow */}
                        <div className="flex items-center gap-3 px-2">
                          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 shadow-sm border border-gray-100">
                            <GitBranch size={16} />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-gray-700 tracking-tight">{workflowName}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Workflow Group</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {items.map((form) => (
                            <div
                              key={form._id}
                              onClick={() => router.push(`/form/form3?id=${form._id}`)}
                              className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all relative overflow-hidden flex flex-col h-full cursor-pointer"
                            >
                              {/* Left status border */}
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              {/* Status Badge */}
                              <div className="flex items-center justify-between mb-4">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${form.status === 'published' || form.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : form.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'bg-indigo-50 text-indigo-600'
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
                                <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(form.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate mb-1">
                                {form.name}
                              </h3>
                              <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-6 flex-1">
                                {form.description || "No description provided."}
                              </p>

                              <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Submissions</span>
                                  <span className="text-lg font-black text-gray-800">{form.submissionCount || 0}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleClone(form._id); }}
                                    className="p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Clone Form"
                                  >
                                    <Copy className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/form?id=${form._id}`); }}
                                    className="p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Edit Form"
                                  >
                                    <Edit3 className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(form._id); }}
                                    className="p-2.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Delete Form"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                  <Link
                                    href={`/form/form3?id=${form._id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="ml-2 w-9 h-9 bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                                    title="View Interactive"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {uncategorizedForms.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-800 tracking-tight">Standalone Forms</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">No Project assigned</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {uncategorizedForms.length} Forms
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uncategorizedForms.map((form) => (
                    <div
                      key={form._id}
                      onClick={() => router.push(`/form/form3?id=${form._id}`)}
                      className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-2xl hover:shadow-gray-500/10 hover:border-gray-200 transition-all relative overflow-hidden flex flex-col h-full cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="flex items-center justify-between mb-4">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${form.status === 'published' || form.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-600'
                            : form.status === 'rejected'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-gray-100 text-gray-500'
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
                        <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(form.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-600 transition-colors truncate mb-1">
                        {form.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-6 flex-1">
                        {form.description || "No description provided."}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Submissions</span>
                          <span className="text-lg font-black text-gray-800">{form.submissionCount || 0}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClone(form._id); }}
                            className="p-2.5 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                            title="Clone Form"
                          >
                            <Copy className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/form?id=${form._id}`); }}
                            className="p-2.5 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                            title="Edit Form"
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(form._id); }}
                            className="p-2.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Form"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                          <Link
                            href={`/form/form3?id=${form._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-2 w-9 h-9 bg-gray-50 text-gray-400 group-hover:bg-gray-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                            title="View Interactive"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
