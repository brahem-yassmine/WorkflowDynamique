"use client"

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { useSearchParams } from 'next/navigation';

interface SaveButtonProps {
  onSave: (data: { name: string; domain: string; projectId?: string }) => Promise<void>;
  isSaving: boolean;
  initialName?: string;
  initialDomain?: string;
  initialProjectId?: string;
}

// Removed hardcoded domains, using apiService.getDomains() instead

const SaveButton = ({ onSave, isSaving, initialName = '', initialDomain = 'HR', initialProjectId = '' }: SaveButtonProps) => {
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  const [name, setName] = useState(initialName);
  const [domain, setDomain] = useState(initialDomain);
  const [projectId, setProjectId] = useState(initialProjectId || urlProjectId || '');
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [availableDomains, setAvailableDomains] = useState<any[]>([]);

  // Update name if initialName changes (e.g. after loading)
  React.useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  React.useEffect(() => {
    if (initialDomain) setDomain(initialDomain);
  }, [initialDomain]);

  React.useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
  }, [initialProjectId]);

  React.useEffect(() => {
    if (showModal) {
      fetchProjects();
      fetchDomains();
    }
  }, [showModal]);

  const fetchDomains = async () => {
    try {
      const response = await apiService.getDomains();
      if (response.success) {
        // Filter out domains that look like tenant URLs (e.g., axia-workflow.com)
        const domains = response.data.filter((d: any) => !d.name.includes('.axia-workflow.com'));
        setAvailableDomains(domains);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiService.getProjects();
      if (response.success) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (onSave) {
      try {
        await onSave({ name, domain, projectId: projectId || undefined });
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
        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
      >
        <Save size={18} />
        {isSaving ? 'Saving...' : 'Save Workflow'}
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="bg-indigo-600 p-6 text-white">
                <h3 className="text-xl font-black">Workflow Identification</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Lattice Persistence</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider pl-1">Workflow Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Onboarding Procedure"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider pl-1">Associated Project (Optional)</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider pl-1">Target Sector (Domain)</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all"
                  >
                    <option value="">Select Domain</option>
                    {availableDomains.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                    {/* Only show the current domain if it's not in the list and doesn't look like a tenant URL */}
                    {domain && !availableDomains.find(d => d.name === domain) && !domain.includes('.axia-workflow.com') && (
                      <option value={domain}>{domain}</option>
                    )}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase text-xs tracking-widest"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!name.trim() || isSaving}
                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
                  >
                    {isSaving ? 'Processing...' : 'Commit Save'}
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