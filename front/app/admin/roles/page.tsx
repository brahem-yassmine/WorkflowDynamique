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
  Package,
  UserPlus,
  Activity,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  resolveDependencies, 
  isRequiredByOthers, 
  UI_GROUPS, 
  ACTION_TOOLTIPS 
} from '@/lib/permission.utils';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  isActive: boolean;
  isSystemRole?: boolean;
  domainId?: string | any;
  moduleId?: string | any;
}

interface Permission {
  _id: string;
  name: string;
  description: string;
  category: string;
}
const PERMISSION_ORDER = ['Domain', 'Module', 'Project', 'Workflow', 'Kanban', 'Template', 'Form', 'Checklist'];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [replacementRoleId, setReplacementRoleId] = useState<string>('');
  const [deleteRequiresReplacement, setDeleteRequiresReplacement] = useState(false);
  const [usersCountToReassign, setUsersCountToReassign] = useState(0);
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
  
  // User Assignment State
  const [users, setUsers] = useState<any[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignDomainId, setAssignDomainId] = useState('');
  const [assignModuleId, setAssignModuleId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

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

      const [rolesRes, permsRes, domainsRes, modulesRes, usersRes] = await Promise.all([
        api.get('/api/tenant/roles'),
        api.get('/api/tenant/roles/permissions'),
        api.get('/api/tenant/domains'),
        api.get('/api/modules'),
        api.get('/api/users')
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (permsRes.data.success) setAvailablePermissions(permsRes.data.data);
      if (domainsRes.data.success) setDomains(domainsRes.data.data);
      if (modulesRes.data.success) setModules(modulesRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);

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
      const response = await api.delete(`/api/tenant/roles/${roleToDelete}`, {
        data: { replacementRoleId: replacementRoleId || undefined }
      });
      if (response.data.success) {
        setShowDeleteConfirm(false);
        setRoleToDelete(null);
        setSelectedRole(null);
        setReplacementRoleId('');
        setDeleteRequiresReplacement(false);
        loadRoles();
      }
    } catch (err: any) {
      console.error('❌ Error purging role:', err);
      if (err.response?.data?.errorType === 'REQUIRES_REPLACEMENT') {
        setDeleteRequiresReplacement(true);
        setUsersCountToReassign(err.response.data.usersCount);
        setError('');
      } else {
        setError(err.response?.data?.message || 'Failed to purge the authority node.');
        setShowDeleteConfirm(false);
      }
    }
  };

  const startEditing = (role: Role) => {
    setEditingRoleId(role._id);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setSelectedDomainId((role as any).domainId?._id || (role as any).domainId || '');
    setSelectedModuleId((role as any).moduleId?._id || (role as any).moduleId || '');
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
    setCurrentStep(0);
    setEditingRoleId(null);
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions(prev => {
      let newSet = new Set(prev);
      
      if (newSet.has(permKey)) {
        if (isRequiredByOthers(permKey, prev)) {
          console.warn(`Cannot remove ${permKey} as it is required by another selected permission.`);
          return prev; 
        }
        newSet.delete(permKey);
      } else {
        newSet.add(permKey);
        return resolveDependencies(Array.from(newSet));
      }
      return Array.from(newSet);
    });
  };

  const selectAllInCategory = (category: string) => {
    const group = UI_GROUPS[category as keyof typeof UI_GROUPS];
    if (!group) return;
    const permsInCat = group.actions.map(action => `${category}.${action}`);
    setSelectedPermissions(prev => resolveDependencies([...prev, ...permsInCat]));
  };

  const deselectAllInCategory = (category: string) => {
    const group = UI_GROUPS[category as keyof typeof UI_GROUPS];
    if (!group) return;
    const permsInCat = group.actions.map(action => `${category}.${action}`);
    setSelectedPermissions(prev => prev.filter(p => !permsInCat.includes(p)));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PROJECT': return <Briefcase size={20} />;
      case 'WORKFLOW': return <Layers size={20} />;
      case 'DOMAIN': return <Globe size={20} />;
      case 'MODULE': return <Package size={20} />;
      case 'FORM': return <Clipboard size={20} />;
      case 'CHECKLIST': return <ListChecks size={20} />;
      case 'KANBAN': return <Trello size={20} />;
      case 'SYSTEM': return <Lock size={20} />;
      case 'TASK_ACTION_SCOPE': return <Activity size={20} />;
      default: return <Shield size={20} />;
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
      {!isModalOpen && !selectedRole && (
        <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-16">
        <div className="flex-1 pr-4 lg:pr-12">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-3">Organization Authority & Roles</h1>
          <p className="text-slate-500 text-sm font-medium max-w-3xl leading-relaxed">
            Define and manage custom security perimeters for your current organization. These roles are isolated and specific to this tenant.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="shrink-0 group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_8px_30px_rgb(99,102,241,0.4)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.6)] hover:-translate-y-1 transition-all duration-300 active:scale-95 overflow-hidden border border-indigo-400/50"
        >
          <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
          
          <div className="w-8 h-8 rounded-full bg-white/20 shadow-inner flex items-center justify-center backdrop-blur-md relative z-10 transition-transform duration-500 group-hover:rotate-180">
            <Plus size={16} className="text-white stroke-[3]" />
          </div>
          <span className="relative z-10 drop-shadow-md">Create New Role</span>
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
                    className={`hover:bg-indigo-50/50 transition-all duration-300 cursor-pointer group ${selectedRole?._id === role._id ? 'bg-indigo-50/80 shadow-sm' : ''}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-sm border ${selectedRole?._id === role._id ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-transparent shadow-indigo-200' : 'bg-white border-slate-100 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600 group-hover:shadow-md'}`}>
                          <Shield size={20} />
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
     </div>
    )}

        {/* Role Inspector Modal */}
        <AnimatePresence>
          {selectedRole && !isModalOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[40px] shadow-2xl w-full border border-slate-100 flex flex-col relative z-10 overflow-hidden"
              >
                {/* Header with Close Button */}
                <div className="absolute top-6 right-6 z-20">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all shadow-sm border border-slate-200 font-bold text-xs uppercase tracking-widest"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    Retour à la liste
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

                    {((selectedRole as any).domainId || (selectedRole as any).moduleId) && (
                      <div className="flex flex-wrap gap-4 mt-8">
                        {(selectedRole as any).domainId && (
                          <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="text-indigo-600">
                               <Globe size={16} />
                            </div>
                            <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Domain Scope</p>
                               <p className="text-xs font-black text-slate-700 tracking-tight">
                                 {domains.find(d => d._id === ((selectedRole as any).domainId?._id || (selectedRole as any).domainId))?.name || 'Assigned Domain'}
                               </p>
                            </div>
                          </div>
                        )}
                        {(selectedRole as any).moduleId && (
                          <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="text-indigo-600">
                               <Package size={16} />
                            </div>
                            <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Module Scope</p>
                               <p className="text-xs font-black text-slate-700 tracking-tight">
                                 {modules.find(m => m._id === ((selectedRole as any).moduleId?._id || (selectedRole as any).moduleId))?.name || 'Assigned Module'}
                               </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Active Permissions Matrix ({(selectedRole.permissions || []).length})
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(UI_GROUPS).map(([entity, { icon, label, actions }]) => {
                        const groupPerms = selectedRole.permissions.filter(p => p.startsWith(`${entity}.`));
                        if (groupPerms.length === 0) return null;

                        return (
                          <div 
                            key={entity} 
                            className="p-6 bg-slate-50 rounded-[28px] space-y-4 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all group"
                          >
                            <div className="flex items-center gap-3 text-indigo-600">
                              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all text-lg">
                                {icon}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {label}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {groupPerms.map(p => {
                                const action = p.split('.')[1];
                                return (
                                <div key={p} className="flex items-center gap-2 bg-indigo-50/50 px-3 py-2 rounded-xl border border-indigo-100 shadow-[0_2px_10px_-2px_rgba(99,102,241,0.05)]">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                                      <CheckCircle2 size={10} className="stroke-[3]" />
                                  </div>
                                  <span className="text-indigo-900 text-[9px] font-black uppercase tracking-widest">
                                    {action.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                );
                              })}
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
                  <button
                    onClick={() => {
                        setAssignUserId('');
                        setAssignDomainId((selectedRole as any).domainId || '');
                        setAssignModuleId((selectedRole as any).moduleId || '');
                        setIsAssignModalOpen(true);
                    }}
                    className="flex-[1.5] py-5 bg-emerald-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100"
                  >
                    <Globe size={18} />
                    Add 
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
          )}
        </AnimatePresence>

        {/* User Assignment Modal */}
        <AnimatePresence>
          {isAssignModalOpen && selectedRole && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAssignModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col"
              >
                <div className="bg-indigo-600 p-10 text-white relative">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase">Authority Scope Assignment</h2>
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">
                        Node: {selectedRole.name}
                      </p>
                    </div>
                    <button onClick={() => setIsAssignModalOpen(false)} className="p-3 hover:bg-indigo-500 rounded-2xl transition-all">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 w-full font-black text-[10px] uppercase tracking-widest">
                    <div className="h-full bg-white w-full shadow-[0_0_10px_white]" />
                  </div>
                </div>

                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[60vh]">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Scope Configuration</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bind this authority to a matrix coordinate</p>
                    </div>
                  </div>

                  <div className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Domain</label>
                        <select
                          value={assignDomainId}
                          onChange={(e) => {
                            setAssignDomainId(e.target.value);
                            setAssignModuleId('');
                          }}
                          className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Domain...</option>
                          {domains.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Specific Module</label>
                        <select
                          value={assignModuleId}
                          onChange={(e) => setAssignModuleId(e.target.value)}
                          disabled={!assignDomainId}
                          className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Select Module...</option>
                          {modules
                            .filter(m => (m.domainId?._id || m.domainId) === assignDomainId)
                            .map(m => (
                              <option key={m._id} value={m._id}>{m.name}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-4">
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-8 py-4 text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedRole) return;
                      try {
                        setIsAssigning(true);
                        await api.put(`/api/tenant/roles/${selectedRole._id}`, {
                          domainId: assignDomainId || null,
                          moduleId: assignModuleId || null
                        });
                        setIsAssignModalOpen(false);
                        loadRoles();
                        setSelectedRole(null); // Close inspector to refresh view if needed
                        // Reset forms
                        setAssignUserId('');
                        setAssignDomainId('');
                        setAssignModuleId('');
                      } catch (err: any) {
                        console.error('❌ Assignment error:', err);
                        alert(err.response?.data?.message || 'Matrix injection failed');
                      } finally {
                        setIsAssigning(false);
                      }
                    }}
                    disabled={isAssigning}
                    className="px-10 py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isAssigning ? 'Updating Matrix...' : 'Commit Node to Matrix'}
                    <Shield size={18} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Create Role Modal */}
      <AnimatePresence>
        {isModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full border border-slate-100 flex flex-col relative z-10 overflow-hidden"
            >
              <div className="bg-indigo-600 p-8 text-white relative">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{editingRoleId ? 'Modify Existing Authority' : 'Construct New Authority Node'}</h2>
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Matrix Configuration</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-xs uppercase tracking-widest"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    Retour
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
                <div className="space-y-10">
                  {/* Identity Section */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <UserPlus size={20} />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Authority Identity</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Role Name</label>
                        <input
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="e.g., Regional Manager"
                          className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                        <input
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          placeholder="Short purpose of this role..."
                          className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(UI_GROUPS).map(([entity, { icon, label, actions }]) => (
                      <div key={entity} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{label}</span>
                          </div>
                          <div className="flex gap-2">
                             <button
                               onClick={() => selectAllInCategory(entity)}
                               className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest"
                             >
                               All
                             </button>
                             <span className="text-slate-200">|</span>
                             <button
                               onClick={() => deselectAllInCategory(entity)}
                               className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                             >
                               None
                             </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {actions.map(action => {
                            const permKey = `${entity}.${action}`;
                            const isChecked = selectedPermissions.includes(permKey);
                            const isDisabled = isChecked && isRequiredByOthers(permKey, selectedPermissions);

                            return (
                              <label 
                                key={permKey} 
                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${isChecked ? 'bg-indigo-50/80 border-indigo-200 shadow-[0_2px_10px_-2px_rgba(99,102,241,0.1)]' : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200/60 hover:bg-white hover:shadow-md'}`}
                              >
                                {isChecked && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-400 to-violet-500 opacity-50" />}
                                <div className="flex items-center gap-3">
                                  <div className="relative flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => togglePermission(permKey)}
                                      disabled={isDisabled}
                                      className="hidden"
                                    />
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isChecked ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 scale-110' : 'bg-white border-2 border-slate-200 text-transparent group-hover:border-indigo-300'}`}>
                                      <CheckCircle2 size={14} className={`stroke-[3] transition-all duration-300 ${isChecked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                                    </div>
                                  </div>
                                  <div>
                                    <p className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${isDisabled ? 'text-slate-400' : isChecked ? 'text-indigo-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                      {action.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-[10px] text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -top-8 bg-slate-800 text-white px-3 py-1.5 rounded-lg pointer-events-none z-10 w-max shadow-xl">
                                      {ACTION_TOOLTIPS[action]}
                                    </p>
                                  </div>
                                </div>
                                {isDisabled && (
                                  <span className="text-[8px] font-black text-amber-500 uppercase italic">
                                    Required
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  {selectedPermissions.length} Active Rules Resolved
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOrUpdateRole}
                    disabled={isCreating || !newRoleName}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-3"
                  >
                    {isCreating ? 'Committing Matrix...' : (editingRoleId ? 'Update Authority' : 'Launch Authority')}
                    <Shield size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
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
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-inner mx-auto mb-4 ${deleteRequiresReplacement ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                  {deleteRequiresReplacement ? <Shield size={32} /> : <Trash2 size={32} />}
                </div>
                
                <div className="space-y-3 text-center">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {deleteRequiresReplacement ? 'Action Required' : 'Purge Authority Node?'}
                  </h3>
                  
                  {deleteRequiresReplacement ? (
                    <div className="space-y-6 text-left">
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium p-4 rounded-2xl">
                        This role is currently assigned to <strong className="font-black text-amber-900">{usersCountToReassign} user(s)</strong>. You must select a fallback role to reassign these users before the deletion can proceed.
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Fallback Role</label>
                        <select
                          value={replacementRoleId}
                          onChange={(e) => setReplacementRoleId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all"
                        >
                          <option value="">Select a role...</option>
                          {roles
                            .filter((r) => r.isActive && r._id !== roleToDelete)
                            .map((r) => (
                              <option key={r._id} value={r._id}>
                                {r.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                      You are about to permanently delete this authority node from the matrix. This action will revoke all associated permissions across the organization and cannot be undone.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
                <button
                  onClick={() => {
                     setShowDeleteConfirm(false);
                     setDeleteRequiresReplacement(false);
                     setReplacementRoleId('');
                  }}
                  className="flex-1 py-4 bg-white text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest border border-slate-100 rounded-2xl"
                >
                  Abort Action
                </button>
                <button
                  onClick={handleDeleteRole}
                  disabled={deleteRequiresReplacement && !replacementRoleId}
                  className={`flex-1 py-4 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${deleteRequiresReplacement ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' : 'bg-rose-600 shadow-rose-100 hover:bg-rose-700'}`}
                >
                  {deleteRequiresReplacement ? 'Reassign & Purge' : 'Confirm Purge'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove all legacy wizard AnimatePresence sections as they are no longer needed */}
     </div>
  );
}
