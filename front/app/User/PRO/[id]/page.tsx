"use client";

import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Briefcase, 
  Layers, 
  Workflow, 
  Clock, 
  Trash2, 
  Play, 
  Eye, 
  MoreVertical,
  X,
  PlusSquare,
  Import,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { useParams, useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import { showConfirm } from '@/lib/alerts';

export default function ProjectDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [project, setProject] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, workflowsRes] = await Promise.all([
        apiService.getProjectById(id as string),
        apiService.getWorkflows()
      ]);

      if (projRes.success) {
        setProject(projRes.data);
      }

      if (workflowsRes.success) {
        const projectWorkflows = (workflowsRes.data || []).filter((w: any) => 
          (typeof w.projectId === 'string' ? w.projectId === id : w.projectId?._id === id)
        );
        setWorkflows(projectWorkflows);
      }
    } catch (err: any) {
      console.error('Data sync failed:', err);
      toast.error(err.message || 'Strategic synchronization failed');
      if (err.message?.includes('not found') || err.message?.includes('format')) {
          setTimeout(() => router.push('/User/PRO'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkflow = async (e: React.MouseEvent, workflowId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await showConfirm({
      title: 'TERMINATE: Logic Schema',
      text: 'Are you absolutely sure you want to terminate this operational schema? This action will permanently remove all associated execution data and cannot be recovered.',
      danger: true,
      confirmButtonText: 'Delete Schema'
    });

    if (confirmed) {
      try {
        const res = await apiService.deleteWorkflow(workflowId);
        if (res.success) {
          toast.success('Workflow schema terminated successfully');
          fetchData(); // Refresh list
        }
      } catch (err: any) {
        toast.error(err.message || 'Termination protocol failed');
      }
    }
  };



  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'LOCAL SCHEMAS', value: workflows.length, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'ACTIVE FLOWS', value: workflows.filter(w => w.status === 'active').length, icon: Workflow, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'DRAFT PROTOTYPES', value: workflows.filter(w => w.status === 'draft').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (loading && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 lg:p-12 relative overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* Background Ornament */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-50/50 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-start gap-6">
            <button 
              onClick={() => router.push('/User/PRO')}
              className="mt-2 p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-indigo-600 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 shadow-sm">
                  Project Environment
                </span>
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {project?.name || 'Loading...'}
              </h1>
              <p className="text-slate-500 font-bold max-w-xl text-sm italic">
                {project?.description || 'Active operational strategic portfolio node.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 px-8 py-5 bg-white border border-slate-200 text-indigo-600 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 group">
              <Import size={18} className="group-hover:translate-y-0.5 transition-transform" />
              Import Template
            </button>
            <Link href={`/User/create?projectId=${id}`}>
              <button className="flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95 hover:bg-indigo-700">
                <Plus size={20} strokeWidth={3} />
                New Logic Schema
              </button>
            </Link>
          </div>
        </div>

        {/* Dash Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-md p-8 rounded-[36px] border border-white shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-[24px] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 leading-none">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Workspace Operations */}
        <div className="space-y-8">
          <div className="relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Filter schemas in current workspace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[32px] shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-sm text-slate-900 placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredWorkflows.length > 0 ? (
              filteredWorkflows.map((w) => (
                <div 
                  key={w._id}
                  className="bg-white p-8 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 overflow-hidden">
                       <Workflow size={32} />
                       {/* SVG Decoration from screenshot */}
                       <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                          <svg width="40" height="40" viewBox="0 0 40 40"><path d="M10 20 Q 20 10 30 20 T 40 30" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                       </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${w.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {w.status || 'Draft'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">DO1 Sector</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                        {w.name}
                      </h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {w.description || 'Workflow created via visual editor'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/User/Workflows/${w._id}`}>
                      <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
                        <Eye size={14} fill="white" /> View
                      </button>
                    </Link>
                    <button 
                      onClick={(e) => handleDeleteWorkflow(e, w._id)}
                      className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100"
                      title="Terminate Schema"
                    >
                      <Trash2 size={20} />
                    </button>
                    <Link href={`/User/create?id=${w._id}&projectId=${id}`}>
                      <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all">
                        <MoreVertical size={20} />
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-24 text-center">
                <Layers size={48} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-900 uppercase">Workspace Empty</h3>
                <p className="text-slate-400 text-xs font-bold mt-2 uppercase">No tactical schemas have been deployed to this environment yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
