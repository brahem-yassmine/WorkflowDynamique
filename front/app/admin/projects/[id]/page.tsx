'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  GitBranch, 
  ArrowLeft, 
  Search, 
  Plus, 
  Briefcase,
  Clock,
  ArrowRight,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';

interface Workflow {
  _id: string;
  name: string;
  domain: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  nodes: any[];
  edges: any[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
}

export default function ProjectWorkflowsPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, wfRes] = await Promise.all([
        apiService.request(`/projects/${projectId}`),
        apiService.request(`/workflows?projectId=${projectId}`)
      ]);

      if (projRes.success) setProject(projRes.data);
      if (wfRes.success) setWorkflows(wfRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.domain.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 px-2 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Project Environment
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
              {project?.name || 'Project Workflows'}
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1 max-w-xl">
              {project?.description || 'Manage all operational logic schemas dedicated to this specific environment.'}
            </p>
          </div>
        </div>
        
        <Link href={`/create-workflow?projectId=${projectId}`}>
          <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap">
            <Plus size={18} />
            Provision New Flow
          </button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Schemas</p>
            <p className="text-2xl font-black text-slate-800">{workflows.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <GitBranch size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Flows</p>
            <p className="text-2xl font-black text-slate-800">{workflows.filter(w => w.status === 'active').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Draft Prototypes</p>
            <p className="text-2xl font-black text-slate-800">{workflows.filter(w => w.status === 'draft').length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Filter workflows by name or domain architecture..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[28px] shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-300"
        />
      </div>

      {/* Grid */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
            <GitBranch className="w-10 h-10 text-slate-200" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Empty Environment</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 mb-8 max-w-xs">This project has no active operational schemas. Start by provisioning your first logic flow.</p>
          <Link href={`/create-workflow?projectId=${projectId}`}>
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
               Provision Flow
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWorkflows.map(workflow => (
            <motion.div
              key={workflow._id}
              whileHover={{ y: -5 }}
              onClick={() => router.push(`/admin/workflows/${workflow._id}`)}
              className="group bg-white rounded-[32px] border border-slate-100 p-8 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <GitBranch size={80} />
              </div>
              
              <div className="flex justify-between items-start mb-8">
                <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                  workflow.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  workflow.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {workflow.status}
                </div>
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">
                      {workflow.domain}
                   </div>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors uppercase">
                {workflow.name}
              </h3>
              <p className="text-sm font-medium text-slate-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                {workflow.description || "Operational logic for high-throughput organizational processing."}
              </p>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Logic Nodes</p>
                    <p className="text-sm font-black text-slate-700">{workflow.nodes.length}</p>
                  </div>
                  <div className="w-px h-6 bg-slate-100" />
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Transitions</p>
                    <p className="text-sm font-black text-slate-700">{workflow.edges.length}</p>
                  </div>
                </div>
                
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                   <ArrowRight size={20} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
