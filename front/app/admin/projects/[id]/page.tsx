'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  GitBranch, 
  ArrowLeft, 
  Search, 
  Plus, 
  Briefcase,
  Clock,
  ArrowRight,
  Layers,
  Download,
  X,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { toast } from 'sonner';

interface Workflow {
  _id: string;
  name: string;
  domainId?: { name: string; _id: string };
  domain?: string; // legacy support
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

interface Module {
    _id: string;
    name: string;
    domainId: { name: string; _id: string } | string;
}

export default function ProjectWorkflowsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const router = useRouter();
  
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Import Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [templates, setTemplates] = useState<Workflow[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, wfRes, modulesRes] = await Promise.all([
        apiService.getProjectById(projectId),
        apiService.getInstances({ projectId }), // This should probably be workflows filtered by projectId
        apiService.getModules()
      ]);

      // Correction: fetch actual workflows for project, not instances
      const actualWfRes = await apiService.request(`/workflows?projectId=${projectId}`);

      if (projRes.success) setProject(projRes.data);
      if (actualWfRes.success) setWorkflows(actualWfRes.data);
      if (modulesRes.success) setModules(modulesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (moduleId: string) => {
      try {
          setIsTemplatesLoading(true);
          const res = await apiService.request(`/workflows?isTemplate=true&moduleId=${moduleId}`);
          if (res.success) setTemplates(res.data);
      } catch (error) {
          toast.error("Failed to load templates");
      } finally {
          setIsTemplatesLoading(false);
      }
  };

  useEffect(() => {
      if (selectedModule) {
          fetchTemplates(selectedModule);
      } else {
          setTemplates([]);
      }
  }, [selectedModule]);

  const handleImport = async (templateId: string) => {
      try {
          const res = await apiService.request(`/workflows/${templateId}/duplicate`, {
              method: 'POST',
              body: JSON.stringify({
                  projectId: projectId,
                  name: templates.find(t => t._id === templateId)?.name + " (Project Copy)"
              })
          });

          if (res.success) {
              toast.success("Template integrated into project workspace");
              setIsImportModalOpen(false);
              fetchData();
          }
      } catch (error: any) {
          toast.error(error.message || "Import protocol failed");
      }
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/admin/projects')}
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
        
        <div className="flex gap-3">
            <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-6 py-4 bg-white border border-indigo-100 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-indigo-50 transition-all active:scale-95 whitespace-nowrap"
            >
                <Download size={18} />
                Import Template
            </button>
            <Link href={`/create-workflow?projectId=${projectId}`}>
                <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap">
                    <Plus size={18} />
                    New Logic Schema
                </button>
            </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Schemas</p>
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
          placeholder="Filter schemas in current workspace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[28px] shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
        />
      </div>

      {/* Grid */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
            <GitBranch className="w-10 h-10 text-slate-200" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Empty Workspace</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 mb-8 max-w-xs">This project has no active operational schemas. Start by importing a template or creating a new flow.</p>
          <div className="flex gap-4">
            <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white border border-indigo-200 text-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm"
            >
               Import Template
            </button>
            <Link href={`/create-workflow?projectId=${projectId}`}>
                <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                New Logic Schema
                </button>
            </Link>
          </div>
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
                   <div className="px-3 py-1 bg-indigo-50 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                      {typeof workflow.domainId === 'object' ? workflow.domainId.name : (workflow.domain || 'Lattice')}
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

      {/* Import Modal */}
      <AnimatePresence>
          {isImportModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsImportModalOpen(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]"
                  >
                      <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                          <div>
                              <h3 className="text-2xl font-black tracking-tight uppercase">Template Repository</h3>
                              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">Matrix Structural Import</p>
                          </div>
                          <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                              <X size={24} />
                          </button>
                      </div>

                      <div className="p-8 flex flex-col gap-6 overflow-hidden">
                          <div className="space-y-4">
                              <div className="flex items-center gap-3 text-slate-400">
                                  <Filter size={18} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Filter by Functional Module</span>
                              </div>
                              <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                                  <button
                                      onClick={() => setSelectedModule('')}
                                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${!selectedModule ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                  >
                                      All Units
                                  </button>
                                  {modules.map(mod => (
                                      <button
                                          key={mod._id}
                                          onClick={() => setSelectedModule(mod._id)}
                                          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedModule === mod._id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                      >
                                          {mod.name}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                              <div className="grid grid-cols-1 gap-4">
                                  {isTemplatesLoading ? (
                                      Array(3).fill(0).map((_, i) => (
                                          <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse" />
                                      ))
                                  ) : templates.length > 0 ? (
                                      templates.map(tmpl => (
                                          <div key={tmpl._id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group flex items-center justify-between gap-6">
                                              <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                                          {tmpl.domainId?.name || 'Standard'}
                                                      </span>
                                                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                          {tmpl.nodes.length} Nodes
                                                      </span>
                                                  </div>
                                                  <h4 className="font-black text-slate-800 uppercase tracking-tight">{tmpl.name}</h4>
                                                  <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{tmpl.description || 'Generic logic template'}</p>
                                              </div>
                                              <button 
                                                onClick={() => handleImport(tmpl._id)}
                                                className="shrink-0 p-4 bg-white text-indigo-600 rounded-2xl shadow-sm border border-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-105"
                                              >
                                                  <Plus size={20} />
                                              </button>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                          <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No available logic templates in this module</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-slate-50 border-t border-slate-100">
                           <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-[0.1em]">
                               Importing creates an <span className="text-indigo-600 font-black">Isolated instance</span>. Modifications won't affect the master template.
                           </p>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
