'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/service/api.service';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Eye, 
    X, 
    ChevronRight, 
    MoreHorizontal,
    GitBranch,
    Play,
    UserPlus,
    LayoutGrid,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

interface Workflow {
  _id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  nodes: any[];
  edges: any[];
  moduleId: string;
  createdAt: string;
}

interface Module {
    _id: string;
    name: string;
    description: string;
}

function TemplatesContent() {
    const { id, moduleId } = useParams();
    const router = useRouter();
    const [templates, setTemplates] = useState<Workflow[]>([]);
    const [module, setModule] = useState<Module | null>(null);
    const [isIdLoading, setIsIdLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            setIsIdLoading(true);
            // Fetch workflows filtered by moduleId
            const res = await apiService.request(`/workflows?moduleId=${moduleId}&isTemplate=true`);
            if (res.success) setTemplates(res.data);

            // Fetch module info
            const modulesRes = await apiService.getModules(id as string);
            if (modulesRes.success) {
                const found = modulesRes.data.find((m: Module) => m._id === moduleId);
                setModule(found);
            }
        } catch (error) {
            toast.error('Failed to fetch templates');
        } finally {
            setIsIdLoading(false);
        }
    };

    useEffect(() => {
        if (moduleId) fetchData();
    }, [moduleId]);

    const handleDelete = async (tid: string) => {
        if (!confirm('Permanently remove this logic schema template?')) return;
        try {
            await apiService.request(`/workflows/${tid}`, { method: 'DELETE' });
            toast.success('Template terminated');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Error occurred');
        }
    };

    const handleInitialize = async (tid: string) => {
        try {
            const res = await apiService.request(`/workflows/${tid}/execute`, {
                method: 'POST',
                body: JSON.stringify({ title: `Auto-Init: ${new Date().toLocaleString()}` })
            });
            if (res.success) {
                toast.success('Workflow initialized from template');
                router.push(`/Workflows/instances/${res.data._id}`);
            }
        } catch (error: any) {
            toast.error('Execution error: ' + error.message);
        }
    };

    const filtered = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center shadow-sm">
                        <Layers size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">{module?.name || 'Loading...'}</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-[0.2em]">Logic Schema Repository / Templates</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push(`/admin/domains/${id}/modules`)}
                        className="px-6 py-4 bg-white border border-slate-100 text-slate-400 rounded-[24px] font-black shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest text-[11px]"
                    >
                        Switch Unit
                    </button>
                    <Link href={`/create-workflow?moduleId=${moduleId}&isTemplate=true`}>
                        <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest text-[11px]">
                            <Plus size={18} />
                            Architect New Template
                        </button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search logic schemas by capability..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[32px] shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
                />
            </div>

            {/* Templates List - Wireframe Style (Table-like but premium) */}
            <div className="space-y-4">
                <div className="bg-slate-50 px-10 py-4 rounded-[20px] flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                    <span className="flex-1">Template Architecture</span>
                    <span className="w-48 text-center">Status</span>
                    <span className="w-96 text-right pr-6">Operational Control</span>
                </div>

                {isIdLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-white rounded-[32px] border border-slate-100 animate-pulse"></div>
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((temp) => (
                        <div
                            key={temp._id}
                            className="bg-white p-6 md:px-10 md:py-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group relative flex flex-col md:flex-row items-center"
                        >
                            <div className="flex-1 flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-[24px] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <GitBranch size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{temp.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs text-slate-400 font-medium">{temp.description || 'Global business logic schema.'}</p>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{temp.nodes?.length || 0} Blocks</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-48 flex justify-center">
                                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${temp.status === 'active' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                                    {temp.status || 'Ready'}
                                </div>
                            </div>

                            <div className="w-96 flex justify-end gap-2 items-center">
                                <button 
                                    onClick={() => handleInitialize(temp._id)}
                                    className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    <Play size={14} fill="white" />
                                    Init
                                </button>
                                <button 
                                    onClick={() => router.push(`/admin/workflows/${temp._id}`)}
                                    className="p-3.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="View Logic"
                                >
                                    <Eye size={18} />
                                </button>
                                <Link href={`/create-workflow?id=${temp._id}`} title="Modify Schema">
                                    <div className="p-3.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                        <Edit size={18} />
                                    </div>
                                </Link>
                                <button 
                                    onClick={() => handleDelete(temp._id)}
                                    className="p-3.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Delete Schema"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200 text-center">
                        <GitBranch className="mx-auto text-slate-200 mb-4" size={56} />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No logic schemas mapped to this unit</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TemplatesPage() {
    return (
        <Suspense fallback={<div>Synchronizing Lattice Data...</div>}>
            <TemplatesContent />
        </Suspense>
    );
}

const Layers = ({ size, className }: { size: number; className?: string }) => (
    <svg 
        width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);
