'use client'

import React, { useState, useEffect, Suspense } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Workflow,
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
  AlertTriangle,
  Library
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
  moduleId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
}

interface Module {
  _id: string;
  name: string;
}

function TemplatesContent() {
  const [templates, setTemplates] = useState<Workflow[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', domain: 'HR', moduleId: '', status: 'draft' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const moduleIdFilter = searchParams.get('moduleId');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [moduleIdFilter]);

  const fetchData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (moduleIdFilter) queryParams.append('moduleId', moduleIdFilter);
      queryParams.append('isTemplate', 'true');

      const [wfRes, modRes] = await Promise.all([
        apiService.request(`/workflows?${queryParams.toString()}`),
        apiService.request('/modules') // Assuming this endpoint exists or similar
      ]);

      if (wfRes.success) setTemplates(wfRes.data);
      if (modRes.success) setModules(modRes.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      const response = await apiService.request(`/workflows/${templateToDelete}`, { method: 'DELETE' });
      if (response.success) {
        toast.success('Template deleted successfully');
        setTemplates(prev => prev.filter(w => w._id !== templateToDelete));
      }
    } catch (error: any) {
      toast.error('Error during deletion: ' + error.message);
    } finally {
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!editingTemplateId) return;

    if (!editForm.name.trim()) {
      toast.error('Template Name is required!');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await apiService.updateWorkflow(editingTemplateId, {
        name: editForm.name,
        domain: editForm.domain,
        moduleId: editForm.moduleId || undefined,
        status: editForm.status
      });

      if (response.success) {
        setTemplates(prev => prev.map(w => w._id === editingTemplateId ? { ...w, ...response.data } : w));
        setShowEditModal(false);
        setEditingTemplateId(null);
        toast.success('Template updated successfully');
      }

    } catch (error: any) {
      toast.error('Error updating: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (template: Workflow) => {
    setEditForm({
      name: template.name,
      domain: template.domain,
      moduleId: template.moduleId || '',
      status: template.status || 'draft'
    });
    setEditingTemplateId(template._id);
    setShowEditModal(true);
  };

  const filteredTemplates = templates.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getModuleName = (mId?: string) => {
    if (!mId) return "No Module";
    return modules.find(m => m._id === mId)?.name || "Unknown Module";
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
      
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Template Repository</h1>
        <p className="text-slate-500 font-medium">Manage and blueprint standardized organizational processes.</p>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search templates by name, domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3">
          {moduleIdFilter && (
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 border border-indigo-100">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Library size={14} />
                Module: {getModuleName(moduleIdFilter)}
              </span>
              <button 
                onClick={() => router.push('/admin/templates')}
                className="text-indigo-400 hover:text-indigo-600 font-black"
              >
                ×
              </button>
            </div>
          )}
          <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Clock size={20} />
          </button>
          <Link href={`/create-workflow?isTemplate=true${moduleIdFilter ? `&moduleId=${moduleIdFilter}` : ''}`}>
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
              <Plus size={18} />
              Create Template
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-300">
              <Copy size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">No Templates Found</h3>
            <p className="text-slate-500 mt-2 max-w-xs text-sm">Start architecting your first organizational logic blueprint.</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <TemplateCard
              key={template._id}
              template={template}
              moduleName={getModuleName(template.moduleId)}
              onClick={() => router.push(`/admin/workflows/${template._id}`)}
              onDelete={handleDelete}
              onEdit={() => openEditModal(template)}
            />
          ))
        )}
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
                <h3 className="text-xl font-black">Template Settings</h3>
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Core Blueprint Configuration</p>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Module</label>
                  <select
                    value={editForm.moduleId}
                    onChange={(e) => setEditForm({ ...editForm, moduleId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all"
                  >
                    <option value="" disabled>-- Select Module --</option>
                    {modules.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
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
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
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
                    Update Blueprint
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
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Delete Template?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                  Are you sure you want to permanently remove this blueprint? Any workflows created from this template will remain, but the master schema will be lost.
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

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Repository...</div>}>
      <TemplatesContent />
    </Suspense>
  );
}

function TemplateCard({ template, moduleName, onClick, onDelete, onEdit }: { template: Workflow; moduleName: string; onClick: () => void; onDelete: (id: string) => void; onEdit: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 bg-white shadow-md rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
          >
            <Edit size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(template._id); }}
            className="p-2 bg-white shadow-md rounded-lg text-slate-400 hover:text-rose-600 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <Copy size={24} />
        </div>
        <div>
          <h4 className="font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase text-sm">{template.name}</h4>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{moduleName}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Complexity</span>
          <span className="text-indigo-600">{template.nodes.length} Blocks</span>
        </div>
        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full" 
            style={{ width: `${Math.min(100, (template.nodes.length / 10) * 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${template.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{template.status}</span>
        </div>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:gap-3 transition-all">
          Open Blueprint <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}
