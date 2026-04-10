'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    Sparkles,
    Zap,
    ChevronLeft,
    Plus,
    CheckCircle2,
    LayoutGrid,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

const COLORS = [
    '#6366f1', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#a855f7', // Purple
    '#ec4899', // Pink
];

export default function CreateDomainPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [createdId, setCreatedId] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !description) {
            toast.error('Please define both designation and mission narrative.');
            return;
        }

        try {
            setIsSaving(true);
            const response = await apiService.createDomain({ name, description, color });
            if (response.success && response.data?._id) {
                setCreatedId(response.data._id);
                toast.success('Organizational sector established successfully.');
            } else {
                toast.error('Sector integration failed.');
            }
        } catch (error: any) {
            toast.error(error.message || 'System error during sector initialization');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Toaster position="top-right" richColors />
            
            {/* Full-Screen Premium Header */}
            <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <button 
                        onClick={() => router.push('/User/DOMAINS')}
                        className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors mb-10 group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to sectors</span>
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <Sparkles size={24} className="text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Structural Initialization</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none mb-6">
                        Establish <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">Operational Sector</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl">
                        Define a new strategic business domain to compartmentalize workflows and specialized resources within the organization matrix.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-8 md:p-12 -mt-12">
                <AnimatePresence mode="wait">
                    {!createdId ? (
                        <motion.form 
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onSubmit={handleSubmit} 
                            className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-10 md:p-16 space-y-12"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest pl-2">Sector Designation</label>
                                        <input
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. STRATEGIC LOGISTICS"
                                            className="w-full h-16 bg-slate-50 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all shadow-inner uppercase tracking-wider"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest pl-2 font-bold">Lattice Identifier (Color)</label>
                                        <div className="flex flex-wrap gap-4 px-2">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setColor(c)}
                                                    className={`w-12 h-12 rounded-2xl border-4 transition-all ${color === c ? 'scale-125 shadow-xl ring-8 ring-indigo-50 border-white' : 'border-transparent hover:scale-110 shadow-sm'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest pl-2">Mission Narrative</label>
                                    <textarea
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={8}
                                        placeholder="Define the primary purpose and scope of this structural unit..."
                                        className="w-full bg-slate-50 rounded-[2.5rem] p-8 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all resize-none text-sm leading-relaxed shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-slate-900 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95"
                                >
                                    {isSaving ? 'Initializing...' : 'Establish Sector'}
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-12 md:p-20 text-center space-y-10"
                        >
                            <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50/50">
                                <CheckCircle2 size={64} strokeWidth={3} />
                            </div>
                            
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-2 italic">Sector Established</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs underline decoration-emerald-200 decoration-2 underline-offset-4">
                                    Identity: {name}
                                </p>
                            </div>

                            <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                                The structural unit is now active within the organizational matrix. You can now proceed to deploy the first functional module to handle specific logical flows.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                                <button 
                                    onClick={() => router.push(`/User/DOMAINS/MODULES?domainId=${createdId}&action=create`)}
                                    className="px-12 py-6 bg-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95"
                                >
                                    <LayoutGrid size={20} />
                                    Deploy Functional Unit (Module)
                                </button>
                                <button 
                                    onClick={() => router.push('/User/DOMAINS')}
                                    className="px-8 py-6 bg-white border border-slate-100 text-slate-400 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:text-slate-800 transition-all"
                                >
                                    Overview Registry
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
