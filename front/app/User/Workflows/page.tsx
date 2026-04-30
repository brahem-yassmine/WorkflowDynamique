'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Workflow,
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
  Copy,
  Trash2,
  Plus,
  Edit3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { showAlert, showConfirm } from '@/lib/alerts';
import { usePermissions } from '@/hooks/usePermissions';

interface Workflow {
  _id: string;
  name: string;
  domain: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  nodes: any[];
  edges: any[];
  projectId?: any;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
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
  const { can, permissionDisabledClass, btnDisabledClass } = usePermissions();
  const router = useRouter();

  const handleRestrictedClick = (e: React.MouseEvent, permission: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.error(`Access denied: ${permission} permission required.`);
  };
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectIdParam = searchParams.get('projectId');
  const mode = searchParams.get('mode') || 'operations';
  const initialTab = searchParams.get('tab') === 'registry' ? 'registry' : 'tasks';
  const [activeTab, setActiveTab] = useState<'tasks' | 'registry'>(initialTab);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  
  // Project context
  const [currentProject, setCurrentProject] = useState<Project | null>(null);


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

      // Fetch data in parallel
      const [workflowRes, projectRes, userInstances, domainInstances] = await Promise.all([
        apiService.getWorkflows(),
        apiService.getProjects(),
        apiService.getInstances({ status: 'in_progress', responsibleUser: currentUser?._id || currentUser?.id }),
        apiService.getInstances({ status: 'in_progress', responsibleDomain: currentUser?.domain })
      ]);

      if (workflowRes.success) setWorkflows(workflowRes.data);
      if (projectRes.success) {
        setProjects(projectRes.data);
        if (projectIdParam) {
          const project = projectRes.data.find((p: Project) => p._id === projectIdParam);
          setCurrentProject(project || null);
        }
      }

      const combinedInstances = [...(userInstances.data || [])];
      if (domainInstances.data) {
        domainInstances.data.forEach((inst: WorkflowInstance) => {
          if (!combinedInstances.find(ui => ui._id === inst._id)) {
            combinedInstances.push(inst);
          }
        });
      }
      setInstances(combinedInstances);

      // Auto-switch tab if no specific param
      if (!searchParams.get('tab') && mode !== 'design') {
        if (combinedInstances.length > 0) setActiveTab('tasks');
        else setActiveTab('registry');
      } else if (mode === 'design') {
        setActiveTab('registry');
      }

    } catch (error) {
      console.error('Error fetching page data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteWorkflow = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Workflow Design',
      text: 'Are you sure you want to delete this design?',
      confirmButtonText: 'Yes, Delete',
      danger: true
    });
    if (!confirmed) return;

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

  const handleDuplicate = async (id: string) => {
    try {
      setDuplicatingId(id);
      const response = await apiService.duplicateWorkflow(id);
      if (response.success) {
        setWorkflows([response.data, ...workflows]);
        toast.success('Design cloned successfully in your workspace!');
      }
    } catch (error: any) {
      toast.error('Error duplicating: ' + error.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.domain.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = statusFilter === 'all' || w.status === statusFilter;
    const matchesModeStatus = mode === 'design' ? true : (w.status === 'active' || w.status === 'draft');
    
    // Project filter
    const matchesProject = !projectIdParam || (typeof w.projectId === 'string' ? w.projectId === projectIdParam : w.projectId?._id === projectIdParam);

    return matchesSearch && matchesStatusFilter && matchesModeStatus && matchesProject;
  });

  const ChecklistPreviewModal = ({ workflow, isOpen, onClose }: { workflow: Workflow | null, isOpen: boolean, onClose: () => void }) => {
    if (!workflow || !isOpen) return null;

    const isLogicBlock = (type: string) => {
      const logicTypes = ['start', 'end', 'syncJoin', 'parallelStart', 'parallel_split', 'parallel_join', 'condition', 'gateway', 'split', 'join'];
      return logicTypes.some(t => t.toLowerCase() === type.toLowerCase());
    };

    const tasks = workflow.nodes
      .filter(node => !isLogicBlock(node.type))
      .map(node => ({
        id: node.id,
        title: node.data?.label || node.id,
        type: node.type,
        priority: node.data?.priority || 'medium'
      }));

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
        >
          <div className="bg-indigo-600 p-8 text-white shrink-0 relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black tracking-tight uppercase">Checklist Architecture</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">{workflow.name} Schema</p>
          </div>

          <div className="p-8 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tasks defined</p>
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
            <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
              Close View
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                {currentProject ? <Briefcase size={24} /> : <Workflow size={24} />}
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {currentProject ? `Project: ${currentProject.name}` : 'Workflow Hub'}
              </h1>
            </div>
            <p className="text-indigo-100/70 font-medium max-w-md">
              {currentProject 
                ? `Managing tactical implementations for the strategic layer: ${currentProject.name}`
                : `Access and manage localized operational protocols for ${user?.domain || 'Organization'}.`
              }
            </p>
          </div>

          {projectIdParam && (
             <Link href="/User/PRO">
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                   Back to Portfolios
                </button>
             </Link>
          )}
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-3xl border border-white/10">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Action Readiness</p>
              <p className="text-sm font-black">{instances.length} Active Tasks</p>
            </div>
            <div className="w-10 h-10 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Mode / Tab Switcher */}
      {mode !== 'design' && (
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
            Workflow Registry ({filteredWorkflows.length})
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {(activeTab === 'tasks' && mode !== 'design') ? (
          <motion.div key="tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
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
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${instance.priority === 'high' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{instance.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{instance.workflowId?.name || 'Workflow'}</p>
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
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600`}>
                          {instance.priority} Priority
                        </span>
                        <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
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
          <motion.div key="registry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`space-y-6 ${permissionDisabledClass('Workflow.VIEW')}`}>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter designs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm"
                />
              </div>
              <div className="flex gap-2">
                {mode === 'design' && (
                  <Link 
                    href={can('Workflow.CREATE') ? `/User/create${projectIdParam ? `?projectId=${projectIdParam}` : ''}` : '#'}
                    onClick={(e) => handleRestrictedClick(e, 'Workflow.CREATE')}
                  >
                    <button 
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all ${
                        !can('Workflow.CREATE') ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 grayscale' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                      }`}
                      title={!can('Workflow.CREATE') ? "Matrix Restricted: Workflow.CREATE required" : "Initialize New Architecture"}
                    >
                      <Plus size={16} /> New Design
                    </button>
                  </Link>
                )}
                {['all', 'active', 'draft'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      statusFilter === status ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {filteredWorkflows.length === 0 ? (
              <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center text-slate-300">
                <Layers size={40} className="mx-auto mb-4" />
                <p className="font-black text-xs uppercase tracking-widest">No matching designs</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${permissionDisabledClass('Workflow.VIEW')}`}>
                {filteredWorkflows.map((workflow) => {
                  const isOwner = workflow.userId === (user?._id || user?.id);
                  return (
                    <motion.div layout key={workflow._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Workflow size={24} />
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => { setSelectedWorkflow(workflow); setIsChecklistModalOpen(true); }} 
                            className="p-2 bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600"
                            title="Preview Schema"
                          >
                            <Eye size={16} />
                          </button>
                          {mode === 'design' && isOwner && (
                            <>
                                <button 
                                  onClick={() => can('Workflow.UPDATE') && router.push(`/User/create_workflows?id=${workflow._id}`)}
                                  disabled={!can('Workflow.UPDATE')}
                                  className={`p-2 rounded-xl transition-all ${
                                    btnDisabledClass('Workflow.UPDATE') || 'bg-slate-50 text-slate-400 hover:text-indigo-600'
                                  }`}
                                  title={!can('Workflow.UPDATE') ? "Matrix Restricted" : "Edit Design"}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={(e) => can('Workflow.DELETE') && handleDeleteWorkflow(e, workflow._id)} 
                                  disabled={!can('Workflow.DELETE')}
                                  className={`p-2 rounded-xl transition-all ${
                                    btnDisabledClass('Workflow.DELETE') || 'bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white'
                                  }`}
                                  title={!can('Workflow.DELETE') ? "Matrix Restricted" : "Delete Design"}
                                >
                                  <Trash2 size={16} />
                                </button>
                            </>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{workflow.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest">{workflow.domain} Sector</p>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                          {workflow.projectId?.name || (typeof workflow.projectId === 'string' && projects.find(p => p._id === workflow.projectId)?.name) || 'Global Process'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Architecture</p>
                          <p className="text-xs font-black text-slate-700">{workflow.nodes.length} Nodes</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <p className="text-xs font-black text-indigo-600 uppercase italic">{workflow.status}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => !can('Template.EXECUTE') ? handleRestrictedClick(e, 'Template.EXECUTE') : router.push(`/Workflows/instances/new?workflowId=${workflow._id}`)}
                          className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${
                            !can('Template.EXECUTE') ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50' : 'bg-slate-900 text-white hover:bg-indigo-600'
                          }`}
                          title={!can('Template.EXECUTE') ? "Matrix Restricted: Template.EXECUTE required" : "Initialize Workflow"}
                        >
                          <Play size={14} fill="currentColor" /> Initialize
                        </button>
                        {mode === 'design' && (
                          <button 
                            onClick={(e) => !can('Workflow.CREATE') ? handleRestrictedClick(e, 'Workflow.CREATE') : handleDuplicate(workflow._id)} 
                            disabled={!!duplicatingId} 
                            className={`px-4 py-4 rounded-2xl shadow-sm transition-all ${
                                !can('Workflow.CREATE') ? 'bg-slate-50 text-slate-200 cursor-not-allowed opacity-50' : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600'
                            }`}
                            title={!can('Workflow.CREATE') ? "Matrix Restricted: Workflow.CREATE required" : "Clone Design"}
                          >
                            <Copy size={16} className={duplicatingId === workflow._id ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ChecklistPreviewModal workflow={selectedWorkflow} isOpen={isChecklistModalOpen} onClose={() => setIsChecklistModalOpen(false)} />
    </div>
  );
}
