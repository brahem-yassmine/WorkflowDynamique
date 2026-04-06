'use client'

import React, { useState, useEffect, Suspense } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  GitBranch,
  Calendar,
  Layers,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
  Copy,
  Briefcase,
  Play,
  X,
  LayoutGrid,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { showAlert, showConfirm } from '@/lib/alerts';

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
}

function WorkflowsContent() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', domain: 'HR', projectId: '', status: 'draft' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);


  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get('projectId');
  const moduleIdFilter = searchParams.get('moduleId');
  const isTemplateFilter = searchParams.get('isTemplate');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [projectIdFilter, moduleIdFilter, isTemplateFilter]);

  const handleInitialize = async (id: string | undefined) => {
    if (!id) return;
    try {
      const res = await apiService.request(`/workflows/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ title: `Admin Initialization: ${new Date().toLocaleString()}` })
      });
      if (res.success) {
        await showAlert('Success', 'Workflow initialized successfully!', 'success');
        router.push(`/Workflows/instances/${res.data._id}`);
      } else {
        await showAlert('Error', res.message || 'Initialization failed', 'error');
      }
    } catch (error: any) {
      await showAlert('Execution error', 'Execution error: ' + error.message, 'error');
    }
  };

  const fetchData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (projectIdFilter) queryParams.append('projectId', projectIdFilter);
      if (moduleIdFilter) queryParams.append('moduleId', moduleIdFilter);
      if (isTemplateFilter) queryParams.append('isTemplate', isTemplateFilter);

      const [wfRes, projRes] = await Promise.all([
        apiService.request(`/workflows?${queryParams.toString()}`),
        apiService.getProjects()
      ]);

      if (wfRes.success) setWorkflows(wfRes.data);
      if (projRes.success) setProjects(projRes.data);
    } catch (error) {
      // Error fetching workflows
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setWorkflowToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!workflowToDelete) return;
    try {
      const response = await apiService.request(`/workflows/${workflowToDelete}`, { method: 'DELETE' });
      if (response.success) {
        toast.success('Workflow deleted successfully');
        setWorkflows(prev => prev.filter(w => w._id !== workflowToDelete));
      }
    } catch (error: any) {
      toast.error('Error during deletion: ' + error.message);
    } finally {
      setShowDeleteModal(false);
      setWorkflowToDelete(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setDuplicatingId(id);
      const response = await apiService.duplicateWorkflow(id);
      if (response.success) {
        setWorkflows([response.data, ...workflows]);
        toast.success('Workflow cloned successfully!');
      }
    } catch (error: any) {
      toast.error('Error duplicating: ' + error.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!editingWorkflowId) return;

    if (!editForm.name.trim()) {
      toast.error('Workflow Name is required!');
      return;
    }
    if (!editForm.domain || editForm.domain === 'Select Domain') {
      toast.error('Department / Domain is required!');
      return;
    }
    if (!editForm.projectId) {
      toast.error('Workflow must be linked to a Project!');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await apiService.updateWorkflow(editingWorkflowId, {
        name: editForm.name,
        domain: editForm.domain,
        projectId: editForm.projectId || undefined,
        status: editForm.status
      });

      if (response.success) {
        setWorkflows(prev => prev.map(w => w._id === editingWorkflowId ? { ...w, ...response.data } : w));
        setShowEditModal(false);
        setEditingWorkflowId(null);
        toast.success('Workflow updated successfully');
      }

    } catch (error: any) {
      toast.error('Error updating: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (workflow: Workflow) => {
    setEditForm({
      name: workflow.name,
      domain: workflow.domain,
      projectId: workflow.projectId || '',
      status: workflow.status || 'draft'
    });
    setEditingWorkflowId(workflow._id);
    setShowEditModal(true);
  };



  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWorkflowProjectName = (pId?: string) => {
    if (!pId) return "No Project";
    return projects.find(p => p._id === pId)?.name || "Unknown Project";
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'draft': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'archived': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" richColors />
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search workflows by name, domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3">
          {(projectIdFilter || moduleIdFilter) && (
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 border border-indigo-100">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={14} />
                {projectIdFilter ? `Project: ${getWorkflowProjectName(projectIdFilter)}` : 'Module Templates'}
              </span>
              <button 
                onClick={() => router.push('/admin/workflows')}
                className="text-indigo-400 hover:text-indigo-600 font-black"
              >
                ×
              </button>
            </div>
          )}
          <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Clock size={20} />
          </button>
          <Link href={`/create-workflow?${moduleIdFilter ? `moduleId=${moduleIdFilter}&isTemplate=true` : projectIdFilter ? `projectId=${projectIdFilter}` : ''}`}>
            <button className={`flex items-center gap-2 px-6 py-3 ${isTemplateFilter ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'} text-white rounded-xl font-bold shadow-lg transition-all active:scale-95`}>
              <Plus size={18} />
              {isTemplateFilter ? 'Add Template' : 'Create Flow'}
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Workflow Grid/List - Now takes full width */}
        <div className="overflow-y-auto pr-2 custom-scrollbar">
          {filteredWorkflows.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-300">
                <GitBranch size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">No Schema Found</h3>
              <p className="text-slate-500 mt-2 max-w-xs text-sm">Browse our inspiration library or start architecting your first organizational logic schema.</p>
              <Link href="/create-workflow" className="mt-8">
                <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                  Get Started
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-12 pb-8">
              {/* Group by Project */}
              {projects.map(project => {
                const projectWorkflows = filteredWorkflows.filter(w => w.projectId === project._id);
                if (projectWorkflows.length === 0) return null;

                return (
                  <div key={project._id} className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                          <Briefcase size={20} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">{project.name}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">Project Collection</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-100">
                        {projectWorkflows.length} Flows
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projectWorkflows.map(workflow => (
                        <WorkflowCard
                          key={workflow._id}
                          workflow={workflow}
                          projectName={project.name}
                          onClick={() => router.push(`/admin/workflows/${workflow._id}`)}
                          onDelete={handleDelete}
                        />

                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Unassigned Workflows */}
              {filteredWorkflows.filter(w => !w.projectId).length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                        <GitBranch size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Standalone Flows</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">No Project assigned</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {filteredWorkflows.filter(w => !w.projectId).length} Flows
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredWorkflows.filter(w => !w.projectId).map(workflow => (
                      <WorkflowCard
                        key={workflow._id}
                        workflow={workflow}
                        projectName="No Project"
                        onClick={() => router.push(`/admin/workflows/${workflow._id}`)}
                        onDelete={handleDelete}
                      />

                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>


      {/* Edit Metadata Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="bg-indigo-600 p-6 text-white relative">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
                <h3 className="text-xl font-black">Workflow Settings</h3>
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Global Configuration</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Project</label>
                  <select
                    value={editForm.projectId}
                    onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Domain</label>
                      <select
                        value={editForm.domain}
                        onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all"
                      >
                        {['HR', 'Finance', 'IT', 'Sales', 'Management'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        className={`w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 font-bold outline-none transition-all ${editForm.status === 'active' ? 'text-emerald-600 focus:ring-emerald-50' : 'text-slate-700 focus:ring-indigo-50'}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active (Start)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMetadata}
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {isUpdating ? 'Update Info' : 'Update Info'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDeleteModal(false);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden relative"
            >
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-40"
              >
                <X size={20} />
              </button>
              
              <div className="p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-rose-500 flex flex-col items-center justify-center shadow-lg shadow-rose-100 mt-2">
                  <AlertTriangle size={36} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Delete Workflow?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                  Are you sure you want to permanently remove this workflow schema? This action cannot be undone.
                </p>
              </div>

              <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex justify-center gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-8 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-200 transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} /> Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Data...</div>}>
      <WorkflowsContent />
    </Suspense>
  );
}

function WorkflowCard({ workflow, projectName, onClick, onDelete }: { workflow: Workflow; projectName: string; onClick: () => void; onDelete: (id: string) => void }) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'draft': return 'bg-amber-500';
      case 'archived': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-xl hover:shadow-indigo-50`}

    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusColor(workflow.status)}`}></div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
            <GitBranch size={20} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{workflow.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{workflow.domain}</p>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{projectName}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(workflow._id); }}
            className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all"
            title="Delete Workflow"
          >
            <Trash2 size={14} />
          </button>
          <Link href={`/create-workflow?id=${workflow._id}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-2 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded-lg transition-all" title="Edit Schema">
              <Edit size={14} />
            </div>
          </Link>
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(workflow.status)} animate-pulse ml-2`}></div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Blocks</span>
            <span className="text-xs font-black text-slate-700">{workflow.nodes.length}</span>
          </div>
          <div className="h-6 w-px bg-slate-100"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Edges</span>
            <span className="text-xs font-black text-slate-700">{workflow.edges.length}</span>
          </div>
        </div>

        <button className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}



function DetailRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="p-2.5 bg-slate-50 rounded-xl">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
      </div>
      {children}
    </div>
  );
}
