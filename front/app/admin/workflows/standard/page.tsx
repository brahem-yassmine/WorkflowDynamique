'use client'

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  GitBranch,
  Calendar,
  Layers,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  ArrowRight,
  Copy,
  Briefcase,
  Play,
  X,
  LayoutGrid,
  Zap
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function StandardFlowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  
  const router = useRouter();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await apiService.request('/workflows');
      if (res.success) {
        // Filter ONLY workflows that have NO projectId
        const standalone = res.data.filter((w: Workflow) => !w.projectId);
        setWorkflows(standalone);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async (id: string | undefined) => {
    if (!id) return;
    try {
      const res = await apiService.request(`/workflows/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ title: `Standard Execution: ${new Date().toLocaleString()}` })
      });
      if (res.success) {
        alert('Workflow initialized successfully!');
        router.push(`/Workflows/instances/${res.data._id}`);
      } else {
        alert(res.message || 'Initialization failed');
      }
    } catch (error: any) {
      alert('Execution error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this standard workflow?')) return;
    try {
      const response = await apiService.request(`/workflows/${id}`, { method: 'DELETE' });
      if (response.success) {
        setWorkflows(prev => prev.filter(w => w._id !== id));
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
        alert('Workflow cloned successfully!');
      }
    } catch (error: any) {
      alert('Error duplicating: ' + error.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            placeholder="Search standard procedures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchWorkflows} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Clock size={20} />
          </button>
          <Link href="/create-workflow">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95">
              <Plus size={18} />
              New Procedure
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="overflow-y-auto pr-2 custom-scrollbar">
          {filteredWorkflows.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-300">
                <Zap size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">No Standard Flows</h3>
              <p className="text-slate-500 mt-2 max-w-xs text-sm">Flows that are not assigned to any specific project will appear here as standard procedures.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              {filteredWorkflows.map(workflow => (
                <WorkflowCard
                  key={workflow._id}
                  workflow={workflow}
                  onClick={() => router.push(`/admin/workflows/${workflow._id}`)}
                />

              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

function WorkflowCard({ workflow, onClick }: { workflow: Workflow; onClick: () => void }) {

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
      className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden border-slate-100 hover:border-indigo-200 shadow-sm`}

    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusColor(workflow.status)}`}></div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
            <Zap size={20} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{workflow.name}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{workflow.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(workflow.status)} animate-pulse`}></div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Blocks</span>
            <span className="text-xs font-black text-slate-700">{workflow.nodes.length}</span>
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

