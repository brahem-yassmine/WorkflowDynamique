'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Search,
  Filter,
  Eye,
  Layers,
  Calendar,
  Clock,
  Briefcase,
  Play,
  CheckCircle2,
  TrendingUp,
  Activity,
  AlertCircle,
  ChevronRight,
  Trash2,
  Edit3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
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

interface WorkflowInstance {
  _id: string;
  title: string;
  status: string;
  priority: string;
  workflowId: any;
  createdAt: string;
  currentNodes: any[];
}

export default function UserWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'registry'>('tasks');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchPageData(parsedUser);
    }
  }, []);

  const fetchPageData = async (currentUser: any) => {
    try {
      setLoading(true);

      // Fetch available templates
      const workflowRes = await apiService.getWorkflows();
      if (workflowRes.success) {
        setWorkflows(workflowRes.data);
      }

      // Fetch pending tasks for the user or their domain
      const instanceParams = {
        status: 'in_progress',
        responsibleUser: currentUser?._id || currentUser?.id,
        // responsibleDomain: currentUser?.domain // We could add this if we want to show department tasks too
      };

      const instanceParamsDomain = {
        status: 'in_progress',
        responsibleDomain: currentUser?.domain
      };

      const [userInstances, domainInstances] = await Promise.all([
        apiService.getInstances({ status: 'in_progress', responsibleUser: currentUser?._id || currentUser?.id }),
        apiService.getInstances({ status: 'in_progress', responsibleDomain: currentUser?.domain })
      ]);

      const combinedInstances = [...(userInstances.data || [])];

      // Add domain instances that are not already in the list
      if (domainInstances.data) {
        domainInstances.data.forEach((inst: WorkflowInstance) => {
          if (!combinedInstances.find(ui => ui._id === inst._id)) {
            combinedInstances.push(inst);
          }
        });
      }

      setInstances(combinedInstances);

      // Auto switch tab if there are tasks
      if (combinedInstances.length > 0) setActiveTab('tasks');
      else setActiveTab('registry');

    } catch (error) {
      console.error('Error fetching page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkflow = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await apiService.deleteWorkflow(id);
      if (res.success) {
        toast.success('Workflow deleted successfully');
        setWorkflows(prev => prev.filter(w => w._id !== id));
      } else {
        toast.error(res.message || 'Failed to delete workflow');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during deletion');
    }
  };

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const ChecklistPreviewModal = ({ workflow, isOpen, onClose }: { workflow: Workflow | null, isOpen: boolean, onClose: () => void }) => {
    if (!workflow || !isOpen) return null;

    const tasks = workflow.nodes
      .filter(node => node.type !== 'start' && node.type !== 'end')
      .map(node => ({
        id: node.id,
        title: node.data?.label || node.id,
        type: node.type,
        priority: node.data?.priority || 'medium'
      }));

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
            <h2 className="text-2xl font-black tracking-tight uppercase">Checklist Architecture</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">{workflow.name} Schema</p>
          </div>

          <div className="p-8 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tasks defined in this logic</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <div className={`p-2 rounded-lg ${task.type === 'condition' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {task.type === 'condition' ? <Filter size={14} /> : <CheckCircle2 size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-700 tracking-tight leading-none uppercase">{task.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{task.type}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      task.priority === 'high' ? 'bg-rose-100 text-rose-600' : 
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {task.priority}
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
              Close Architecture View
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" richColors />
      {/* Header Section */}
      <div className="bg-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <GitBranch size={24} />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Workflow Hub</h1>
            </div>
            <p className="text-indigo-100/70 font-medium max-w-md">
              Manage your pending actions and access standard operating procedures for <span className="text-white font-bold">{user?.domain || 'Organization'}</span>.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Action Readiness</p>
              <p className="text-sm font-black">{instances.length} Active Tasks</p>
            </div>
            <div className="w-10 h-10 bg-emerald-400 rounded-full blur-[2px] animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Tabs / Switcher */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl w-fit border border-slate-100 shadow-sm">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          My Action Center ({instances.length})
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Workflow Registry ({workflows.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tasks' ? (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {instances.length === 0 ? (
              <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800">Clear Horizon</h3>
                <p className="text-slate-500 mt-2">No pending tasks require your validation at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {instances.map((instance) => (
                  <Link href={`/Workflows/instances/${instance._id}`} key={instance._id}>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden">
                      {/* Priority Indicator */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${instance.priority === 'high' ? 'bg-rose-500' : instance.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{instance.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{instance.workflowId?.name || 'Workflow Unit'}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2">
                          <Clock size={12} className="text-indigo-500" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            Started {new Date(instance.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-8">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${instance.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            {instance.priority} Priority
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-2 transition-all">
                          Process Task <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="registry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Filter designs by name or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
                />
              </div>
              <div className="flex gap-2">
                <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Activity size={14} className="text-indigo-500" />
                  {filteredWorkflows.length} Operational Designs
                </div>
              </div>
            </div>

            {/* Grid Display */}
            {filteredWorkflows.length === 0 ? (
              <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Layers size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800">No Designs Available</h3>
                <p className="text-slate-500 mt-2">No templates match your current filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkflows.map((workflow) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={workflow._id}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <GitBranch size={24} />
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${workflow.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                          {workflow.status}
                        </span>
                        
                        <div className="flex gap-1 ml-2">
                          <button 
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setIsChecklistModalOpen(true);
                            }}
                            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm bg-white border border-slate-100"
                            title="View Checklist"
                          >
                            <Eye size={14} />
                          </button>
                          <Link href={`/User/create_workflows?id=${workflow._id}`}>
                             <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                              <Edit3 size={14} />
                            </button>
                          </Link>
                          <button 
                            onClick={(e) => handleDeleteWorkflow(e, workflow._id)}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm bg-white border border-slate-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {workflow.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 h-10">
                      {workflow.description || "Procedural mapping for organizational consistency and automated tracking."}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 bg-slate-50 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Architecture</p>
                        <p className="text-xs font-black text-slate-700">{workflow.nodes.length} Logical Nodes</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain</p>
                        <p className="text-xs font-black text-indigo-600">{workflow.domain}</p>
                      </div>
                    </div>

                    <Link href={`/Workflows/instances/new?workflowId=${workflow._id}`}>
                      <button 
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-200 group-hover:shadow-indigo-200"
                      >
                        <Play size={14} fill="currentColor" />
                        Initialize Process
                      </button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChecklistModalOpen && (
          <ChecklistPreviewModal 
            workflow={selectedWorkflow} 
            isOpen={isChecklistModalOpen} 
            onClose={() => setIsChecklistModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}