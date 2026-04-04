'use client';

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Shield,
  Plus,
  Search,
  Edit3,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Info,
  X,
  Lock,
  Layers,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showConfirm } from '@/lib/alerts';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: {
    module: string;
    domain: string;
    actions: string[];
  }[];
  isDefault: boolean;
  isActive: boolean;
  isSystemRole?: boolean;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableDomains, setAvailableDomains] = useState<any[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // New Role Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<any[]>([]);
  
  // Selection State for the modal
  const [currentDomain, setCurrentDomain] = useState('');
  const [currentModule, setCurrentModule] = useState('');
  const [currentActions, setCurrentActions] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0: Info, 1: Selection

  const STANDARD_ACTIONS = ['create', 'read', 'update', 'delete', 'approve', 'reject', 'all'];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesRes, domainsRes, modulesRes] = await Promise.all([
        api.get('/api/tenant/roles'),
        api.get('/api/tenant/domains/active'),
        api.get('/api/modules')
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (domainsRes.data.success) setAvailableDomains(domainsRes.data.data);
      if (modulesRes.data.success) setAvailableModules(modulesRes.data.data);

    } catch (err: any) {
      console.error('❌ Initialization error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await api.get('/api/tenant/roles');
      if (response.data.success) setRoles(response.data.data);
    } catch (err: any) {
      console.error('❌ Error loading roles:', err);
    }
  };

  const handleCreateOrUpdateRole = async () => {
    if (!newRoleName || selectedPermissions.length === 0) return;
    
    try {
      setIsCreating(true);
      setError('');

      // Auto-add current selection if valid
      let finalPermissions = [...selectedPermissions];
      if (currentDomain && currentModule && currentActions.length > 0) {
        const existingIdx = finalPermissions.findIndex(p => p.domain === currentDomain && p.module === currentModule);
        if (existingIdx >= 0) {
          finalPermissions[existingIdx].actions = Array.from(new Set([...finalPermissions[existingIdx].actions, ...currentActions]));
        } else {
          finalPermissions.push({
            domain: currentDomain,
            module: currentModule,
            actions: currentActions
          });
        }
      }

      if (finalPermissions.length === 0) {
        setError('At least one permission link is required');
        setIsCreating(false);
        return;
      }

      const payload = {
        name: newRoleName,
        description: newRoleDescription,
        permissions: finalPermissions
      };

      const response = editingRoleId
        ? await api.put(`/api/tenant/roles/${editingRoleId}`, payload)
        : await api.post('/api/tenant/roles', payload);

      if (response.data.success) {
        setIsModalOpen(false);
        resetForm();
        loadRoles();
        if (editingRoleId) {
          setSelectedRole(response.data.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const confirmed = await showConfirm({
      title: 'Terminate Authority Node',
      text: 'Are you sure you want to purge this authority node from the lattice? This operation is irreversible and may impact personnel access.',
      confirmButtonText: 'Fragment Authority',
      danger: true
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await api.delete(`/api/tenant/roles/${roleId}`);
      if (response.data.success) {
        setSelectedRole(null);
        loadRoles();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (role: Role) => {
    setEditingRoleId(role._id);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setCurrentStep(0);
    setIsModalOpen(true);
    setSelectedRole(null);
  };

  const resetForm = () => {
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions([]);
    setCurrentStep(0);
    setEditingRoleId(null);
    setCurrentDomain('');
    setCurrentModule('');
    setCurrentActions([]);
  };

  const toggleAction = (action: string) => {
    setCurrentActions(prev =>
      prev.includes(action)
        ? prev.filter(p => p !== action)
        : [...prev, action]
    );
  };

  const addPermissionEntry = () => {
    if (!currentDomain || !currentModule || currentActions.length === 0) return;
    
    // Check if we already have an entry for this Domain/Module pair
    const existingIdx = selectedPermissions.findIndex(p => p.domain === currentDomain && p.module === currentModule);
    
    if (existingIdx >= 0) {
      const updated = [...selectedPermissions];
      // Merge unique actions
      updated[existingIdx].actions = Array.from(new Set([...updated[existingIdx].actions, ...currentActions]));
      setSelectedPermissions(updated);
    } else {
      setSelectedPermissions([...selectedPermissions, {
        domain: currentDomain,
        module: currentModule,
        actions: currentActions
      }]);
    }
    
    // Reset selection part
    setCurrentActions([]);
  };

  const removePermissionEntry = (idx: number) => {
    setSelectedPermissions(prev => prev.filter((_, i) => i !== idx));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center p-24 text-center text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Authority Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Organization Authority & Roles</h1>
          <p className="text-slate-500 text-sm font-medium">Define and manage custom security perimeters for your organization.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="group relative flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] overflow-hidden whitespace-nowrap"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
          <span className="uppercase text-[11px] tracking-widest relative z-10 font-bold">New Role</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="text-slate-400 text-xs font-black uppercase tracking-widest">
          {filteredRoles.length} Roles Identified
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 shadow-sm text-sm font-bold">
          <Info size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRoles.map((role) => (
                <tr
                  key={role._id}
                  onClick={() => setSelectedRole(role)}
                  className={`hover:bg-indigo-50/20 transition-all cursor-pointer group ${selectedRole?._id === role._id ? 'bg-indigo-50/40' : ''}`}
                >
                  <td className="px-8 py-5 text-slate-800">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${selectedRole?._id === role._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{role.name}</p>
                        <p className="text-xs font-medium text-slate-400 line-clamp-1 max-w-[200px]">{role.description || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${role.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {role.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {role.isSystemRole || role.isDefault ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-slate-300">
                          <Lock size={12} />
                        </div>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">System</span>
                      </div>
                    ) : (
                      <button className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 hover:shadow-md transition-all">
                        Custom
                      </button>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(role);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(79,70,229,0.2)] hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 ml-auto"
                    >
                      <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                        <Edit3 size={11} className="text-white" />
                      </div>
                      Modify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Inspector Modal */}
      <AnimatePresence>
        {selectedRole && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRole(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
              <div className="absolute top-6 right-6 z-20">
                <button onClick={() => setSelectedRole(null)} className="p-3 bg-white/80 backdrop-blur-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all shadow-sm border border-slate-100"><X size={20} /></button>
              </div>
              <div className="p-10 overflow-y-auto">
                <div className="mb-10"><div className="bg-indigo-600 w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0"><Shield size={40} /></div></div>
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2"><h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedRole.name}</h2></div>
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Authority Configuration Node</p>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed mt-4">{selectedRole.description || 'No description provided.'}</p>
                </div>
                <div className="space-y-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 pb-2">Active Permissions Matrix ({selectedRole.permissions?.length || 0})</p>
                  <div className="grid grid-cols-1 gap-6">
                    {selectedRole.permissions?.length > 0 ? selectedRole.permissions.map((p, idx) => (
                      <div key={idx} className="p-6 bg-slate-50 rounded-[28px] space-y-4 border border-slate-100/50">
                        <div className="flex items-center gap-3 text-indigo-600">
                          <div className="p-2 bg-white rounded-xl shadow-sm"><Layers size={18} /></div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest">{p.domain}</span>
                            <span className="text-[12px] font-black text-slate-700 tracking-tight">{p.module}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">{p.actions.map(action => (<span key={action} className="bg-white text-slate-700 text-[9px] font-black px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm uppercase tracking-tight">{action}</span>))}</div>
                      </div>
                    )) : (<div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200"><p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Zero-Privilege Profile</p></div>)}
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 text-slate-100 text-center">
                <button onClick={() => startEditing(selectedRole)} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"><Edit3 size={18} /> Modify Permissions</button>
                {!(selectedRole.isSystemRole || selectedRole.isDefault) && (
                  <button 
                    onClick={() => handleDeleteRole(selectedRole._id)}
                    className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm"
                  >
                    <Trash2 size={18} /> Purge
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] relative z-10 overflow-hidden border border-slate-100 flex flex-col">
              <div className="bg-indigo-600 p-8 text-white relative">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{editingRoleId ? 'Modify Authority' : 'New Authority Node'}</h2>
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Step {currentStep + 1}: {currentStep === 0 ? 'Identity Profile' : 'Authority Mapping'}</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-indigo-500 rounded-xl transition-all"><X size={24} /></button>
                </div>
                <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 w-full"><motion.div className="h-full bg-white shadow-[0_0_10px_white]" initial={{ width: 0 }} animate={{ width: `${((currentStep + 1) / 2) * 100}%` }} /></div>
              </div>

              <div className="flex-grow overflow-y-auto p-10 text-slate-700">
                {currentStep === 0 ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Authority Node Name</label>
                        <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g., Regional Supervisor" className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-base transition-all" />
                      </div>
                      <div className="space-y-1.5 pt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <textarea value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} placeholder="Describe the scope..." className="w-full h-32 bg-slate-50 rounded-2xl p-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm resize-none" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 space-y-6 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Domain</label>
                          <select value={currentDomain} onChange={(e) => { setCurrentDomain(e.target.value); setCurrentModule(''); }} className="w-full h-14 bg-white rounded-2xl px-4 font-bold text-slate-700 outline-none ring-1 ring-slate-100">
                            <option value="">-- Choose Domain --</option>
                            {availableDomains.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Module</label>
                          <select value={currentModule} disabled={!currentDomain} onChange={(e) => setCurrentModule(e.target.value)} className="w-full h-14 bg-white rounded-2xl px-4 font-bold text-slate-700 outline-none ring-1 ring-slate-100 disabled:opacity-50">
                            <option value="">-- Choose Module --</option>
                            {availableModules.filter(m => { const d = availableDomains.find(dom => dom.name === currentDomain); return m.domainId?._id === d?._id || m.domainId === d?._id; }).map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Available Actions</label>
                        <div className="flex flex-wrap gap-2 text-slate-100 text-center">
                          {STANDARD_ACTIONS.map(action => (
                            <button key={action} onClick={() => toggleAction(action)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentActions.includes(action) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100'}`}>
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Removed manual link button as it is now merged into Save */}
                    </div>

                    {/* Removed Link Configuration List at user request */}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-4">
                {currentStep > 0 && (<button onClick={() => setCurrentStep(prev => prev - 1)} className="px-8 py-4 text-slate-400 font-black hover:text-slate-600 uppercase text-[10px] tracking-widest">Back</button>)}
                <div className="flex-grow"></div>
                {currentStep < 1 ? (
                  <button onClick={() => setCurrentStep(prev => prev + 1)} disabled={!newRoleName} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50">Continue</button>
                ) : (
                  <button 
                    onClick={handleCreateOrUpdateRole} 
                    disabled={isCreating || (selectedPermissions.length === 0 && (!currentDomain || !currentModule || currentActions.length === 0))} 
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating ? 'Committing...' : 'Save Authority Node'}
                    <Shield size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
