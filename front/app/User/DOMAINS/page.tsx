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
    Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/alerts';
import { Toaster } from 'sonner';

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

            {/* Premium Header Hero */}
            <section className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Structural Matrix Active</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase italic leading-none">
                           All Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">Domains</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-xl">
                            Categorize your workflows and personnel into strategic business sectors within the matrix.
                        </p>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 space-y-8">
                {/* Title and Action Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Organization Domains</h2>
                        <p className="text-sm font-medium text-slate-400">Categorize your workflows and personnel into strategic business sectors.</p>
                    </div>
                    
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        New Domain
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search sectors by name or mission..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    />
                </div>

                {/* Sector Grid (Matching Reference) */}
                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse shadow-sm"></div>
                        ))
                    ) : filteredDomains.length > 0 ? (
                        filteredDomains.map((domain) => (
                            <motion.div
                                layoutId={domain._id}
                                key={domain._id}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => router.push(`/User/MODULES?domainId=${domain._id}`)}
                                className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Left Color Accent */}
                                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: domain.color || COLORS[0] }}></div>
                                
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-8">
                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <Briefcase size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase">
                                                {domain.name}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">
                                                {domain.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            {domain.isActive !== false ? 'Active' : 'Inactive'}
                                        </div>
                                        
                                        {/* Options Buttons */}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); router.push(`/User/DOMAINS/MODULES?domainId=${domain._id}&action=create`); }}
                                                className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-100"
                                                title="Quick Deploy Module"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEdit(domain); }}
                                                className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(domain._id); }}
                                                className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
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
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
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
