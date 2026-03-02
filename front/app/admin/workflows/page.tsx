'use client'

import React, { useState, useEffect } from 'react';
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
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', domain: 'HR', projectId: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get('projectId');

  useEffect(() => {
    fetchData();
  }, [projectIdFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, projRes] = await Promise.all([
        apiService.request(`/workflows${projectIdFilter ? `?projectId=${projectIdFilter}` : ''}`),
        apiService.getProjects()
      ]);

      if (wfRes.success) setWorkflows(wfRes.data);
      if (projRes.success) setProjects(projRes.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const response = await apiService.request(`/workflows/${id}`, { method: 'DELETE' });
      if (response.success) {
        setWorkflows(prev => prev.filter(w => w._id !== id));
        if (selectedWorkflow?._id === id) setSelectedWorkflow(null);
      }
    } catch (error: any) {
      alert('Error during deletion: ' + error.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setDuplicatingId(id);
      const response = await apiService.duplicateWorkflow(id);
      if (response.success) {
        setWorkflows([response.data, ...workflows]);
        alert('Workflow cloned successfully! You can find it as a "(copy)" version.');
      }
    } catch (error: any) {
      alert('Error duplicating: ' + error.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!selectedWorkflow || !editForm.name.trim()) return;
    try {
      setIsUpdating(true);
      const response = await apiService.updateWorkflow(selectedWorkflow._id, {
        name: editForm.name,
        domain: editForm.domain,
        projectId: editForm.projectId || undefined
      });

      if (response.success) {
        setWorkflows(prev => prev.map(w => w._id === selectedWorkflow._id ? { ...w, ...response.data } : w));
        setSelectedWorkflow({ ...selectedWorkflow, ...response.data });
        setShowEditModal(false);
      }
    } catch (error: any) {
      alert('Error updating: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = () => {
    if (!selectedWorkflow) return;
    setEditForm({
      name: selectedWorkflow.name,
      domain: selectedWorkflow.domain,
      projectId: selectedWorkflow.projectId || ''
    });
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
          {projectIdFilter && (
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 border border-indigo-100">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={14} />
                Project: {getWorkflowProjectName(projectIdFilter)}
              </span>
              <Link href="/admin/workflows">
                <button className="text-indigo-400 hover:text-indigo-600 font-black">×</button>
              </Link>
            </div>
          )}
          <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Clock size={20} />
          </button>
          <Link href="/create-workflow">
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <Plus size={18} />
              Create Flow
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
        {/* Workflow Grid/List */}
        <div className="lg:col-span-8 overflow-y-auto pr-2 custom-scrollbar">
          {filteredWorkflows.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-300">
                <GitBranch size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">No Flow Found</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Start architecting your organization logic by creating your first workflow.</p>
              <Link href="/admin/create_workflows" className="mt-8">
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
                          isSelected={selectedWorkflow?._id === workflow._id}
                          onClick={() => setSelectedWorkflow(workflow)}
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
                        isSelected={selectedWorkflow?._id === workflow._id}
                        onClick={() => setSelectedWorkflow(workflow)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workflow Inspector */}
        <div className="lg:col-span-4 h-full">
          <AnimatePresence mode="wait">
            {selectedWorkflow ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(selectedWorkflow.status)}`}>
                    {selectedWorkflow.status} Status
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedWorkflow(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                  <GitBranch size={32} />
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{selectedWorkflow.name}</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">{selectedWorkflow.description || 'No description provided for this orchestration schema.'}</p>

                <div className="space-y-6 flex-grow">
                  <DetailRow label="Strategic Domain" icon={<Layers size={16} />}>
                    <span className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">{selectedWorkflow.domain}</span>
                  </DetailRow>
                  <DetailRow label="Project" icon={<Briefcase size={16} />}>
                    <span className="text-sm font-bold text-slate-700">{getWorkflowProjectName(selectedWorkflow.projectId)}</span>
                  </DetailRow>
                  <DetailRow label="Node Logic" icon={<CheckCircle2 size={16} />}>
                    <span className="text-sm font-bold text-slate-700">{selectedWorkflow.nodes.length} Blocks Configured</span>
                  </DetailRow>
                  <DetailRow label="Protocol Version" icon={<Calendar size={16} />}>
                    <span className="text-sm font-bold text-slate-700">
                      {new Date(selectedWorkflow.updatedAt).toLocaleDateString()}
                    </span>
                  </DetailRow>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-3">
                  <Link href={`/create-workflow?id=${selectedWorkflow._id}`} className="block">
                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                      <Layers size={16} />
                      Edit Visual Flow
                    </button>
                  </Link>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDuplicate(selectedWorkflow._id)}
                      disabled={duplicatingId === selectedWorkflow._id}
                      className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all font-bold disabled:opacity-50"
                    >
                      <Copy size={14} />
                      {duplicatingId === selectedWorkflow._id ? 'Cloning...' : 'Clone Flow'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedWorkflow._id)}
                      className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-100/30 rounded-3xl border border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-slate-200 border border-slate-100">
                  <Eye size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-400 tracking-tight">Select a Workflow</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Select an item from the list to view its architecture or start editing.</p>
              </div>
            )}
          </AnimatePresence>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="bg-indigo-600 p-6 text-white">
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
    </div>
  );
}

function WorkflowCard({ workflow, projectName, isSelected, onClick }: { workflow: Workflow; projectName: string; isSelected: boolean; onClick: () => void }) {
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
      className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-100 hover:border-indigo-200 shadow-sm'}`}
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
        <div className="flex items-center gap-2">
          <Link href={`/create-workflow?id=${workflow._id}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-2 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded-lg transition-all">
              <Edit size={14} />
            </div>
          </Link>
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(workflow.status)} animate-pulse`}></div>
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
