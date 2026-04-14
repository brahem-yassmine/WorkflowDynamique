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

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  isActive: boolean;
  isSystemRole?: boolean;
  domainPermissions?: string[];
  modulePermissions?: string[];
  templatePermissions?: string[];
}

interface Permission {
  _id: string;
  name: string;
  description: string;
  category: string;
}

const PERMISSION_ORDER = ['PROJECT', 'WORKFLOW', 'DOMAIN', 'FORM', 'CHECKLIST'];
const WIZARD_CATEGORIES = ['KANBAN', 'TASK'];
const TASK_ACTION_SCOPE_CATEGORIES = ['TASK_ACTION_SCOPE'];
const MODULE_PERMISSIONS_OPTIONS = ['edit', 'view', 'add module', 'delete', 'create', 'add template'];
const WORKFLOW_PERMISSIONS_OPTIONS = ['edit', 'view', 'delete', 'assign', 'add'];
const TEMPLATE_DETAIL_OPTIONS = ['view', 'edit', 'delete', 'assign'];

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
  const [selectedTemplatePermissions, setSelectedTemplatePermissions] = useState<string[]>([]);
  
  // Wizard State
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [wizardStep, setWizardStep] = useState(0); // Index of WIZARD_CATEGORIES

  // Task Action Scope State
  const [isTaskActionScopeActive, setIsTaskActionScopeActive] = useState(false);
  const [taskActionScopeStep, setTaskActionScopeStep] = useState(0);

  // Domain Create Wizard State
  const [isDomainCreateWizardActive, setIsDomainCreateWizardActive] = useState(false);
  const [domainCreateWizardStep, setDomainCreateWizardStep] = useState(0);
  
  // User Assignment State
  const [users, setUsers] = useState<any[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
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
        moduleId: selectedModuleId || null,
        domainPermissions: selectedDomainPermissions,
        modulePermissions: selectedModulePermissions,
        templatePermissions: selectedTemplatePermissions
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
    setSelectedTemplatePermissions((role as any).templatePermissions || []);
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
    setSelectedTemplatePermissions([]);
    setCurrentStep(0);
    setEditingRoleId(null);
  };

  const togglePermission = (permName: string) => {
    const isAdding = !selectedPermissions.includes(permName);
    
    setSelectedPermissions(prev =>
      isAdding
        ? [...prev, permName]
        : prev.filter(p => p !== permName)
    );

    // Contextual Wizard Trigger
    if (isAdding) {
      if (permName === 'WORKFLOW_CREATE' || permName === 'WORKFLOW_EDIT') {
        setWizardStep(0);
        setIsWizardActive(true);
      } else if (permName === 'TASK_ACTION') {
        setTaskActionScopeStep(0);
        setIsTaskActionScopeActive(true);
      } else if (permName === 'DOMAIN_CREATE') {
        setDomainCreateWizardStep(0);
        setIsDomainCreateWizardActive(true);
      }
    }
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
      case 'PROJECT': return <Briefcase size={20} />;
      case 'WORKFLOW': return <Layers size={20} />;
      case 'DOMAIN': return <Globe size={20} />;
      case 'MODULE': return <Package size={20} />;
      case 'FORM': return <Clipboard size={20} />;
      case 'CHECKLIST': return <ListChecks size={20} />;
      case 'TASK': return <AlertCircle size={20} />;
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeCategories.map(cat => {
                        const groupPerms = (selectedRole.permissions || []).filter(pName =>
                          availablePermissions.find(ap => ap.name === pName)?.category === cat
                        );

                        if (groupPerms.length === 0) return null;

                        const isWorkflowManager = (selectedRole.permissions || []).some(p => p === 'WORKFLOW_CREATE' || p === 'WORKFLOW_EDIT');
                        const isMainWorkflowCard = cat === 'WORKFLOW' && isWorkflowManager;

                        return (
                          <div 
                            key={cat} 
                            className={`p-6 bg-slate-50 rounded-[28px] space-y-4 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all group ${isMainWorkflowCard ? 'md:col-span-2' : ''}`}
                          >
                            <div className="flex items-center gap-3 text-indigo-600">
                              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {getCategoryIcon(cat)}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {isMainWorkflowCard ? 'Workflow & Scope Architecture' : cat}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {availablePermissions
                                .filter(p => p.category === cat)
                                .map(p => {
                                  const isSelected = (selectedRole.permissions || []).includes(p.name);
                                  
                                  // Sector Specific Sanitation (like we did in step-based wizard)
                                  if (cat === 'CHECKLIST') {
                                    const allowed = ['CHECKLIST_VIEW', 'CHECKLIST_DELETE', 'CHECKLIST_MANAGE_STATUS'];
                                    if (!allowed.includes(p.name)) return null;
                                  }
                                  
                                  return (
                                    <span 
                                      key={p._id} 
                                      className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-tight transition-all duration-300 ${
                                        isSelected 
                                          ? "bg-white text-slate-700 border-slate-100 shadow-sm ring-1 ring-slate-100/50" 
                                          : "bg-slate-50/50 text-slate-300 border-slate-100/30 grayscale opacity-25 blur-[1.5px] select-none hover:blur-none hover:opacity-100 hover:grayscale-0 cursor-help"
                                      }`}
                                      title={isSelected ? "Matrix Authorized" : "Matrix Restricted"}
                                    >
                                      {p.name.replace(cat + '_', '').replace(/_/g, ' ')}
                                    </span>
                                  );
                                })
                              }
                            </div>

                            {/* Nested Scope for Domain Creators */}
                            {cat === 'DOMAIN' && groupPerms.includes('DOMAIN_CREATE') && (
                               <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                                 <div className="flex items-center gap-2">
                                   <Package size={12} className="text-indigo-400" />
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Module Permissions Matrix</p>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                   {((selectedRole as any).domainPermissions || []).map(p => (
                                     <span key={p} className="text-[8px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-md uppercase">
                                       {p}
                                     </span>
                                   ))}
                                 </div>
                                 
                                 {((selectedRole as any).domainPermissions || []).includes('add template') && (
                                    <div className="ml-4 pl-4 border-l-2 border-indigo-50 space-y-3">
                                      <div className="flex items-center gap-2">
                                        <Briefcase size={10} className="text-emerald-400" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Template Scope</p>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {((selectedRole as any).modulePermissions || []).map(p => (
                                          <span key={p} className="text-[7px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-md uppercase">
                                            {p}
                                          </span>
                                        ))}
                                      </div>

                                      {((selectedRole as any).modulePermissions || []).includes('add') && (
                                        <div className="ml-4 pl-4 border-l-2 border-amber-100/50 space-y-3 mt-3">
                                          <div className="flex items-center gap-2">
                                            <Activity size={10} className="text-amber-500" />
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Template Detail Scope</p>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {((selectedRole as any).templatePermissions || []).map(p => (
                                              <span key={p} className="text-[7px] font-bold text-amber-600 bg-amber-50/50 px-2 py-1 rounded-md uppercase">
                                                {p}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                               </div>
                             )}

                            {/* Task Action Nested Scope Display */}
                            {cat === 'TASK' && groupPerms.includes('TASK_ACTION') && (
                              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Activity size={12} className="text-indigo-400" />
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Appliqué à Action</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(selectedRole.permissions || [])
                                    .filter(pName => availablePermissions.find(ap => ap.name === pName)?.category === 'TASK_ACTION_SCOPE')
                                    .map(p => (
                                      <span key={p} className="text-[8px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-md uppercase">
                                        {p.replace('TASK_ACTION_', '').replace(/_/g, ' ')}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Nested Scope for Workflow Managers */}
                            {isMainWorkflowCard && (
                              <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Configuration Scope</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {WIZARD_CATEGORIES.map(scopeCat => {
                                    const scopePerms = (selectedRole.permissions || []).filter(pName =>
                                      availablePermissions.find(ap => ap.name === pName)?.category === scopeCat
                                    );
                                    if (scopePerms.length === 0) return null;

                                    return (
                                      <div key={scopeCat} className="bg-white/50 p-4 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="text-slate-400">{getCategoryIcon(scopeCat)}</div>
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{scopeCat}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {scopePerms.map(p => (
                                            <span key={p} className="text-[8px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-md uppercase">
                                              {p.split('_').slice(1).join(' ')}
                                            </span>
                                          ))}
                                        </div>

                                        {/* Nested Task Action Scope Display for Wizard/Scope mode */}
                                        {scopeCat === 'TASK' && scopePerms.includes('TASK_ACTION') && (
                                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 w-full">
                                            <div className="flex items-center gap-1.5 px-1">
                                              <Activity size={10} className="text-indigo-400" />
                                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Attached to action</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1 px-1">
                                              {(selectedRole.permissions || [])
                                                .filter(pName => availablePermissions.find(ap => ap.name === pName)?.category === 'TASK_ACTION_SCOPE')
                                                .map(p => (
                                                  <span key={p} className="text-[7px] font-bold text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded uppercase border border-slate-200/50">
                                                    {p.replace('TASK_ACTION_', '').replace(/_/g, ' ')}
                                                  </span>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
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
            </div>
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
                <div className="bg-indigo-600 p-8 text-white relative">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    ) : (
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Step {currentStep + 1}: {currentCategory} Matrix</p>
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
                    animate={{ width: `${((currentStep + 1) / (activeCategories.length + 1)) * 100}%` }}
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
                ) : (
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
                        .filter(p => {
                          // 1. Global Sanitization: Checklist triggers should ONLY exist in the Checklist sector
                          if (p.name.includes('CHECKLIST_') || p.category === 'CHECKLIST') {
                            if (currentCategory !== 'CHECKLIST') return false;
                            // 2. Intra-Sector Restriction: Only allow View/Delete even in the Checklist sector
                            return p.name === 'CHECKLIST_VIEW' || p.name === 'CHECKLIST_DELETE' || p.name === 'CHECKLIST_MANAGE_STATUS';
                          }
                          
                          // Default: Show permissions belonging to the active sector
                          return p.category === currentCategory;
                        })
                        .map(permission => (
                          <div key={permission._id} className="space-y-3">
                            <label
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
                              <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-slate-700">{permission.name.replace(`${currentCategory}_`, '').replace(/_/g, ' ')}</p>
                                  {(permission.name === 'WORKFLOW_CREATE' || permission.name === 'WORKFLOW_EDIT' || permission.name === 'TASK_ACTION' || permission.name === 'DOMAIN_CREATE') && selectedPermissions.includes(permission.name) && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (permission.name === 'TASK_ACTION') {
                                          setTaskActionScopeStep(0);
                                          setIsTaskActionScopeActive(true);
                                        } else if (permission.name === 'DOMAIN_CREATE') {
                                          setDomainCreateWizardStep(prev => prev - 1);
                                          setIsDomainCreateWizardActive(true);
                                        } else {
                                          setWizardStep(0);
                                          setIsWizardActive(true);
                                        }
                                      }}
                                      className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100"
                                      title="Configure Scope"
                                    >
                                      <Layers size={12} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">{permission.description}</p>
                              </div>
                            </label>

                            {/* Applied to Action Sub-section */}
                            {permission.name === 'TASK_ACTION' && selectedPermissions.includes(permission.name) && (
                              <div className="ml-10 p-5 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-indigo-400" />
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Appliqué à Action</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectAllInCategory('TASK_ACTION_SCOPE'); }}
                                      className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 transition-all uppercase tracking-widest"
                                    >
                                      Select All
                                    </button>
                                    <span className="text-slate-300 text-[9px]">|</span>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deselectAllInCategory('TASK_ACTION_SCOPE'); }}
                                      className="text-[9px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest"
                                    >
                                      Deselect All
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {availablePermissions
                                    .filter(p => p.category === 'TASK_ACTION_SCOPE')
                                    .map(subPerm => (
                                      <label
                                        key={subPerm._id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedPermissions.includes(subPerm.name) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-white/50 border-slate-100 hover:border-slate-200'}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedPermissions.includes(subPerm.name)}
                                          onChange={() => togglePermission(subPerm.name)}
                                          className="hidden"
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${selectedPermissions.includes(subPerm.name) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                          {selectedPermissions.includes(subPerm.name) && <Check size={10} className="stroke-[3]" />}
                                        </div>
                                        <div>
                                          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                                            {subPerm.name.replace('TASK_ACTION_', '').replace(/_/g, ' ')}
                                          </p>
                                        </div>
                                      </label>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
                {currentStep > 0 ? (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-8 py-4 bg-white text-slate-400 font-black hover:text-slate-600 hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest rounded-2xl border border-slate-100 flex items-center gap-2"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Previous Sector
                  </button>
                ) : (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-white text-slate-400 font-black hover:text-slate-600 hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest rounded-2xl border border-slate-100 flex items-center gap-2"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Back to Authority Registry
                  </button>
                )}

                <div className="flex-grow"></div>

                {currentStep < activeCategories.length ? (
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

      {/* Workflow Scope Configuration Wizard (Sub-Modal) */}
      <AnimatePresence>
        {isWizardActive && (
          <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
              />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col h-[85vh] max-h-[750px]"
            >
              {/* Wizard Header */}
              <div className="bg-indigo-600 p-8 text-white relative shrink-0">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                      {getCategoryIcon(WIZARD_CATEGORIES[wizardStep])}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase">Workflow Scope Configuration</h2>
                      <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                        Step {wizardStep + 1} of {WIZARD_CATEGORIES.length}: {WIZARD_CATEGORIES[wizardStep]} Matrix
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsWizardActive(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Scope Progress Bar */}
                <div className="absolute bottom-0 left-0 h-2 bg-indigo-700 w-full">
                  <motion.div
                    className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${((wizardStep + 1) / WIZARD_CATEGORIES.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Wizard Content */}
              <div className="flex-grow overflow-y-auto p-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Available {WIZARD_CATEGORIES[wizardStep]} Permissions</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                        Define what users with this workflow role can access in this sector.
                      </p>
                    </div>
                    <div className="bg-white/80 px-4 py-2 rounded-xl text-[10px] font-black text-indigo-600 border border-indigo-50 shadow-sm">
                      {selectedPermissions.filter(p => availablePermissions.find(ap => ap.name === p)?.category === WIZARD_CATEGORIES[wizardStep]).length} Selected
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {availablePermissions
                      .filter(p => {
                        const cat = WIZARD_CATEGORIES[wizardStep];
                        if (cat === 'KANBAN') {
                          return p.category === 'KANBAN' && (p.name.endsWith('VIEW') || p.name.endsWith('CREATE'));
                        }
                        if (cat === 'TASK') {
                          return p.category === 'TASK' && (p.name.endsWith('VIEW') || p.name.endsWith('EDIT') || p.name.endsWith('ASSIGN_KANBAN') || p.name === 'TASK_ACTION');
                        }
                        return p.category === cat;
                      })
                      .map(permission => (
                        <label
                          key={permission._id}
                          className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${selectedPermissions.includes(permission.name) ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white/60 backdrop-blur-sm border-slate-100/50 hover:border-indigo-100 shadow-sm'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.name)}
                            onChange={() => togglePermission(permission.name)}
                            className="hidden"
                          />
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selectedPermissions.includes(permission.name) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                            {selectedPermissions.includes(permission.name) && <Check size={14} className="stroke-[3]" />}
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-black text-slate-700">
                                {permission.name === 'TASK_ACTION' ? 'ACTIONS' : permission.name.replace(`${WIZARD_CATEGORIES[wizardStep]}_`, '').replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">{permission.description}</p>
                          </div>
                          {permission.name === 'TASK_ACTION' && selectedPermissions.includes(permission.name) && (
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 animate-pulse">
                                <ChevronRight size={18} />
                            </div>
                          )}
                        </label>
                      ))
                    }
                  </div>
                </div>
              </div>

              {/* Wizard Footer */}
              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 shrink-0">
                {wizardStep > 0 ? (
                  <button
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-8 py-4 bg-slate-50 text-slate-400 font-black hover:text-slate-600 hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest rounded-2xl border border-slate-100 flex items-center gap-2"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Back Level
                  </button>
                ) : (
                  <button
                    onClick={() => setIsWizardActive(false)}
                    className="px-8 py-4 bg-indigo-50 text-indigo-600 font-black hover:bg-indigo-100 transition-all uppercase text-[10px] tracking-widest rounded-2xl border border-indigo-100 flex items-center gap-2"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Back to Authority Node
                  </button>
                )}
                <div className="flex-grow"></div>
                {wizardStep < WIZARD_CATEGORIES.length - 1 ? (
                  <button
                    onClick={() => setWizardStep(prev => prev + 1)}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center gap-2"
                  >
                    Next Sector
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsWizardActive(false)}
                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Save Configuration
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
       {/* Task Action Scope Configuration (Nested Popup) */}
       <AnimatePresence>
         {isTaskActionScopeActive && (
           <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 30 }}
               className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col h-[85vh] max-h-[750px]"
             >
               {/* Wizard Header */}
               <div className="bg-indigo-600 p-8 text-white relative shrink-0">
                 <div className="flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                       <Activity size={24} />
                     </div>
                     <div>
                       <h2 className="text-2xl font-black tracking-tight uppercase">Task Action Configuration</h2>
                       <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                         Customizing: Action Matrix Scope
                       </p>
                     </div>
                   </div>
                   <button onClick={() => setIsTaskActionScopeActive(false)} className="p-3 hover:bg-indigo-500 rounded-2xl transition-all">
                     <X size={24} />
                   </button>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="absolute bottom-0 left-0 h-2 bg-indigo-700 w-full font-black text-[10px] uppercase tracking-widest">
                   <div className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] w-full" />
                 </div>
               </div>
 
               {/* Wizard Content */}
               <div className="flex-grow overflow-y-auto p-10 bg-slate-50/30">
                 <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Available Action Matrix Permissions</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                         Define granular rights for the "Action" node in the task matrix.
                       </p>
                     </div>
                     <div className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-indigo-600 border border-indigo-50 shadow-sm">
                       {selectedPermissions.filter(p => availablePermissions.find(ap => ap.name === p)?.category === 'TASK_ACTION_SCOPE').length} Selected
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => selectAllInCategory('TASK_ACTION_SCOPE')}
                          className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 transition-all uppercase tracking-widest"
                        >
                          Select All
                        </button>
                        <span className="text-slate-200 text-[9px]">|</span>
                        <button
                          type="button"
                          onClick={() => deselectAllInCategory('TASK_ACTION_SCOPE')}
                          className="text-[9px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest"
                        >
                          Deselect All
                        </button>
                     </div>
                   </div>
 
                   <div className="grid grid-cols-1 gap-3">
                     {availablePermissions
                       .filter(p => p.category === 'TASK_ACTION_SCOPE')
                       .map(permission => (
                         <label
                           key={permission._id}
                           className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${selectedPermissions.includes(permission.name) ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-100/50 hover:border-indigo-100 shadow-sm'}`}
                         >
                           <input
                             type="checkbox"
                             checked={selectedPermissions.includes(permission.name)}
                             onChange={() => togglePermission(permission.name)}
                             className="hidden"
                           />
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selectedPermissions.includes(permission.name) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                             {selectedPermissions.includes(permission.name) && <Check size={14} className="stroke-[3]" />}
                           </div>
                           <div>
                             <p className="text-sm font-black text-slate-700">{permission.name.replace('TASK_ACTION_', '').replace(/_/g, ' ')}</p>
                             <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">{permission.description}</p>
                           </div>
                         </label>
                       ))
                     }
                   </div>
                 </div>
               </div>
 
               {/* Wizard Footer */}
               <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 shrink-0">
                 <div className="flex-grow"></div>
                 <button
                   onClick={() => setIsTaskActionScopeActive(false)}
                   className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={16} />
                   Confirm Action Scope
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Domain Create Configuration Wizard (Nested Popup) */}
       <AnimatePresence>
         {isDomainCreateWizardActive && (
           <div className="fixed inset-0 z-[1020] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden border border-white/20 flex flex-col"
             >
               {/* Wizard Header */}
               <div className="bg-indigo-600 p-8 text-white relative shrink-0">
                 <div className="flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                       <Package size={20} />
                     </div>
                     <div>
                       <h2 className="text-xl font-black tracking-tight uppercase">
                         {domainCreateWizardStep === 0 ? "Module Permissions" : "Template Scope"}
                       </h2>
                       <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                         {domainCreateWizardStep === 0 ? "Step 1: Module Scope Matrix" : "Step 2: Template Creation Scope"}
                       </p>
                     </div>
                   </div>
                   <button onClick={() => setIsDomainCreateWizardActive(false)} className="p-2 hover:bg-indigo-500 rounded-xl transition-all">
                     <X size={20} />
                   </button>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-700 w-full">
                   <motion.div
                     className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                     initial={{ width: 0 }}
                     animate={{ width: domainCreateWizardStep === 0 ? "50%" : "100%" }}
                   />
                 </div>
               </div>

               {/* Wizard Content */}
               <div className="p-10 bg-slate-50/30 overflow-y-auto max-h-[60vh]">
                 <div className="space-y-6">
                   <div className="flex items-center justify-between mb-2">
                     <div>
                       <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                         Available {domainCreateWizardStep === 0 ? "Module" : "Template"} Actions
                       </h4>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                         Define rights for entities created under this domain scope.
                       </p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                     {(domainCreateWizardStep === 0 ? MODULE_PERMISSIONS_OPTIONS : WORKFLOW_PERMISSIONS_OPTIONS).map(option => {
                       const isSelected = (domainCreateWizardStep === 0 ? selectedDomainPermissions : selectedModulePermissions).includes(option);
                       return (
                         <label
                           key={option}
                           className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-100/50 hover:border-indigo-100 shadow-sm'}`}
                         >
                           <input
                             type="checkbox"
                             checked={isSelected}
                             onChange={() => {
                               if (domainCreateWizardStep === 0) { setSelectedDomainPermissions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]); } else { setSelectedModulePermissions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]); }
                             }}
                             className="hidden"
                           />
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                             {isSelected && <Check size={14} className="stroke-[3]" />}
                           </div>
                           <div className="flex-grow">
                             <p className="text-sm font-black text-slate-700 uppercase">{option}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                               {domainCreateWizardStep === 0 ? `Can ${option} modules in this domain` : `Can ${option} in this scope`}
                             </p>
                           </div>
                         </label>
                       );
                     })}
                   </div>
                 </div>
               </div>

               {/* Wizard Footer */}
               <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 shrink-0">
                 {domainCreateWizardStep > 0 && (
                   <button
                     onClick={() => setDomainCreateWizardStep(prev => prev - 1)}
                     className="px-8 py-4 text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest"
                   >
                     Back Level
                   </button>
                 )}
                 <div className="flex-grow"></div>
                 {(domainCreateWizardStep === 0 && selectedDomainPermissions.includes('add template')) ? (
                   <button
                     onClick={() => setDomainCreateWizardStep(prev => prev + 1)}
                     className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center gap-2"
                   >
                     Next Level
                     <ChevronRight size={16} />
                   </button>
                 ) : (
                   <button
                     onClick={() => setIsDomainCreateWizardActive(false)}
                     className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                   >
                     <CheckCircle2 size={16} />
                     Save Scope
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
