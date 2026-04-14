'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    User,
    Users,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Edit3,
    Trash2,
    Shield,
    Briefcase,
    Mail,
    Activity,
    ChevronRight,
    X,
    CheckCircle2,
    AlertCircle,
    Lock,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showAlert, showConfirm } from '@/lib/alerts';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Types matches backend User model
interface Persona {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    domain: string;
    isActive: boolean;
    createdAt?: string;
    specificRole?: string;
    specificRoleId?: string;
    domainId?: any;
    moduleId?: any;
}

interface Role {
    _id: string;
    name: string;
}

interface Domain {
    _id: string;
    name: string;
}

export default function UserManagementPage() {
    const router = useRouter();
    const { user: currentUser } = useAuth() as { user: Persona | null };
    const [users, setUsers] = useState<Persona[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [domains, setDomains] = useState<Domain[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<Persona | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [hidePasswordInput, setHidePasswordInput] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [modules, setModules] = useState<any[]>([]);
    
    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formRole, setFormRole] = useState('user');
    const [formDomain, setFormDomain] = useState('');
    const [formSpecificRole, setFormSpecificRole] = useState('');
    const [formSpecificRoleId, setFormSpecificRoleId] = useState('');
    const [formDomainId, setFormDomainId] = useState('');
    const [formModuleId, setFormModuleId] = useState('');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersRes, rolesRes, domainsRes] = await Promise.all([
                apiService.getUsers(),
                apiService.getRoles(),
                apiService.getDomains()
            ]);

            if (usersRes.success) {
                setUsers(usersRes.data);
                // Check for deep link edit
                if (typeof window !== 'undefined') {
                    const params = new URLSearchParams(window.location.search);
                    const editUserId = params.get('editUserId');
                    if (editUserId) {
                        const userToEdit = usersRes.data.find((u: Persona) => u._id === editUserId);
                        if (userToEdit) {
                            setTimeout(() => {
                                setIsEditing(true);
                                setFirstName(userToEdit.firstName || '');
                                setLastName(userToEdit.lastName || '');
                                setEmail(userToEdit.email);
                                setPassword('');
                                setFormRole(userToEdit.role);
                                setFormDomain(userToEdit.domain);
                                setFormDomainId(userToEdit.domainId?._id || userToEdit.domainId || '');
                                setFormModuleId(userToEdit.moduleId?._id || userToEdit.moduleId || '');
                                setIsModalOpen(true);
                                // Clean up URL so it doesn't reopen on subsequent fetches
                                window.history.replaceState({}, '', window.location.pathname);
                            }, 500); // Small delay to let UI settle
                        }
                    }
                }
            }
            if (rolesRes.success) setRoles(rolesRes.data);
            if (domainsRes.success) setDomains(domainsRes.data);
            
            const modulesRes = await apiService.getModules();
            if (modulesRes.success) setModules(modulesRes.data);

            if (domainsRes.data?.length > 0 && !formDomain) {
                setFormDomain(domainsRes.data[0].name);
            }
        } catch (error: any) {
            toast.error('Failed to synchronize lattice network');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData = {
                firstName,
                lastName,
                email,
                role: formRole,
                domain: formDomain || (domains.length > 0 ? domains[0].name : 'Default'),
                specificRole: formSpecificRole,
                specificRoleId: formSpecificRoleId || null,
                domainId: formDomainId || null,
                moduleId: formModuleId || null
            };

            if (isEditing && selectedUser) {
                const updateData: any = { ...userData };
                if (password) updateData.password = password;
                await apiService.updateUser(selectedUser._id, updateData);
                toast.success('Agent profile updated');
            } else {
                if (!password) {
                    toast.error('Identity key (password) required for new nodes');
                    return;
                }
                await apiService.createUser({ ...userData, password });
                toast.success('New persona authorized in lattice');
            }

            setIsModalOpen(false);
            fetchData();
            resetForm();
        } catch (error: any) {
            const msg = error.message || 'Injection error';
            if (msg.startsWith('LIMIT:')) {
                // Vider les champs et masquer complètement l'input pour Google Chrome
                setPassword('');
                setEmail('');
                setHidePasswordInput(true);
                
                // Pause to let React physically remove the DOM element
                setTimeout(async () => {
                    const confirmed = await showConfirm({
                        title: "User Limit Reached",
                        text: msg.replace('LIMIT:', '').trim(),
                        confirmButtonText: 'Upgrade Plan'
                    });
                    if (confirmed) {
                        router.push('/admin/billing');
                    } else {
                        // Restore if they cancel
                        setHidePasswordInput(false);
                    }
                }, 100);
            } else {
                toast.error(msg);
            }
        }
    };

    const handleToggleStatus = async (user: Persona) => {
        try {
            await apiService.updateUser(user._id, { isActive: !user.isActive });
            toast.success(`Access ${!user.isActive ? 'restored' : 'suspended'}`);
            fetchData();
            if (selectedUser?._id === user._id) {
                setSelectedUser({ ...user, isActive: !user.isActive });
            }
        } catch (error: any) {
            toast.error('Status synchronization failed');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm({
            title: 'Purge Persona',
            text: 'Are you sure you want to purge this persona from the lattice?',
            confirmButtonText: 'Yes, Purge'
        });
        if (!confirmed) return;
        try {
            await apiService.deleteUser(id);
            toast.success('Persona purged');
            setSelectedUser(null);
            fetchData();
        } catch (error: any) {
            toast.error('Purge operation failed');
        }
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setFormRole('user');
        setFormDomain(domains.length > 0 ? domains[0].name : '');
        setFormSpecificRole('');
        setFormSpecificRoleId('');
        setFormDomainId('');
        setFormModuleId('');
        setIsEditing(false);
        setHidePasswordInput(false);
    };

    const handleEdit = (user: Persona) => {
        setSelectedUser(user);
        setIsEditing(true);
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email);
        setPassword('');
        setFormRole(user.role);
        setFormDomain(user.domain);
        setFormSpecificRole(user.specificRole || '');
        setFormSpecificRoleId(user.specificRoleId || '');
        setFormDomainId(user.domainId?._id || user.domainId || '');
        setFormModuleId(user.moduleId?._id || user.moduleId || '');
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Talent Network Management</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage organization nodes, assign tiers, and authorize access domains.</p>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-xl group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by identity signature, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { resetForm(); setSelectedUser(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <UserPlus size={18} />
                        Authorize Persona
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* User List Matrix - Now full width */}
                <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Lattice Entities</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredUsers.length} Nodes Detected</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Signature</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</th>
                                    <th className="px-8 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={4} className="px-8 py-6 h-16 bg-slate-50/50"></td>
                                        </tr>
                                    ))
                                ) : filteredUsers.map((user) => (
                                    <tr
                                        key={user._id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`hover:bg-indigo-50/20 transition-all cursor-pointer group ${selectedUser?._id === user._id ? 'bg-indigo-50/40' : ''}`}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${selectedUser?._id === user._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                                    {(user.firstName || user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs font-medium text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="px-2.5 py-1 bg-white border border-indigo-100 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-tight w-fit">
                                                    {user.role}
                                                </span>
                                                {user.specificRole && (
                                                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-bold rounded-lg uppercase tracking-tight w-fit">
                                                        {user.specificRole}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                <span className={`w-1 h-1 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                                {user.isActive ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(user);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="Edit User"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(user);
                                                    }}
                                                    className="px-3 py-1.5 bg-indigo-50/50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100/50"
                                                >
                                                    Custom
                                                </button>
                                                <ChevronRight size={18} className={`text-slate-300 transition-transform ${selectedUser?._id === user._id ? 'translate-x-1 text-indigo-600' : ''}`} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Persona Inspector Modal */}
                <AnimatePresence>
                    {selectedUser && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedUser(null)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
                            >
                                <div className="p-8 flex-grow overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="bg-indigo-600 w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                                            <User size={40} />
                                        </div>
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-2 mb-10">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedUser.firstName} {selectedUser.lastName}</h2>
                                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">{selectedUser.role} Agent Proxy</p>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed mt-4">
                                            This entity represents an active node in the organizational lattice, authorized for specific operations within the current domain.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="p-6 bg-slate-50 rounded-[28px] space-y-4">
                                            <InspectorInfo label="Connectivity" icon={<Mail size={16} />} value={selectedUser.email} />
                                            <InspectorInfo label="Assignment Domain" icon={<Briefcase size={16} />} value={selectedUser.domainId?.name || selectedUser.domain || 'Global'} />
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-[28px] space-y-4">
                                            <InspectorInfo label="Assignment Module" icon={<Layers size={16} />} value={selectedUser.moduleId?.name || 'Full Module Access'} />
                                            <InspectorInfo label="Node Integrity" icon={<Activity size={16} />}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm ${selectedUser.isActive ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-rose-600 border-rose-100'}`}>
                                                    {selectedUser.isActive ? 'Operational' : 'Access Locked'}
                                                </span>
                                            </InspectorInfo>
                                            <InspectorInfo label="Authorization Tier" icon={<Shield size={16} />} value={selectedUser.role} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleToggleStatus(selectedUser)}
                                            className={`flex-[2] py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${selectedUser.isActive ? 'bg-amber-100 text-amber-600 shadow-amber-100 hover:bg-amber-200' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'}`}
                                        >
                                            {selectedUser.isActive ? <Lock size={18} /> : <CheckCircle2 size={18} />}
                                            {selectedUser.isActive ? 'Suspend Authorization' : 'Restore Connection'}
                                        </button>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleEdit(selectedUser)}
                                            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                                        >
                                            <Edit3 size={16} />
                                            Refine Profile
                                        </button>
                                        <button
                                            disabled={!!currentUser && ((currentUser as any).email === selectedUser.email || (currentUser as any)._id === selectedUser._id || (currentUser as any).id === selectedUser._id)}
                                            onClick={() => handleDelete(selectedUser._id)}
                                            className={`px-6 py-4 rounded-[20px] transition-all border flex items-center justify-center ${!!currentUser && ((currentUser as any).email === selectedUser.email || (currentUser as any)._id === selectedUser._id || (currentUser as any).id === selectedUser._id) ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60' : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border-rose-100'}`}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Auth Modal */}
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">{isEditing ? 'Refine Node' : 'Authorize Entity'}</h2>
                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Manual Lattice Injection</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-indigo-500 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">First Name</label>
                                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="John" className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Last Name</label>
                                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe" className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Connectivity (Email)</label>
                                    <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="john@company.com" className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Identity Key (Password)</label>
                                    {!hidePasswordInput && (
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required={!isEditing}
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder={isEditing ? "(Leave blank to keep current)" : "Minimum 6 characters"}
                                            className="w-full h-11 bg-slate-50 rounded-xl pl-12 pr-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none text-sm"
                                        />
                                    </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Access Tier (System)</label>
                                        <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all">
                                            <option value="user">User Node</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Specialization</label>
                                        <select 
                                            value={formSpecificRoleId} 
                                            onChange={(e) => {
                                                const roleId = e.target.value;
                                                setFormSpecificRoleId(roleId);
                                                const roleName = roles.find(r => r._id === roleId)?.name || '';
                                                setFormSpecificRole(roleName);
                                            }} 
                                            className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all"
                                        >
                                            <option value="">No Specialization</option>
                                            {roles.map(r => (
                                                <option key={r._id} value={r._id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Domain</label>
                                        <select 
                                            value={formDomainId} 
                                            onChange={(e) => {
                                                const dId = e.target.value;
                                                setFormDomainId(dId);
                                                const dName = domains.find(d => d._id === dId)?.name || '';
                                                setFormDomain(dName);
                                                setFormModuleId('');
                                            }} 
                                            className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all"
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
                                            value={formModuleId} 
                                            onChange={(e) => setFormModuleId(e.target.value)}
                                            disabled={!formDomainId}
                                            className="w-full h-11 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all disabled:opacity-50"
                                        >
                                            <option value="">Select Module...</option>
                                            {modules
                                                .filter(m => (m.domainId?._id || m.domainId) === formDomainId)
                                                .map(m => (
                                                    <option key={m._id} value={m._id}>{m.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase text-xs tracking-widest">Discard</button>
                                    <button type="button" onClick={handleSaveUser} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-xs tracking-widest">Commit Injection</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InspectorInfo({ label, icon, value, children }: { label: string; icon: React.ReactNode; value?: string; children?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-400">
                <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
            </div>
            {value ? <span className="text-sm font-bold text-slate-700">{value}</span> : children}
        </div>
    );
}
