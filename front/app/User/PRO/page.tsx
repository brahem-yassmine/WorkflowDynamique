"use client";

import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  ArrowRight, 
  MoreVertical, 
  X, 
  LayoutGrid,
  Calendar,
  Layers,
  Clock,
  Trash2,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import { showConfirm } from '@/lib/alerts';
import { usePermissions } from '@/hooks/usePermissions';

export default function ProjectPortfoliosPage() {
  const router = useRouter();
  const { can, btnDisabledClass, permissionDisabledClass } = usePermissions();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'active' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await apiService.getProjects();
      if (res.success) {
        setProjects(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error('Failed to load strategic projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) {
      toast.error('Project name is mandatory');
      return;
    }

    try {
      const res = await apiService.createProject(newProject);
      if (res.success) {
        toast.success(`Project "${newProject.name}" successfully established`);
        setIsModalOpen(false);
        setNewProject({ name: '', description: '', status: 'active' });
        fetchProjects();
      }
    } catch (err: any) {
      toast.error(err.message || 'Creation protocol failed');
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmed = await showConfirm({
      title: 'DANGER: Strategic Dismantling',
      text: 'This action is PERMANENT. Deleting this project will automatically TERMINATE all associated workflows and operational modules. This data cannot be recovered.',
      danger: true,
      confirmButtonText: 'Delete Project & All Data'
    });

    if (confirmed) {
      try {
        const res = await apiService.deleteProject(id);
        if (res.success) {
          toast.success('Project portfolio dismantled successfully');
          fetchProjects();
        }
      } catch (err: any) {
        toast.error(err.message || 'Dismantling protocol failed');
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 lg:p-12">
      <Toaster position="top-right" richColors rotate={true} />
      
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-200/60 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[22px] shadow-xl shadow-indigo-100 flex items-center justify-center text-white">
                <Briefcase size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Project Portfolios</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mt-1">Strategic Operations Layer</p>
              </div>
            </div>
            <p className="text-slate-500 font-bold max-w-lg leading-relaxed text-sm">
              ORGANIZE AND GROUP YOUR WORKFLOWS INTO STRATEGIC PROJECTS.
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white/80 px-6 py-3 rounded-2xl border border-white shadow-sm flex items-center gap-3">
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
                   <p className="text-xs font-black text-slate-900 uppercase">Verifying Ops</p>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative group w-full md:max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search projects by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-4.5 bg-white border border-slate-200 rounded-[24px] shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="p-4.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
               <Clock size={20} />
            </button>
            <button 
              onClick={(e) => !can('Project.CREATE') ? handleRestrictedClick(e, 'Project.CREATE') : setIsModalOpen(true)}
              className={`flex items-center gap-3 px-10 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 ${
                !can('Project.CREATE') ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 grayscale' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
              }`}
              title={!can('Project.CREATE') ? "Matrix Restricted: Contact Authority Architect" : ""}
            >
              <Plus size={20} strokeWidth={3} />
              New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Synching Strategic Data...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={project._id}
                className="group bg-white border border-slate-100 rounded-[32px] p-8 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden cursor-pointer"
                onClick={() => router.push(`/User/PRO/${project._id}`)}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500 rounded-r-full transition-all duration-500 group-hover:w-2"></div>
                
                <div className="flex justify-between items-start mb-10">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-[22px] flex items-center justify-center transition-all duration-500 border border-slate-100 group-hover:border-indigo-100">
                    <Briefcase size={28} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.status || 'ACTIVE'}</span>
                    </div>
                    <button 
                      onClick={(e) => can('Project.DELETE') && handleDeleteProject(e, project._id)}
                      title={!can('Project.DELETE') ? "Matrix Restricted" : "Purge Project"}
                      className={`p-2 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100 ${
                        can('Project.DELETE')
                        ? 'bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white'
                        : 'bg-slate-100 text-slate-300 grayscale opacity-40 cursor-not-allowed pointer-events-none'
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight uppercase">
                    {project.name}
                  </h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.15em]">
                    {project.status || 'ACTIVE'}
                  </p>
                </div>

                <div className="mt-12 flex items-center justify-between border-t border-slate-50 pt-8">
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Created</p>
                    <p className="text-[11px] font-black text-slate-900">{new Date(project.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 group-hover:translate-x-1 shadow-sm">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-32 text-center">
            <div className="inline-flex p-8 bg-slate-50 rounded-[32px] text-slate-200 mb-8 border border-slate-100">
              <Briefcase size={64} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Zero Strategic Data</h3>
            <p className="text-slate-500 font-bold max-w-sm mx-auto text-sm leading-relaxed mb-10">
              Strategic projects act as core pillars for your tactical workflows. Establish your first portfolio to begin scaling.
            </p>
            <button 
              onClick={(e) => !can('Project.CREATE') ? handleRestrictedClick(e, 'Project.CREATE') : setIsModalOpen(true)}
              className={`px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${
                !can('Project.CREATE') ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 grayscale' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
              }`}
              title={!can('Project.CREATE') ? "Matrix Restricted" : ""}
            >
              Initialize First Project
            </button>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="bg-[#1e1b4b] p-10 text-white relative">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-5 mb-4">
                   <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30">
                      <Briefcase size={24} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase">New Strategic Layer</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mt-1">Initialize Project Definition</p>
                   </div>
                </div>
              </div>

              <form onSubmit={handleCreateProject} className="p-10 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Identifier</label>
                  <input 
                    type="text"
                    placeholder="E.g. Digital Transformation 2026"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Objectives</label>
                  <textarea 
                    placeholder="Define the scope and outcomes..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    rows={4}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-300 resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-indigo-600 text-white rounded-[22px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Initialize Layer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
