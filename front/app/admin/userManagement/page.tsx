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
    Layers,
    Copy,
    Globe,
    Package,
    Clipboard,
    ListChecks,
    Trello
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
    domainId?: any;
    moduleId?: any;
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
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [reassignUser, setReassignUser] = useState<Persona | null>(null);
    const [isReassigning, setIsReassigning] = useState(false);
    
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
            
            // Sync Persona Inspector in real-time
            if (selectedUser) {
                const updatedPersona = { 
                    ...selectedUser, 
                    firstName, 
                    lastName, 
                    email, 
                    role: formRole, 
                    specificRole: formSpecificRole,
                    specificRoleId: formSpecificRoleId,
                    domainId: formDomainId,
                    moduleId: formModuleId
                };
                setSelectedUser(updatedPersona);
            }

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
    
    const handleClearAuthorityNode = async (user: Persona) => {
        try {
            await apiService.updateUser(user._id, { 
                specificRoleId: null, 
                specificRole: null 
            });
            toast.success('Authority Node cleared');
            
            // Trigger Re-assignment flow
            setReassignUser(user);
            setIsReassignModalOpen(true);
            
            fetchData();
            if (selectedUser?._id === user._id) {
                setSelectedUser({ ...user, specificRoleId: undefined, specificRole: undefined });
            }
        } catch (error: any) {
            toast.error('Failed to fragment authority node');
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
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Talent Network <span className="text-indigo-600">Matrix</span></h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-60">Architectural Node Management & Authorization</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Entities" 
                    value={users.length} 
                    icon={<Users size={24} />} 
                    color="from-indigo-500 to-indigo-600" 
                />
                <StatCard 
                    label="Active Nodes" 
                    value={users.filter(u => u.isActive).length} 
                    icon={<Activity size={24} />} 
                    color="from-emerald-500 to-emerald-600" 
                />
                <StatCard 
                    label="Restricted" 
                    value={users.filter(u => !u.isActive).length} 
                    icon={<Lock size={24} />} 
                    color="from-rose-500 to-rose-600" 
                />
                <StatCard 
                    label="Admin Tiers" 
                    value={users.filter(u => u.role === 'admin').length} 
                    icon={<Shield size={24} />} 
                    color="from-amber-500 to-amber-600" 
                />
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

            <div className="grid grid-cols-1 gap-8">                {/* User List Matrix */}
                <div className="bg-white rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Lattice Entities</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-1.5 bg-white rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                                {filteredUsers.length} Nodes Detected
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Identity</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Node Ref</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Perimeter</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</th>
                                    <th className="px-10 py-6 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                                                    <div className="space-y-2">
                                                        <div className="w-32 h-4 bg-slate-100 rounded" />
                                                        <div className="w-24 h-3 bg-slate-50 rounded" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.map((user) => (
                                    <motion.tr
                                        layoutId={user._id}
                                        key={user._id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`hover:bg-indigo-50/30 transition-all cursor-pointer group relative ${selectedUser?._id === user._id ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center font-black text-lg transition-all shadow-lg ${selectedUser?._id === user._id ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border-2 border-slate-100 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600'}`}>
                                                    {(user.firstName || user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-base font-black text-slate-800 tracking-tight">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs font-bold text-slate-400 opacity-80">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <code className="px-3 py-1.5 bg-slate-900 text-slate-400 text-[10px] font-black rounded-lg border border-slate-800 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                                #{user._id.slice(-6).toUpperCase()}
                                            </code>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${user.role === 'admin' ? 'bg-amber-500 text-white border-amber-400' : 'bg-indigo-600 text-white border-indigo-500'}`}>
                                                        {user.role}
                                                    </span>
                                                    {user.specificRole && (
                                                        <span className="px-3 py-1 bg-white text-slate-600 border-2 border-slate-100 text-[9px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-sm group/role transition-all hover:border-indigo-200">
                                                            <Shield size={10} className="text-indigo-500" />
                                                            <span className="truncate max-w-[100px]">{user.specificRole}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm transition-all ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                                {user.isActive ? 'Operational' : 'Restricted'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center justify-end gap-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(user);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-indigo-100 rounded-2xl transition-all border border-transparent hover:border-indigo-100"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-indigo-200">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
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
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
                            >
                                {/* Header with gradient */}
                                <div className="h-40 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 relative overflow-hidden shrink-0">
                                    <div className="absolute top-0 right-0 p-8">
                                         <button
                                            onClick={() => setSelectedUser(null)}
                                            className="p-3 bg-white/20 text-white hover:bg-white/30 rounded-2xl transition-all backdrop-blur-md border border-white/10"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                                         <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white rounded-full blur-[120px]" />
                                    </div>
                                </div>

                                <div className="px-10 -mt-16 relative z-10 flex-grow overflow-y-auto custom-scrollbar pb-10">
                                    <div className="flex items-end gap-8 mb-10">
                                        <div className="w-32 h-32 bg-white p-2.5 rounded-[42px] shadow-2xl shadow-indigo-200/50 shrink-0">
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[34px] flex items-center justify-center text-white text-4xl font-black uppercase">
                                                {(selectedUser.firstName || selectedUser.email).charAt(0)}
                                            </div>
                                        </div>
                                        <div className="pb-6 space-y-2">
                                            <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedUser.firstName} {selectedUser.lastName}</h2>
                                            <div className="flex items-center gap-3">
                                                 <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${selectedUser.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {selectedUser.isActive ? 'Operational' : 'Suspended'}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] border border-slate-100 px-3 py-1 rounded-xl bg-slate-50/50">
                                                    #{selectedUser._id.slice(-6).toUpperCase()} Node
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Network Presence & Identity</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 space-y-6">
                                                    <InspectorInfo label="Connectivity" icon={<Mail size={18} />} value={selectedUser.email} />
                                                    <InspectorInfo label="Primary Domain" icon={<Briefcase size={18} />} value={selectedUser.domainId?.name || selectedUser.domain || 'Global Lattice'} />
                                                    <InspectorInfo label="System Tier" icon={<Shield size={18} />} value={selectedUser.role.toUpperCase()} />
                                                </div>
                                                <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 space-y-6">
                                                    <InspectorInfo label="Authority Node" icon={<Shield size={18} />} action={selectedUser.specificRole ? (
                                                        <button 
                                                            onClick={() => handleClearAuthorityNode(selectedUser)}
                                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Clear Authority Node"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    ) : null}>
                                                        {selectedUser.specificRole ? (
                                                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                                                {selectedUser.specificRole}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-300 italic">None Assigned</span>
                                                        )}
                                                    </InspectorInfo>
                                                    <InspectorInfo label="Module Scope" icon={<Layers size={18} />} value={selectedUser.moduleId?.name || 'Unrestricted Matrix'} />
                                                    <InspectorInfo label="Integrity Status" icon={<Activity size={18} />}>
                                                        <div className={`flex items-center gap-2 text-xs font-bold ${selectedUser.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            <div className={`w-2 h-2 rounded-full ${selectedUser.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                            {selectedUser.isActive ? 'Sync Validated' : 'Access Restricted'}
                                                        </div>
                                                    </InspectorInfo>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <button
                                                    onClick={() => handleToggleStatus(selectedUser)}
                                                    className={`flex-[2] py-6 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl ${selectedUser.isActive ? 'bg-white border-2 border-amber-100 text-amber-600 hover:bg-amber-50 shadow-amber-100/20' : 'bg-emerald-600 text-white shadow-emerald-200/50 hover:bg-emerald-700'}`}
                                                >
                                                    {selectedUser.isActive ? <Lock size={20} /> : <CheckCircle2 size={20} />}
                                                    {selectedUser.isActive ? 'Suspend Authorization' : 'Restore Connection'}
                                                </button>
                                                <div className="flex flex-1 gap-4">
                                                    <button
                                                        onClick={() => handleEdit(selectedUser)}
                                                        className="flex-1 py-6 bg-slate-900 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200/50"
                                                    >
                                                        <Edit3 size={18} />
                                                        Refine
                                                    </button>
                                                    <button
                                                        disabled={!!currentUser && ((currentUser as any).email === selectedUser.email || (currentUser as any)._id === selectedUser._id || (currentUser as any).id === selectedUser._id)}
                                                        onClick={() => handleDelete(selectedUser._id)}
                                                        className={`px-8 py-6 rounded-[28px] transition-all border-2 flex items-center justify-center shadow-lg active:scale-95 ${!!currentUser && ((currentUser as any).email === selectedUser.email || (currentUser as any)._id === selectedUser._id || (currentUser as any).id === selectedUser._id) ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed opacity-40' : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border-rose-100 shadow-rose-100/50'}`}
                                                    >
                                                        <Trash2 size={22} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
                                                const role = roles.find(r => r._id === roleId);
                                                const roleName = role?.name || '';
                                                setFormSpecificRole(roleName);
                                                
                                                // 🎚️ Smart Auto-Fill Scope
                                                // If the selected Authority Node has a defined context, prioritize it
                                                if (role?.domainId) {
                                                    const dId = role.domainId?._id || role.domainId;
                                                    setFormDomainId(dId);
                                                    const dName = domains.find(d => d._id === dId)?.name || '';
                                                    setFormDomain(dName);
                                                }
                                                if (role?.moduleId) {
                                                    setFormModuleId(role.moduleId?._id || role.moduleId);
                                                }
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

            {/* Authority Re-assignment Modal */}
            <AnimatePresence>
                {isReassignModalOpen && reassignUser && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsReassignModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-[0_32px_128px_-32px_rgba(79,70,229,0.3)] w-full max-w-lg relative z-10 overflow-hidden border border-slate-100 flex flex-col"
                        >
                            <div className="bg-rose-500 p-8 text-white relative overflow-hidden">
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black tracking-tight uppercase">Authority Fragmented</h2>
                                            <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-0.5">Zero-Privilege State Detected</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsReassignModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Persona</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black shadow-sm border border-slate-100 uppercase">
                                            {reassignUser.firstName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{reassignUser.firstName} {reassignUser.lastName}</p>
                                            <p className="text-[10px] font-medium text-slate-400">{reassignUser.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">New Authority Perimeter</label>
                                    <div className="grid grid-cols-1 gap-3 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                                        {roles.map((role) => (
                                            <button
                                                key={role._id}
                                                onClick={() => {
                                                    setFormSpecificRoleId(role._id);
                                                    setFormSpecificRole(role.name);
                                                }}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${formSpecificRoleId === role._id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${formSpecificRoleId === role._id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400'}`}>
                                                        <Shield size={14} />
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-tight ${formSpecificRoleId === role._id ? 'text-indigo-900' : 'text-slate-600'}`}>{role.name}</span>
                                                </div>
                                                {formSpecificRoleId === role._id && <CheckCircle2 size={16} className="text-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        if (!formSpecificRoleId) return;
                                        try {
                                            setIsReassigning(true);
                                            await apiService.updateUser(reassignUser._id, {
                                                specificRoleId: formSpecificRoleId,
                                                specificRole: formSpecificRole
                                            });
                                            toast.success('Matrix synchronization complete');
                                            setIsReassignModalOpen(false);
                                            fetchData();
                                            
                                            // Sync Persona Inspector with new authority
                                            const updatedUser = { 
                                                ...reassignUser, 
                                                specificRoleId: formSpecificRoleId, 
                                                specificRole: formSpecificRole 
                                            };
                                            setSelectedUser(updatedUser);
                                            
                                            resetForm();
                                        } catch (error) {
                                            toast.error('Re-assignment failure');
                                        } finally {
                                            setIsReassigning(false);
                                        }
                                    }}
                                    disabled={!formSpecificRoleId || isReassigning}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isReassigning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield size={18} />}
                                    {isReassigning ? 'Binding Node...' : 'Assign New Authority'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon, color, trend }: { label: string; value: number; icon: React.ReactNode; color: string; trend?: string }) {
    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`} />
            <div className="flex items-center gap-6 relative z-10">
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h4>
                        {trend && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">{trend}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getPermIcon(category: string) {
    switch (category.toUpperCase()) {
        case 'DOMAIN': return <Globe size={10} className="text-indigo-500" />;
        case 'MODULE': return <Package size={10} className="text-violet-500" />;
        case 'PROJECT': return <Briefcase size={10} className="text-amber-500" />;
        case 'WORKFLOW': return <Layers size={10} className="text-blue-500" />;
        case 'FORM': return <Clipboard size={10} className="text-rose-500" />;
        case 'CHECKLIST': return <ListChecks size={10} className="text-emerald-500" />;
        case 'KANBAN': return <Trello size={10} className="text-orange-500" />;
        default: return <Shield size={10} className="text-slate-400" />;
    }
}

function InspectorInfo({ label, icon, value, children, action }: { label: string; icon: React.ReactNode; value?: string; children?: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-slate-400">
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm text-indigo-500">{icon}</div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 leading-none">{label}</span>
                    {action}
                </div>
            </div>
            {value ? <span className="text-sm font-black text-slate-700 tracking-tight">{value}</span> : children}
        </div>
    );
}
