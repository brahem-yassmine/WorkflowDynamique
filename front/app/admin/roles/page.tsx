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
  Lock
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

const ROLE_SUGGESTIONS = [
  {
    name: 'Administrator',
    description: 'Full system access with authority to manage users and global configurations.',
    permissions: ['WORKFLOW_CREATE', 'WORKFLOW_VIEW', 'WORKFLOW_EDIT', 'WORKFLOW_DELETE', 'WORKFLOW_PUBLISH', 'WORKFLOW_ARCHIVE', 'WORKFLOW_DUPLICATE', 'WORKFLOW_CONFIGURE_ACL', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE', 'USER_VIEW', 'ROLE_CREATE', 'ROLE_EDIT', 'ROLE_DELETE', 'ROLE_VIEW']
  },
  {
    name: 'Lattice Manager',
    description: 'Oversees workflows and team coordination without system-level settings access.',
    permissions: ['WORKFLOW_CREATE', 'WORKFLOW_VIEW', 'WORKFLOW_EDIT', 'WORKFLOW_PUBLISH', 'WORKFLOW_ARCHIVE', 'WORKFLOW_DUPLICATE', 'USER_VIEW']
  },
  {
    name: 'Workflow Editor',
    description: 'Authorized to design and modify workflow structures and logic.',
    permissions: ['WORKFLOW_VIEW', 'WORKFLOW_EDIT', 'WORKFLOW_DUPLICATE']
  },
  {
    name: 'System Analyst',
    description: 'Read-only access to monitor workflow execution and system metrics.',
    permissions: ['WORKFLOW_VIEW']
  }
];

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

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesRes, permsRes] = await Promise.all([
        api.get('/api/tenant/roles'),
        api.get('/api/tenant/roles/permissions')
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (permsRes.data.success) setAvailablePermissions(permsRes.data.data);

    } catch (err: any) {
      console.error('❌ Erreur initialisation:', err);
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
      console.error('❌ Erreur chargement rôles:', err);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const response = await api.post('/api/tenant/roles', {
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions
      });

      if (response.data.success) {
        setIsModalOpen(false);
        setNewRoleName('');
        setNewRoleDescription('');
        setSelectedPermissions([]);
        loadRoles();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const applySuggestion = (suggestion: typeof ROLE_SUGGESTIONS[0]) => {
    // We apply it but the user can still edit
    setNewRoleName(suggestion.name);
    setNewRoleDescription(suggestion.description);
    setSelectedPermissions(suggestion.permissions);
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
          onClick={() => setIsModalOpen(true)}
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
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
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

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions Matrix ({selectedRole.permissions.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRole.permissions.length > 0 ? (
                        selectedRole.permissions.map(p => (
                          <span key={p} className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-100 text-center">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No permissions assigned.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-3 mt-8">
                  <button className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all active:scale-95">
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] relative z-10 overflow-hidden border border-slate-100 flex flex-col"
            >
              <div className="bg-indigo-600 p-8 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Construct New Authority Node</h2>
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Manual Access Configuration</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-indigo-500 rounded-xl transition-all">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Suggestions & Basic Info */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      Authority Templates
                      <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] rounded text-slate-400">Optional</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {ROLE_SUGGESTIONS.map(suggestion => (
                        <button
                          key={suggestion.name}
                          onClick={() => applySuggestion(suggestion)}
                          className="text-left p-3 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                        >
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-slate-700 group-hover:text-indigo-600">{suggestion.name}</p>
                            <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Custom Node Name</label>
                      <input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Type authority name here..."
                        className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Objective/Description</label>
                      <textarea
                        value={newRoleDescription}
                        onChange={(e) => setNewRoleDescription(e.target.value)}
                        placeholder="Define the scope of this authority node..."
                        className="w-full h-24 bg-slate-50 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions Matrix Allocation</p>
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Group by category */}
                    {Array.from(new Set(availablePermissions.map(p => p.category))).map(category => (
                      <div key={category} className="space-y-2 mb-4">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50 pb-1">{category}</p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {availablePermissions.filter(p => p.category === category).map(permission => (
                            <label
                              key={permission._id}
                              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${selectedPermissions.includes(permission.name) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/50 border-transparent hover:bg-slate-50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.name)}
                                onChange={() => togglePermission(permission.name)}
                                className="hidden"
                              />
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${selectedPermissions.includes(permission.name) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                {selectedPermissions.includes(permission.name) && <CheckCircle2 size={12} className="stroke-[4]" />}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-slate-700">{permission.name.replace(`${category}_`, '')}</p>
                                <p className="text-[9px] text-slate-400 leading-tight">{permission.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-50 flex gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest"
                >
                  Discard Structure
                </button>
                <button
                  onClick={handleCreateRole}
                  disabled={isCreating || !newRoleName}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Injecting Authority...' : 'Commit Node to Matrix'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

