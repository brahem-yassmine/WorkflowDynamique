'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    LayoutGrid,
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ChevronRight,
    X,
    Briefcase,
    Activity,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showAlert, showConfirm } from '@/lib/alerts';

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

export default function DomainsPage() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);

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

        console.log('🚀 Starting domain save...', { name, description, color, isEditing });

        if (!name || !description) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            const data = { name, description, color };
            if (isEditing && selectedDomain) {
                console.log('📝 Updating domain:', selectedDomain._id);
                const res = await apiService.updateDomain(selectedDomain._id, data);
                console.log('✅ Update successful:', res);
                toast.success('Domain updated successfully');
            } else {
                console.log('➕ Creating new domain...');
                const res = await apiService.createDomain(data);
                console.log('✅ Creation successful:', res);
                toast.success('Domain created successfully');
            }
            setIsModalOpen(false);
            fetchDomains();
            resetForm();
        } catch (error: any) {
            console.error('❌ Error while saving domain:', error);
            toast.error(error.message || 'Error saving domain');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm({
            title: 'Delete Domain',
            text: 'Are you sure you want to delete this domain?',
            confirmButtonText: 'Yes, Delete'
        });
        if (!confirmed) return;
        try {
            await apiService.deleteDomain(id);
            toast.success('Domain deleted');
            setSelectedDomain(null);
            fetchDomains();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting domain');
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setColor(COLORS[0]);
        setIsEditing(false);
    };

    const handleEdit = (domain: Domain) => {
        setIsEditing(true);
        setName(domain.name);
        setDescription(domain.description);
        setColor(domain.color || COLORS[0]);
        setIsModalOpen(true);
    };

    const filteredDomains = domains.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Organization Domains</h1>
                    <p className="text-slate-500 text-sm font-medium">Categorize your workflows and personnel into strategic business sectors.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    New Domain
                </button>
            </div>

            {/* Matrix View */}
            <div className="flex flex-col gap-8">
                <div className="flex-grow space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search sectors by name or mission..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isLoading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse"></div>
                            ))
                        ) : filteredDomains.length > 0 ? (
                            filteredDomains.map((domain) => (
                                <motion.div
                                    layoutId={domain._id}
                                    key={domain._id}
                                    onClick={() => setSelectedDomain(domain)}
                                    className={`p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${selectedDomain?._id === domain._id ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}
                                >
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className={`p-3 rounded-2xl ${selectedDomain?._id === domain._id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                            <Briefcase size={20} />
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${selectedDomain?._id === domain._id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            Active
                                        </div>
                                    </div>

                                    <div className="mt-4 relative z-10">
                                        <h3 className={`font-black tracking-tight ${selectedDomain?._id === domain._id ? 'text-white' : 'text-slate-800'}`}>{domain.name}</h3>
                                        <p className={`text-xs mt-1 line-clamp-1 ${selectedDomain?._id === domain._id ? 'text-indigo-100' : 'text-slate-500'}`}>{domain.description}</p>
                                    </div>

                                    <div
                                        className="absolute top-0 right-0 w-1 h-full"
                                        style={{ backgroundColor: domain.color || '#6366f1' }}
                                    ></div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-2 py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No domains matching your search</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Domain Inspector Modal */}
                <AnimatePresence>
                    {selectedDomain && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedDomain(null)}
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
                                        <div className="w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-xl shrink-0"
                                            style={{ backgroundColor: selectedDomain.color || '#6366f1' }}>
                                            <Briefcase size={40} />
                                        </div>
                                        <button
                                            onClick={() => setSelectedDomain(null)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-2 mb-10">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedDomain.name}</h2>
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedDomain.color }}></div>
                                        </div>
                                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Structural Domain Sector</p>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed mt-4">
                                            {selectedDomain.description || 'This structural domain defines a strategic sector of the organization, compartmentalizing workflows and resources for specialized execution.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50 rounded-[28px] space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sector Identifier</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedDomain.name.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-[28px] space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3 text-slate-400">
                                                    <Activity size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Operation Status</span>
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-500 bg-white border border-emerald-100 px-3 py-1 rounded-lg shadow-sm">NOMINAL</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button
                                        onClick={() => handleEdit(selectedDomain)}
                                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200"
                                    >
                                        <Edit size={18} />
                                        Refine Sector
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedDomain._id)}
                                        className="px-6 py-4 bg-rose-50 text-rose-600 rounded-[20px] hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">{isEditing ? 'Refine Domain' : 'Define Sector'}</h2>
                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Manual structural injection</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-indigo-500 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Domain Identity</label>
                                    <input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Strategic Analysis"
                                        className="w-full h-12 bg-slate-50 rounded-2xl px-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mission Narrative (Description)</label>
                                    <textarea
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        placeholder="Define the purpose and scope of this sector..."
                                        className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all resize-none text-sm"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Visual Identifier (Color)</label>
                                    <div className="flex gap-2.5">
                                        {COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-indigo-600 scale-110 shadow-lg ring-4 ring-indigo-50' : 'border-transparent hover:scale-105'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase text-xs tracking-widest"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-xs tracking-widest"
                                    >
                                        {isEditing ? 'Update Domain' : 'Create Sector'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
