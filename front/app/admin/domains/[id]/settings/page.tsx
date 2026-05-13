'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/alerts';
import { 
    Settings, 
    Trash2, 
    Save, 
    Info, 
    ShieldAlert, 
    Palette,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = [
    '#6366f1', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#a855f7', // Purple
    '#ec4899', // Pink
];

export default function DomainSettingsPage() {
    const { id } = useParams();
    const router = useRouter();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchDomain = async () => {
            try {
                setIsLoading(true);
                const res = await apiService.getDomains();
                if (res.success) {
                    const domain = res.data.find((d: any) => d._id === id);
                    if (domain) {
                        setName(domain.name);
                        setDescription(domain.description);
                        setColor(domain.color || COLORS[0]);
                    }
                }
            } catch (err) {
                toast.error('Failed to load sector configuration');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDomain();
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            setIsSaving(true);
            await apiService.updateDomain(id as string, { name, description, color });
            toast.success('Sector matrix recalibrated successfully');
        } catch (err: any) {
            toast.error(err.message || 'Calibration sequence failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm({
            title: 'Terminate Sector Node',
            text: 'This operation is irreversible. All associations within this domain will be fragmented.',
            confirmButtonText: 'Initialize Termination'
        });

        if (!confirmed) return;

        try {
            await apiService.deleteDomain(id as string);
            toast.success('Sector matrix purged from lattice');
            router.push('/admin/domains');
        } catch (err: any) {
            toast.error(err.message || 'Termination sequence aborted');
        }
    };

    if (isLoading) {
        return <div className="p-10 animate-pulse text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Matrix Configuration...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Settings size={18} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight underline decoration-indigo-500/20 underline-offset-8">Sector Configuration</h1>
                </div>
                <p className="text-slate-500 text-sm font-medium">Manage the core identity and operational parameters of this domain lattice.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Form Column */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleUpdate} className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sector Name</label>
                                <input 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Human Resources"
                                    className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Directive (Description)</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    placeholder="Define the strategic mission for this domain..."
                                    className="w-full bg-slate-50 rounded-[32px] p-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 border-none transition-all resize-none text-sm placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                    <Palette size={14} />
                                    Matrix Visual Identifier
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-10 h-10 rounded-2xl border-4 transition-all ${color === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(0,0,0,0.1)] ring-4 ring-indigo-50' : 'border-transparent hover:scale-105 opacity-60 hover:opacity-100'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSaving ? 'Synchronizing...' : (
                                <>
                                    <Save size={18} />
                                    Synchronize Changes
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Info / Delete Column */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-3 relative z-10">
                            <Info size={20} className="text-indigo-400" />
                            Lattice Integrity
                        </h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed relative z-10 mb-6">
                            Domain configurations define the boundaries of organizational data flow. Ensure the directive accurately reflects current business operations.
                        </p>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                                    <ShieldAlert size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Protected Node</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-rose-50 border border-rose-100 rounded-[40px] p-8 space-y-6 group">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-rose-900 tracking-tight">Danger Zone</h3>
                            <p className="text-xs text-rose-600 font-medium">Decommissioning this sector will affect all linked modules and templates.</p>
                        </div>
                        <button 
                            onClick={handleDelete}
                            className="w-full py-4 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Trash2 size={16} />
                            Decommission Sector
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
