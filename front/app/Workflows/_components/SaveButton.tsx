"use client"

import React, { useState, useEffect } from 'react';
import { Save, Layers, LayoutGrid, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface SaveButtonProps {
  onSave: (data: { 
    name: string; 
    domainId: string; 
    projectId?: string; 
    moduleId?: string; 
    isTemplate: boolean;
    status: 'draft' | 'active';
  }) => Promise<void>;
  isSaving: boolean;
  initialName?: string;
  initialDomainId?: string;
  initialProjectId?: string;
  initialModuleId?: string;
  initialIsTemplate?: boolean;
}

const SaveButton = ({ 
  onSave, 
  isSaving, 
  initialName = '', 
  initialDomainId = '', 
  initialProjectId = '',
  initialModuleId = '',
  initialIsTemplate = false
}: SaveButtonProps) => {
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('projectId');
  const urlModuleId = searchParams.get('moduleId');
  const urlDomainId = searchParams.get('domainId');
  const urlIsTemplate = searchParams.get('isTemplate') === 'true';

  const [name, setName] = useState(initialName);
  const [domainId, setDomainId] = useState(initialDomainId || urlDomainId || '');
  const [projectId, setProjectId] = useState(initialProjectId || urlProjectId || '');
  const [moduleId, setModuleId] = useState(initialModuleId || urlModuleId || '');
  const [isTemplate, setIsTemplate] = useState(initialIsTemplate);
  const [status, setStatus] = useState<'draft' | 'active'>('active');
  
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  // Sync with initial props
  useEffect(() => { if (initialName) setName(initialName); }, [initialName]);
  useEffect(() => { if (initialDomainId) setDomainId(initialDomainId); }, [initialDomainId]);
  useEffect(() => { if (initialProjectId) setProjectId(initialProjectId); }, [initialProjectId]);
  useEffect(() => { if (initialModuleId) setModuleId(initialModuleId); }, [initialModuleId]);
  useEffect(() => { setIsTemplate(initialIsTemplate); }, [initialIsTemplate]);

  useEffect(() => {
    if (showModal) {
      fetchInitialData();
    }
  }, [showModal]);

  // Fetch modules when domain changes
  useEffect(() => {
    if (domainId && domainId !== 'standard') {
      fetchModules(domainId);
    } else {
      setModules([]);
    }
  }, [domainId]);

  const fetchInitialData = async () => {
    try {
      const [domRes, projRes] = await Promise.all([
        apiService.getDomains(),
        apiService.getProjects()
      ]);
      if (domRes.success) setDomains(domRes.data);
      if (projRes.success) setProjects(projRes.data);
    } catch (error) {
      console.error('Error fetching save data:', error);
    }
  };

  const fetchModules = async (dId: string) => {
    try {
      const response = await apiService.getModules(dId);
      if (response.success) setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Workflow Name is required!');
      return;
    }
    if (!domainId || domainId === 'standard') {
      toast.error('Please select a target Domain!');
      return;
    }
    if (!isTemplate && !projectId) {
      toast.error('Please select a Project for this workflow!');
      return;
    }
    if (isTemplate && !moduleId) {
      toast.error('Templates must be assigned to a Functional Module!');
      return;
    }

    if (onSave) {
      try {
        await onSave({ 
          name, 
          domainId, 
          projectId: isTemplate ? undefined : (projectId || undefined), 
          moduleId: moduleId || undefined, 
          isTemplate,
          status 
        });
        setShowModal(false);
      } catch (error) {
        console.error('Error saving workflow:', error);
      }
    }
  };

  return (
    <div className="absolute top-5 right-5 z-[50]">
      <button
        onClick={() => setShowModal(true)}
        disabled={isSaving}
        className={`flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100`}
      >
        <Save size={18} />
        {isSaving ? 'Saving...' : (isTemplate ? 'Save Template' : 'Save Workflow')}
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="bg-indigo-600 p-8 text-white relative overflow-hidden transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-2xl font-black tracking-tight relative z-10">{isTemplate ? 'Create Template' : 'Create Workflow'}</h3>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1 relative z-10">
                  {isTemplate ? 'Design and save your reusable protocol' : 'Instantiate new operational process'}
                </p>
              </div>

              <div className="p-8 space-y-6">
                {/* 1. Name Only */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{isTemplate ? 'Template Name' : 'Workflow Name'}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Global Procurement"
                        className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                        autoFocus
                    />
                </div>

                {/* 2. Mode-Specific Configuration */}
                {!isTemplate ? (
                  /* WORKFLOW CONFIGURATION: Project, Domain, Status */
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Project Affiliation</label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer text-sm"
                        >
                            <option value="" disabled>-- Select Project --</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Domain</label>
                          <select
                              value={domainId}
                              onChange={(e) => setDomainId(e.target.value)}
                              className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer text-sm"
                          >
                              <option value="" disabled>-- Select Domain --</option>
                              <option value="">-- Domain --</option>
                              {domains.map(d => (
                                  <option key={d._id} value={d._id}>{d.name}</option>
                              ))}
                          </select>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                          <select
                              value={status}
                              onChange={(e) => setStatus(e.target.value as any)}
                              className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer text-sm"
                          >
                              <option value="active">Active</option>
                              <option value="planning">Draft</option>
                          </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TEMPLATE CONFIGURATION: Domain & Module */
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Business Domain</label>
                        <select
                            value={domainId}
                            onChange={(e) => setDomainId(e.target.value)}
                            className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer text-sm"
                        >
                            <option value="" disabled>-- Select Domain --</option>
                            <option value="">-- Select Domain --</option>
                            {domains.map(d => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Functional Module</label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select
                                value={moduleId}
                                disabled={!domainId || domainId === 'standard'}
                                onChange={(e) => setModuleId(e.target.value)}
                                className="w-full h-12 pl-10 pr-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer text-sm disabled:opacity-50"
                            >
                                <option value="">{domainId ? (domainId === 'standard' ? 'N/A for Standard' : 'Select Module...') : 'Select Domain First'}</option>
                                {modules.map(m => (
                                    <option key={m._id} value={m._id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-[0.2em]"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex-[2] py-4 bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2`}
                  >
                    {isSaving ? 'Processing...' : (
                        <>
                            <CheckCircle size={16} />
                            {isTemplate ? 'Save Template' : 'Save Workflow'}
                        </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaveButton;
