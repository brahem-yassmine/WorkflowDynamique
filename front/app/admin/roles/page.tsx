'use client';

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Shield,
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Info,
  X,
  Lock,
  Layers,
  Briefcase,
  AlertCircle,
  Clipboard,
  ListChecks,
  Trello,
  Globe,
  Package
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  isActive: boolean;
  isSystemRole?: boolean;
  domainId?: string;
  moduleId?: string;
  domainPermissions?: string[];
  modulePermissions?: string[];
}

interface Permission {
  _id: string;
  name: string;
  description: string;
  category: string;
}

const PERMISSION_ORDER = ['KANBAN', 'FORM', 'CHECKLIST', 'DEPARTMENT', 'TASK', 'SYSTEM'];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // New Role Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0: Info, 1+: Categories

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedDomainPermissions, setSelectedDomainPermissions] = useState<string[]>([]);
  const [selectedModulePermissions, setSelectedModulePermissions] = useState<string[]>([]);

  const activeCategories = PERMISSION_ORDER.filter(cat =>
    availablePermissions.some(p => p.category === cat)
  );

  useEffect(() => {
    // 🛠️ SESSION CHECK
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (!token) {
        console.warn('⚠️ [AuthShield] No authority token found. Diverting to signin...');
        router.push('/signin?error=unauthorized');
        return;
      }
    }
    loadInitialData();
  }, [router]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesRes, permsRes, domainsRes, modulesRes] = await Promise.all([
        api.get('/api/tenant/roles'),
        api.get('/api/tenant/roles/permissions'),
        api.get('/api/tenant/domains'),
        api.get('/api/modules')
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (permsRes.data.success) setAvailablePermissions(permsRes.data.data);
      if (domainsRes.data.success) setDomains(domainsRes.data.data);
      if (modulesRes.data.success) setModules(modulesRes.data.data);

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
    try {
      if (!newRoleName.trim()) {
        setError('Role name is required');
        return;
      }

      // Pre-check for duplicate names locally
      const isDuplicate = roles.some(role => 
        role.name.toLowerCase() === newRoleName.trim().toLowerCase() && 
        role._id !== editingRoleId
      );

      if (isDuplicate) {
        setError(`The name "${newRoleName.trim()}" is already used by another role in your matrix.`);
        return;
      }

      setIsCreating(true);
      setError('');

      const payload = {
        name: newRoleName.trim(),
        description: newRoleDescription,
        permissions: selectedPermissions,
        domainId: selectedDomainId || null,
        moduleId: selectedModuleId || null
      };

      const response = editingRoleId
        ? await api.put(`/api/tenant/roles/${editingRoleId}`, payload)
        : await api.post('/api/tenant/roles', payload);

      if (response.status === 200 || response.status === 201) {
        if (response.data?.success) {
          setIsModalOpen(false);
          resetForm();
          loadRoles();
        } else {
          setError(response.data?.message || 'The matrix rejected your node configuration.');
        }
      }
    } catch (err: any) {
      console.error('❌ Role management critical injection failure:', err);
      const msg = err.response?.data?.message || err.message || 'Connection lost during matrix injection.';
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const response = await api.delete(`/api/tenant/roles/${roleToDelete}`);
      if (response.data.success) {
        setShowDeleteConfirm(false);
        setRoleToDelete(null);
        setSelectedRole(null);
        loadRoles();
      }
    } catch (err: any) {
      console.error('❌ Error purging role:', err);
      setError(err.response?.data?.message || 'Failed to purge the authority node.');
      setShowDeleteConfirm(false);
    }
  };

  const startEditing = (role: Role) => {
    setEditingRoleId(role._id);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setSelectedDomainId((role as any).domainId || '');
    setSelectedModuleId((role as any).moduleId || '');
    setSelectedDomainPermissions((role as any).domainPermissions || []);
    setSelectedModulePermissions((role as any).modulePermissions || []);
    setCurrentStep(0);
    setError('');
    setIsModalOpen(true);
    setSelectedRole(null);
  };

  const resetForm = () => {
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions([]);
    setSelectedDomainId('');
    setSelectedModuleId('');
    setSelectedDomainPermissions([]);
    setSelectedModulePermissions([]);
    setCurrentStep(0);
    setEditingRoleId(null);
  };

  const togglePermission = (permName: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permName)
        ? prev.filter(p => p !== permName)
        : [...prev, permName]
    );
  };

  const selectAllInCategory = (category: string) => {
    const permsInCat = availablePermissions.filter(p => p.category === category).map(p => p.name);
    setSelectedPermissions(prev => {
      const newPerms = new Set([...prev, ...permsInCat]);
      return Array.from(newPerms);
    });
  };

  const deselectAllInCategory = (category: string) => {
    const permsInCat = availablePermissions.filter(p => p.category === category).map(p => p.name);
    setSelectedPermissions(prev => prev.filter(p => !permsInCat.includes(p)));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'WORKFLOW': return <Layers size={20} />;
      case 'PROJECT': return <Briefcase size={20} />;
      case 'KANBAN': return <Trello size={20} />;
      case 'FORM': return <Clipboard size={20} />;
      case 'CHECKLIST': return <ListChecks size={20} />;
      case 'SYSTEM': return <Info size={20} />;
      default: return <CheckCircle2 size={20} />;
    }
  };

  const currentCategory = currentStep > 0 ? activeCategories[currentStep - 1] : null;

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center p-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Authority Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Organization Authority & Roles</h1>
          <p className="text-slate-500 text-sm font-medium">Define and manage custom security perimeters for your current organization. These roles are isolated and specific to this tenant.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={18} />
          Create New Role
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search roles by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-xs font-black uppercase tracking-widest">
          {filteredRoles.length} Roles Identified
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <Info size={18} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Roles List - Now full width */}
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRoles.map((role) => (
                  <tr
                    key={role._id}
                    onClick={() => setSelectedRole(role)}
                    className={`hover:bg-indigo-50/20 transition-all cursor-pointer group ${selectedRole?._id === role._id ? 'bg-indigo-50/40' : ''}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${selectedRole?._id === role._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                          <Shield size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{role.name}</p>
                          <p className="text-xs font-medium text-slate-400 line-clamp-1 max-w-[200px]">{role.description || 'No description provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${role.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {role.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {role.isSystemRole || role.isDefault ? (
                        <div className="flex items-center justify-center gap-2 text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                          <Lock size={12} />
                          <span>System</span>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRole(role);
                          }}
                          className="px-4 py-2 bg-indigo-50/50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-100 transition-all active:scale-95 border border-indigo-100/50 shrink-0"
                        >
                          Configure Custom
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <p className="text-slate-400 font-bold">No matching authority nodes found in the matrix.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        {/* Role Inspector Modal */}
        <AnimatePresence>
          {selectedRole && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRole(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
              >
                {/* Header with Close Button */}
                <div className="absolute top-6 right-6 z-20">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="p-3 bg-white/80 backdrop-blur-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all shadow-sm border border-slate-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-10 flex-grow overflow-y-auto custom-scrollbar">
                  <div className="mb-10">
                    <div className="bg-indigo-600 w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                      <Shield size={40} />
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedRole.name}</h2>
                      {selectedRole.isDefault && <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-lg tracking-widest uppercase">Default</span>}
                    </div>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Authority Configuration Node</p>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed mt-4">
                      {selectedRole.description || 'This authority node defines a specific perimeter of rights and responsibilities within the organizational lattice.'}
                    </p>
                  </div>

                  <div className="space-y-6 mb-10">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Organization Assignment</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Authority Context</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Domain</label>
                        <div className="w-full h-14 bg-slate-50 rounded-2xl px-6 flex items-center font-black text-slate-700 text-sm">
                          {domains.find(d => d._id === selectedRole.domainId)?.name || <span className="text-slate-300 italic font-medium">Global / Unassigned</span>}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Specific Module</label>
                        <div className="w-full h-14 bg-slate-50 rounded-2xl px-6 flex items-center font-black text-slate-700 text-sm">
                          {modules.find(m => m._id === selectedRole.moduleId)?.name || <span className="text-slate-300 italic font-medium">Global / Full Module Access</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Active Permissions Matrix ({(selectedRole.permissions || []).length})
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeCategories.map(cat => {
                        const groupPerms = (selectedRole.permissions || []).filter(pName =>
                          availablePermissions.find(ap => ap.name === pName)?.category === cat
                        );

                        if (groupPerms.length === 0) return null;

                        return (
                          <div key={cat} className="p-6 bg-slate-50 rounded-[28px] space-y-4 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
                            <div className="flex items-center gap-3 text-indigo-600">
                              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {getCategoryIcon(cat)}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {groupPerms.map(p => (
                                <span key={p} className="bg-white text-slate-700 text-[9px] font-black px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm uppercase tracking-tight">
                                  {p.split('_').slice(1).join(' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(selectedRole.permissions || []).length === 0 && (
                      <div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Zero-Privilege Profile</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button
                    onClick={() => startEditing(selectedRole)}
                    className="flex-[2] py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200"
                  >
                    <Edit3 size={18} />
                    Modify Permissions
                  </button>
                  {!(selectedRole.isSystemRole || selectedRole.isDefault) && (
                    <button 
                      onClick={() => {
                        setRoleToDelete(selectedRole._id);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                    >
                      <Trash2 size={18} />
                      Purge
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Create Role Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] relative z-10 overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="bg-indigo-600 p-8 text-white relative">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{editingRoleId ? 'Modify Existing Authority' : 'Construct New Authority Node'}</h2>
                    {currentStep === 0 ? (
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Step 1: Identity Profile</p>
                    ) : currentStep <= activeCategories.length ? (
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Step {currentStep + 1}: {currentCategory} Matrix</p>
                    ) : (
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Step {activeCategories.length + 2}: Organization Assignment</p>
                    )}
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-indigo-500 rounded-xl transition-all">
                    <X size={24} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 w-full">
                  <motion.div
                    className="h-full bg-white shadow-[0_0_10px_white]"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / (activeCategories.length + 2)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-10">
                {currentStep === 0 ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Authority Node Name</label>
                        <input
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="e.g., Regional Supervisor"
                          className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-base transition-all"
                        />
                      </div>
                      <div className="space-y-1.5 pt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <textarea
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          placeholder="Describe the scope and responsibilities of this role..."
                          className="w-full h-32 bg-slate-50 rounded-2xl p-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : currentStep <= activeCategories.length ? (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-6 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          {currentCategory && getCategoryIcon(currentCategory as string)}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">{currentCategory} Permissions</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select relevant rights for this sector</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentCategory && (
                          selectedPermissions.filter(p => availablePermissions.find(ap => ap.name === p)?.category === currentCategory).length === availablePermissions.filter(p => p.category === currentCategory).length ? (
                            <button
                              type="button"
                              onClick={() => (currentCategory && deselectAllInCategory(currentCategory as string))}
                              className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                            >
                              Deselect All
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => (currentCategory && selectAllInCategory(currentCategory as string))}
                              className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-100"
                            >
                              Select All
                            </button>
                          )
                        )}
                        <div className="bg-slate-50 px-4 py-1.5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 border border-slate-100">
                          {selectedPermissions.filter(p => availablePermissions.find(ap => ap.name === p)?.category === currentCategory).length} Selected
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {availablePermissions
                        .filter(p => p.category === currentCategory)
                        .map(permission => (
                          <label
                            key={permission._id}
                            className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${selectedPermissions.includes(permission.name) ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-50 hover:border-slate-100 hover:bg-slate-50/30'}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.name)}
                              onChange={() => togglePermission(permission.name)}
                              className="hidden"
                            />
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selectedPermissions.includes(permission.name) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                              {selectedPermissions.includes(permission.name) && <CheckCircle2 size={14} className="stroke-[4]" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700">{permission.name.replace(`${currentCategory}_`, '')}</p>
                              <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">{permission.description}</p>
                            </div>
                          </label>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <Layers size={20} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">Organization Assignment</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign this authority node to a specific Domain & Module</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Domain</label>
                          <select
                            value={selectedDomainId}
                            onChange={(e) => {
                              setSelectedDomainId(e.target.value);
                              setSelectedModuleId(''); // Reset module when domain changes
                            }}
                            className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Select an Authority Domain...</option>
                            {domains.map(d => (
                              <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Specific Module</label>
                          <select
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            disabled={!selectedDomainId}
                            className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm transition-all appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">Select a Functional Module...</option>
                            {modules
                              .filter(m => m.domainId === selectedDomainId || m.domainId?._id === selectedDomainId)
                              .map(m => (
                                <option key={m._id} value={m._id}>{m.name}</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>


                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-8 py-4 text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest flex items-center gap-2"
                  >
                    Previous Sector
                  </button>
                )}

                <div className="flex-grow"></div>

                {currentStep <= activeCategories.length ? (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={currentStep === 0 && !newRoleName}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
                  >
                    Continue to {currentStep < activeCategories.length ? activeCategories[currentStep] : 'Final Step'}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                    {error && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-2xl flex flex-col gap-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
                        <div className="flex items-center gap-3">
                          <AlertCircle size={20} className="shrink-0" />
                          <p className="text-[10px] font-black uppercase tracking-widest leading-tight flex-grow">{error}</p>
                        </div>
                        {error.toLowerCase().includes('already used') && (
                          <button 
                            onClick={() => { setCurrentStep(0); setError(''); }}
                            className="w-full py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <Edit3 size={14} />
                            Modify Authority Identity
                          </button>
                        )}
                      </div>
                    )}
                    {!(error && error.toLowerCase().includes('already used')) && (
                      <button
                        onClick={handleCreateOrUpdateRole}
                        disabled={isCreating || !newRoleName}
                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreating ? 'Injecting Node...' : (editingRoleId ? 'Commit Updates' : 'Commit Node to Matrix')}
                        <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                          <Shield size={16} />
                        </motion.div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purge Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="bg-rose-600 p-8 text-white relative">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">Security Purge</h2>
                    <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1">Irreversible System Action</p>
                  </div>
                  <button onClick={() => setShowDeleteConfirm(false)} className="p-2 hover:bg-rose-500 rounded-xl transition-all text-white">
                    <X size={24} />
                  </button>
                </div>
                {/* Visual accent bar */}
                <div className="absolute bottom-0 left-0 h-1.5 bg-rose-500 w-full">
                  <motion.div
                    className="h-full bg-white shadow-[0_0_10px_white]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5 }}
                  />
                </div>
              </div>

              <div className="p-10 space-y-6">
                <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 shadow-inner mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                
                <div className="space-y-3 text-center">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Purge Authority Node?</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    You are about to permanently delete this authority node from the matrix. This action will revoke all associated permissions across the organization and cannot be undone.
                  </p>
                </div>
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-white text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl"
                >
                  Abort Action
                </button>
                <button
                  onClick={handleDeleteRole}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
