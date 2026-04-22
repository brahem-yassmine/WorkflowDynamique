'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutGrid,
    Search,
    Edit,
    Trash2,
    Briefcase,
    Zap,
    Sparkles,
    ChevronRight,
    Activity,
    Clock,
    Layers,
    Plus,
    X,
    Type,
    FileText,
    ArrowRight,
    Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast, Toaster } from 'sonner';
import { showConfirm } from '@/lib/alerts';
import useUser from '@/hooks/useUser';

interface Workflow {
    _id: string;
    name: string;
    description: string;
    moduleId: any;
    status: string;
    createdAt: string;
    nodes: any[];
    edges: any[];
}

interface Domain {
    _id: string;
    name: string;
}

interface Module {
    _id: string;
    name: string;
}



function AllWorkflowsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, btnDisabledClass, permissionDisabledClass, hasPermission } = useUser();
    const [searchTerm, setSearchTerm] = useState('');

    const fetchWorkflows = async () => {
        try {
            setIsLoading(true);
            const res = await apiService.getWorkflows();
            if (res.success) {
                setWorkflows(res.data);
            }
        } catch (err) {
            toast.error('Failed to synchronize workflow registry.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    // Handle deep linking for creation
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'create') {
            const dId = searchParams.get('domainId') || '';
            const mId = searchParams.get('moduleId') || '';
            
            router.push(`/User/create?domainId=${dId}&moduleId=${mId}`);
        }
    }, [searchParams]);

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm({
            title: 'Terminate Protocol',
            text: 'Are you sure you want to fragment this operational workflow?',
            confirmButtonText: 'Yes, Fragment'
        });
        if (!confirmed) return;
        
        try {
            await apiService.deleteWorkflow(id);
            toast.success('Protocol fragmented.');
            fetchWorkflows();
        } catch (err: any) {
            toast.error(err.message || 'Error fragmented workflow');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            const res = await apiService.duplicateWorkflow(id);
            if (res.success) {
                toast.success('Protocol duplicated.');
                fetchWorkflows();
            }
        } catch (err: any) {
            toast.error(err.message || 'Error duplicating workflow');
        }
    };

    const filteredWorkflows = workflows.filter(w => 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 pb-12"
        >
            <Toaster position="top-right" richColors />



            {/* Header Hero */}
            <section className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_12px_rgba(129,140,248,0.8)]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Central Lattice Registry</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase italic leading-none">
                           All <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">Workflows</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-xl">
                            Unified overview of all operational protocols established across your organizational matrix.
                        </p>
                    </div>
                    
                    <button
                        onClick={() => hasPermission('Workflow.CREATE') && router.push('/User/create?fresh=true')}
                        disabled={!hasPermission('Workflow.CREATE')}
                        className={`px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3 ${
                            btnDisabledClass('Workflow.CREATE') || 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/40'
                        }`}
                        title={!hasPermission('Workflow.CREATE') ? "Matrix Restricted" : ""}
                    >
                        <Plus size={18} />
                        Create New Workflow
                    </button>
                </div>
            </section>

            {/* Search */}
            <div className="relative group max-w-2xl mx-auto">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search all protocols by designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-6 py-6 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-100/50 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                />
            </div>

            {/* Workflows Registry */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${permissionDisabledClass('Workflow.VIEW')}`}>
              {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                      <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse shadow-sm"></div>
                  ))
              ) : filteredWorkflows.length > 0 ? (
                  filteredWorkflows.map((workflow) => (
                      <motion.div
                          key={workflow._id}
                          whileHover={{ y: -8 }}
                          className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-100/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden group cursor-default"
                      >
                          <div className="flex justify-between items-start mb-6">
                              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                  <Activity size={24} />
                              </div>
                              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${workflow.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {workflow.status || 'Draft'}
                              </div>
                          </div>

                          <div className="space-y-2">
                              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-tight group-hover:text-indigo-600 transition-colors">
                                  {workflow.name}
                              </h3>
                              <p className="text-sm font-medium text-slate-400 leading-relaxed line-clamp-2">
                                  {workflow.description || 'No operational narrative provided.'}
                              </p>
                          </div>

                          <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <div className="flex items-center gap-2">
                                      <Layers size={14} className="text-indigo-400" />
                                      {workflow.nodes?.length || 0} Logic Nodes
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Clock size={14} className="text-slate-300" />
                                      {new Date(workflow.createdAt).toLocaleDateString()}
                                  </div>
                              </div>

                              <div className="flex gap-3">
                                  <button 
                                      onClick={() => hasPermission('Workflow.UPDATE') && router.push(`/User/create?id=${workflow._id}`)}
                                      className={`flex-[3] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${
                                          btnDisabledClass('Workflow.UPDATE') || 'bg-slate-900 text-white hover:bg-indigo-600'
                                      }`}
                                      title={!hasPermission('Workflow.UPDATE') ? "Matrix Restricted" : "Open Architect"}
                                  >
                                      Open Architect
                                      <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                  </button>
                                  <button 
                                      onClick={() => hasPermission('Workflow.CREATE') && handleDuplicate(workflow._id)}
                                      title={!hasPermission('Workflow.CREATE') ? "Matrix Restricted" : "Clone Protocol"}
                                      className={`flex-1 py-4 rounded-2xl flex items-center justify-center transition-all ${
                                          btnDisabledClass('Workflow.CREATE') || 'bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'
                                      }`}
                                  >
                                      <Copy size={16} />
                                  </button>
                                  <button 
                                      onClick={() => hasPermission('Workflow.DELETE') && handleDelete(workflow._id)}
                                      title={!hasPermission('Workflow.DELETE') ? "Matrix Restricted" : "Terminate Protocol"}
                                      className={`flex-1 py-4 rounded-2xl flex items-center justify-center transition-all ${
                                          btnDisabledClass('Workflow.DELETE') || 'bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50'
                                      }`}
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                      </motion.div>
                  ))
              ) : (
                  <div className="col-span-full py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center shadow-inner">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Sparkles size={32} className="text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No operational protocols detectable in registry</p>
                  </div>
              )}
            </div>
        </motion.div>
    );
}

export default function AllWorkflowsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[70vh] items-center justify-center">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
        }>
            <AllWorkflowsContent />
        </Suspense>
    );
}
