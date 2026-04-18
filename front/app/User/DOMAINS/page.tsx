'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutGrid,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Briefcase,
    Sparkles,
    Zap,
    ChevronRight,
    Bell,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/alerts';
import { Toaster } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface Domain {
    _id: string;
    name: string;
    description: string;
    code?: string;
    isActive: boolean;
    color: string;
    createdAt?: string;
}

const COLORS = [
    '#6366f1', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#a855f7', // Purple
    '#ec4899', // Pink
];

function DomainsPageContent() {
    const router = useRouter();
    const { can } = usePermissions();
    const searchParams = useSearchParams();
    const [domains, setDomains] = useState<Domain[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModulesLoading, setIsModulesLoading] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);



    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'create') {
            resetForm();
            setIsModalOpen(true);
        }
    }, [searchParams]);

    const fetchDomains = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.getDomains();
            if (response.success) {
                setDomains(response.data);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch domains');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!name || !description) {
            toast.error('Sector designation and narrative required.');
            return;
        }

        try {
            const data = { name, description, color };
            if (isEditing && selectedDomain) {
                await apiService.updateDomain(selectedDomain._id, data);
                toast.success('Sector refined successfully');
            } else {
                await apiService.createDomain(data);
                toast.success('Sector established successfully');
            }
            setIsModalOpen(false);
            fetchDomains();
            resetForm();
        } catch (error: any) {
            toast.error(error.message || 'Error processing structural sector');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm({
            title: 'Terminate Sector',
            text: 'Are you sure you want to fragment this organizational sector?',
            confirmButtonText: 'Yes, Fragment'
        });
        if (!confirmed) return;
        try {
            await apiService.deleteDomain(id);
            toast.success('Sector fragmented');
            setSelectedDomain(null);
            fetchDomains();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting sector');
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setColor(COLORS[0]);
        setIsEditing(false);
        setSelectedDomain(null);
        setModules([]);
    };

    const handleEdit = async (domain: Domain) => {
        setIsEditing(true);
        setSelectedDomain(domain);
        setName(domain.name);
        setDescription(domain.description);
        setColor(domain.color || COLORS[0]);
        setIsModalOpen(true);

        // Fetch modules for this domain
        try {
            setIsModulesLoading(true);
            const response = await apiService.getModules(domain._id);
            if (response.success) {
                setModules(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch modules for domain modal:', error);
        } finally {
            setIsModulesLoading(false);
        }
    };

    const filteredDomains = domains.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12 bg-[#F8FAFC] min-h-screen"
        >
            <Toaster position="top-right" richColors />

            {/* Workarea Start */}

            {/* Organization Domains Header - MINIMIZED SCALE */}
            <div className="max-w-7xl mx-auto w-full px-12 md:px-16 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Organization Domains</h1>
                    <p className="text-sm font-bold text-slate-400 max-w-xl leading-tight tracking-tight">
                        Categorize your workflows and personnel into strategic business sectors.
                    </p>
                </div>
                <button
                    onClick={() => can('Domain.CREATE') && (resetForm(), setIsModalOpen(true))}
                    disabled={!can('Domain.CREATE')}
                    title={!can('Domain.CREATE') ? "Matrix Restricted" : ""}
                    className={`px-6 py-3 rounded-2xl font-black text-[11px] transition-all shadow-lg flex items-center gap-2.5 active:scale-95 ${
                        btnDisabledClass('Domain.CREATE') || 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                    }`}
                >
                    <Plus size={16} className="stroke-[4]" />
                    New Domain
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-8 md:px-16 space-y-8">
                {/* Search Bar Section - COMPACTED */}
                <div className="px-5">
                    <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-[0_5px_20px_-10px_rgba(0,0,0,0.05)] focus-within:ring-4 focus-within:ring-indigo-50 transition-all group">
                        <Search size={18} className="text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search sectors by name or mission..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none w-full placeholder:text-slate-300 placeholder:font-bold"
                        />
                    </div>
                </div>

                {/* Sector Grid - COMPACT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse shadow-sm"></div>
                        ))
                    ) : filteredDomains.length > 0 ? (
                        filteredDomains.map((domain, idx) => (
                            <motion.div
                                layoutId={domain._id}
                                key={domain._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => router.push(`/User/MODULES?domainId=${domain._id}`)}
                                className={`group relative bg-white rounded-3xl border-y border-l border-slate-100 border-r-4 border-r-indigo-600 p-8 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden flex flex-col ${permissionDisabledClass('Domain.VIEW')}`}
                            >
                                {/* Top area with Icon and Badge */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <Briefcase size={22} />
                                    </div>
                                    <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>

                                {/* Content area */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors capitalize">
                                        {domain.name}
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest line-clamp-2">
                                        {domain.description}
                                    </p>
                                </div>

                                {/* Hidden Actions (Shows on Hover) */}
                                <div className="absolute bottom-4 right-6 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); can('Domain.UPDATE') && handleEdit(domain); }}
                                        title={!can('Domain.UPDATE') ? "Matrix Restricted" : "Refine Sector"}
                                        className={`p-2.5 rounded-lg hover:shadow-md transition-all ${
                                            btnDisabledClass('Domain.UPDATE') || 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600'
                                        }`}
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); can('Domain.DELETE') && handleDelete(domain._id); }}
                                        title={!can('Domain.DELETE') ? "Matrix Restricted" : "Fragment Sector"}
                                        className={`p-2.5 rounded-lg hover:shadow-md transition-all ${
                                            btnDisabledClass('Domain.DELETE') || 'bg-white border border-slate-100 text-slate-400 hover:text-rose-600'
                                        }`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center shadow-inner">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No organizational sectors detectable</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Refinement Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16"></div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black tracking-tight">{isEditing ? 'Refine Sector' : 'Establish Sector'}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Sparkles size={14} className="text-indigo-400" />
                                        <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Structural Unit Configuration</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all relative z-10">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Sector Designation</label>
                                    <input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Strategic Logistics"
                                        className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100/50 border-none transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mission Narrative</label>
                                    <textarea
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        placeholder="Define the structural role of this sector..."
                                        className="w-full bg-slate-50 rounded-[2rem] p-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100/50 border-none transition-all resize-none text-sm shadow-inner"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Visual Lattice Identifier</label>
                                    <div className="flex justify-between px-2">
                                        {COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={`w-10 h-10 rounded-full border-4 transition-all ${color === c ? 'scale-125 shadow-xl ring-4 ring-indigo-50 border-white' : 'border-transparent hover:scale-110'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="pt-6 border-t border-slate-50 space-y-4">
                                        <div className="flex justify-between items-center px-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Functional Units (Modules)</label>
                                            {selectedDomain && (
                                                <button 
                                                    type="button"
                                                    onClick={() => router.push(`/User/MODULES?domainId=${selectedDomain._id}`)}
                                                    className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter hover:underline"
                                                >
                                                    Manage Workspace
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {isModulesLoading ? (
                                                <div className="py-4 text-center">
                                                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                                                </div>
                                            ) : modules.length > 0 ? (
                                                modules.map(mod => (
                                                    <div 
                                                        key={mod._id}
                                                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                            <LayoutGrid size={14} />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide truncate">
                                                            {mod.name}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 px-4">
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No Functional Units Established</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-5 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        {isEditing ? 'Apply Refinements' : 'Initialize Sector'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function DomainsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[70vh] items-center justify-center">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
        }>
            <DomainsPageContent />
        </Suspense>
    );
}
