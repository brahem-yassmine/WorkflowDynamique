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
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  isActive: boolean;
  isSystemRole?: boolean;
}

interface Permission {
  _id: string;
  name: string;
  description: string;
  category: string;
}

const PERMISSION_ORDER = ['WORKFLOW', 'PROJECT', 'USER', 'ROLE', 'DEPARTMENT', 'TASK', 'SYSTEM'];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Role Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // 0: Info, 1+: Categories

  const activeCategories = PERMISSION_ORDER.filter(cat =>
    availablePermissions.some(p => p.category === cat)
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesRes, permsRes] = await Promise.all([
        api.get('/api/tenant/roles'),
        api.get('/api/tenant/roles/permissions')
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (permsRes.data.success) {
        setAvailablePermissions(permsRes.data.data);
      }

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
      setIsCreating(true);
      setError('');

      const payload = {
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions
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

  const startEditing = (role: Role) => {
    setEditingRoleId(role._id);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions);
    setCurrentStep(0);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions([]);
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

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'WORKFLOW': return <Layers size={20} />;
      case 'PROJECT': return <Briefcase size={20} />;
      case 'USER': return <Shield size={20} />;
      case 'ROLE': return <Lock size={20} />;
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Roles List */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">System</th>
                  <th className="px-8 py-4 text-right"></th>
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
                    <td className="px-6 py-5">
                      {role.isSystemRole || role.isDefault ? (
                        <Lock size={14} className="text-slate-300" />
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Custom</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <ChevronRight size={18} className={`inline text-slate-300 transition-transform ${selectedRole?._id === role._id ? 'translate-x-1 text-indigo-600' : ''}`} />
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

        {/* Role Inspector */}
        <div className="lg:col-span-4 h-full">
          <AnimatePresence mode="wait">
            {selectedRole ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Shield size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditing(selectedRole)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => setSelectedRole(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{selectedRole.name}</h2>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Authority Node</span>
                  {selectedRole.isDefault && <span className="bg-amber-100 text-amber-600 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-tighter uppercase">Default</span>}
                </div>

                <div className="space-y-6 flex-grow">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective Spectrum</p>
                    <p className="text-sm font-medium text-slate-600">{selectedRole.description || 'No system objective defined for this node.'}</p>
                  </div>

                  <div className="space-y-6 mt-8 overflow-y-auto custom-scrollbar pr-2 flex-grow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions Matrix ({selectedRole.permissions.length})</p>

                    {activeCategories.map(cat => {
                      const groupPerms = selectedRole.permissions.filter(pName =>
                        availablePermissions.find(ap => ap.name === pName)?.category === cat
                      );

                      if (groupPerms.length === 0) return null;

                      return (
                        <div key={cat} className="space-y-3 border-l-2 border-slate-50 pl-4 py-1">
                          <div className="flex items-center gap-2 text-indigo-600">
                            <div className="p-1.5 bg-indigo-50 rounded-lg scale-75 transform-gpu">
                              {getCategoryIcon(cat)}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pl-1">
                            {groupPerms.map(p => (
                              <span key={p} className="bg-white text-slate-600 text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm uppercase tracking-tight">
                                {p.split('_').slice(1).join(' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {selectedRole.permissions.length === 0 && (
                      <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-100">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Authorized Nodes</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-3 mt-8">
                  <button
                    onClick={() => startEditing(selectedRole)}
                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all active:scale-95"
                  >
                    Manage Permissions
                  </button>
                  {!(selectedRole.isSystemRole || selectedRole.isDefault) && (
                    <button className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95">
                      <Trash2 size={16} />
                      Purge Role
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-slate-300">
                  <Shield size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-400 tracking-tight">Node Inspector Inactive</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Select an authority node from the matrix.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Role Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
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
                          {currentCategory && getCategoryIcon(currentCategory)}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">{currentCategory} Permissions</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select relevant rights for this sector</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {selectedPermissions.filter(p => availablePermissions.find(ap => ap.name === p)?.category === currentCategory).length} Selected
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

                {currentStep < activeCategories.length ? (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={currentStep === 0 && !newRoleName}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
                  >
                    Continue to {currentStep === 0 ? activeCategories[0] : activeCategories[currentStep]}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleCreateOrUpdateRole}
                    disabled={isCreating || !newRoleName}
                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating ? 'Injecting Node...' : (editingRoleId ? 'Commit Updates' : 'Commit Node to Matrix')}
                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Shield size={16} />
                    </motion.div>
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

