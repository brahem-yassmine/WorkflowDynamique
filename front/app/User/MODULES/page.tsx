'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    LayoutGrid,
    Activity,
    ArrowLeft,
    Zap,
    Briefcase,
    Save,
    CheckCircle,
    ChevronRight,
    Settings,
    Grid,
    Box,
    Layers,
    Eye,
    Bell,
    User,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/alerts';
import { Toaster } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface Module {
    _id: string;
    name: string;
    description: string;
    domainId: any;
    isActive: boolean;
    templateCount?: number;
}

interface Template {
    _id: string;
    name: string;
    description: string;
    moduleId: string;
    isTemplate: boolean;
    nodes: any[];
    edges: any[];
}

interface Project {
    _id: string;
    name: string;
}

function DomainModulesContent() {
    const router = useRouter();
    const { can } = usePermissions();
    const searchParams = useSearchParams();
    const domainId = searchParams.get('domainId');
    const selectedModuleId = searchParams.get('moduleId');

    const [modules, setModules] = useState<Module[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [domains, setDomains] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Form states
    const [currentModule, setCurrentModule] = useState<Module | null>(null);
    const [templateToAssign, setTemplateToAssign] = useState<Template | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [personalizeAfter, setPersonalizeAfter] = useState(false);

    const [moduleName, setModuleName] = useState('');
    const [moduleDescription, setModuleDescription] = useState('');
    const [localDomainId, setLocalDomainId] = useState('');

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'create') {
            setIsModuleModalOpen(true);
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const promises: Promise<any>[] = [apiService.getProjects(), apiService.getDomains()];
            if (domainId) promises.push(apiService.getModules(domainId));

            const results = await Promise.all(promises);
            setProjects(results[0].success ? results[0].data : []);
            setDomains(results[1].success ? results[1].data : []);
            if (domainId && results[2]) setModules(results[2].success ? results[2].data : []);
        } catch (error) {
            toast.error('Failed to sync lattice units');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTemplates = async (modId: string) => {
        try {
            const res = await apiService.request(`/workflows?moduleId=${modId}&isTemplate=true`);
            if (res.success) setTemplates(res.data);
        } catch (err) {
            toast.error('Failed to load standard protocols');
        }
    };

    useEffect(() => {
        // Reset state when domain changes to prevent stale data
        setModules([]);
        setTemplates([]);
        
        if (domainId) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [domainId]);

    useEffect(() => {
        if (selectedModuleId) {
            fetchTemplates(selectedModuleId);
        } else {
            setTemplates([]);
        }
    }, [selectedModuleId]);

    const handleModuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetDomainId = domainId || localDomainId;
        if (!targetDomainId) {
            toast.error('Sector designation required');
            return;
        }

        try {
            const data = { name: moduleName, description: moduleDescription, domainId: targetDomainId };
            if (currentModule) {
                await apiService.updateModule(currentModule._id, data);
                toast.success('Module unit refined');
            } else {
                await apiService.createModule(data);
                toast.success('New module unit deployed');
            }
            setIsModuleModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'System error during unit deployment');
        }
    };

    const handleModuleDelete = async (mid: string) => {
        const confirmed = await showConfirm({
            title: 'Terminate Unit',
            text: 'Are you sure you want to fragment this functional unit?',
            confirmButtonText: 'Fragment Unit'
        });
        if (!confirmed) return;
        try {
            await apiService.deleteModule(mid);
            toast.success('Unit fragmented');
            if (selectedModuleId === mid) router.push(`/User/MODULES?domainId=${domainId}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Fragmentation error');
        }
    };

    const handleTemplateDelete = async (tid: string) => {
        const confirmed = await showConfirm({
            title: 'Terminate Protocol',
            text: 'Are you sure you want to fragment this standardized protocol?',
            confirmButtonText: 'Fragment Protocol'
        });
        if (!confirmed) return;
        try {
            await apiService.deleteWorkflow(tid);
            toast.success('Protocol fragmented');
            if (selectedModuleId) fetchTemplates(selectedModuleId);
        } catch (error: any) {
            toast.error(error.message || 'Fragmentation error');
        }
    };

    const handleAssignTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateToAssign || !selectedProjectId) return;
        try {
            const res = await apiService.duplicateWorkflow(templateToAssign._id, {
                projectId: selectedProjectId,
                name: `${templateToAssign.name} (Instance)`
            } as any);
            
            if (res.success) {
                toast.success('Unit protocol assigned to project');
                setIsAssignModalOpen(false);
                if (personalizeAfter && res.data?._id) {
                    router.push(`/User/create?id=${res.data._id}`);
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Assignment failed');
        }
    };

    const openModuleModal = (mod: Module | null = null) => {
        setCurrentModule(mod);
        setModuleName(mod?.name || '');
        setModuleDescription(mod?.description || '');
        setLocalDomainId(mod?.domainId || domainId || '');
        setIsModuleModalOpen(true);
    };

    const filteredModules = modules.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentDomain = domains.find(d => d._id === domainId);

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <Toaster position="top-right" richColors />

            {/* Local Module Sidebar */}
            <aside className="w-80 bg-indigo-700 text-white flex flex-col h-full shadow-2xl relative overflow-hidden flex-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                
                {/* Back Link */}
                <div className="p-6">
                    <button 
                        onClick={() => router.push('/User/DOMAINS')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 hover:text-white transition-colors group px-4 py-2 bg-white/5 rounded-xl border border-white/5"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Domains
                    </button>
                </div>

                {/* Domain Identity */}
                <div className="px-8 py-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-transparent opacity-20"></div>
                            <Box size={28} className="text-white relative z-10" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">{currentDomain?.name || 'Loading...'}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em]">Sector Matrix</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Nav */}
                <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-8 scrollbar-hide">
                    <div className="space-y-2">
                        <div className="px-4 mb-4">
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] opacity-60">Operations</span>
                        </div>
                        <button className="w-full flex items-center justify-between px-5 py-4 bg-white text-indigo-700 rounded-2xl shadow-xl shadow-indigo-900/20 font-black transition-all group">
                            <div className="flex items-center gap-3">
                                <Grid size={18} />
                                <span className="text-xs">CONFIG & MODULES</span>
                            </div>
                            <ChevronRight size={14} />
                        </button>
                        
                        <div className="mt-6 space-y-1">
                            {modules.map(mod => (
                                <button 
                                    key={mod._id}
                                    onClick={() => router.push(`/User/MODULES?domainId=${domainId}&moduleId=${mod._id}`)}
                                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/5 ${selectedModuleId === mod._id ? 'text-white bg-indigo-600/50' : 'text-indigo-200 hover:text-white'}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedModuleId === mod._id ? 'bg-white' : 'bg-indigo-400'}`}></div>
                                    {mod.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10 mx-4">
                        <button className="w-full flex items-center gap-3 text-indigo-200 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest pl-1">
                            <Activity size={16} />
                            Lattice Management
                        </button>
                        <button className="w-full flex items-center gap-3 text-indigo-200 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest pl-1">
                            <Settings size={16} />
                            Sector Config
                        </button>
                    </div>
                </nav>

                <div className="p-8 mt-auto">
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest leading-none">Matrix Node</span>
                        </div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tight">Connected to {currentDomain?.name}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Workspace */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAFC]">
                <div className="flex-1 py-10 px-16 max-w-7xl mx-auto w-full space-y-12">
                    
                    {/* Functional Matrix Hero (Pixel Perfect to Screenshot) */}
                    <section className="relative group perspective">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-blue-600/10 rounded-[60px] blur transition duration-1000 group-hover:opacity-100"></div>
                        <div className="relative bg-white p-12 lg:p-14 rounded-[60px] border border-slate-100/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex items-center justify-between gap-12">
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-48 -mt-48 blur-3xl"></div>
                            
                            <div className="flex items-center gap-10 relative z-10 flex-1">
                                <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl flex-none">
                                     <Layers size={48} />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-4xl md:text-5xl font-black text-[#1E293B] tracking-tighter leading-none">
                                            Functional <span className="text-indigo-600">Matrix</span>
                                        </h2>
                                        <div className="px-4 py-1.5 bg-indigo-50/50 rounded-full border border-indigo-100/50">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Management v2.4</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                        <span className="w-12 h-[2px] bg-indigo-100/60" />
                                        Strategic Unit Orchestration
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col gap-3 flex-none pr-4">
                                {!selectedModuleId ? (
                                    <button 
                                        onClick={() => can('MODULE_CREATE') && openModuleModal()}
                                        disabled={!can('MODULE_CREATE')}
                                        title={!can('MODULE_CREATE') ? "Matrix Restricted" : "Initialize New Unit"}
                                        className={`group/btn relative px-10 py-5 rounded-full overflow-hidden shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                            can('MODULE_CREATE')
                                            ? 'bg-[#0F172A] text-white'
                                            : 'bg-slate-100 text-slate-300 grayscale opacity-30 blur-[1px]'
                                        }`}
                                    >
                                        <Plus size={18} className="group-hover/btn:rotate-90 transition-transform stroke-[3]" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Deploy New Unit</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => can('WORKFLOW_CREATE') && router.push(`/User/create?domainId=${domainId}&moduleId=${selectedModuleId}&isTemplate=true&fresh=true`)}
                                        disabled={!can('WORKFLOW_CREATE')}
                                        title={!can('WORKFLOW_CREATE') ? "Matrix Restricted" : "Establish New Protocol"}
                                        className={`group/btn relative px-10 py-5 rounded-full overflow-hidden shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                            can('WORKFLOW_CREATE')
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-300 grayscale opacity-30 blur-[1px]'
                                        }`}
                                    >
                                        <Zap size={18} className="relative z-10 transition-transform group-hover/btn:scale-110 stroke-[3]" />
                                        <span className="relative z-10 text-[11px] font-black uppercase tracking-widest">Forge Protocol</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col space-y-10">
                        {/* Section Selection/Markers (Image 2/3) */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-4">
                             <div className="flex items-center gap-6">
                                {selectedModuleId && (
                                    <button 
                                        onClick={() => router.push(`/User/MODULES?domainId=${domainId}`)}
                                        className="w-12 h-12 bg-white rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all active:scale-95"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <div>
                                    <span className="text-[11px] font-black text-[#1E293B] uppercase tracking-[0.25em]">
                                        {!selectedModuleId ? "Operational Units" : "Standardized Protocols"}
                                    </span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                        <span className="text-[11px] font-black text-[#64748B] uppercase tracking-widest leading-none">Live Repository System</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Filter units..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-[380px] pl-16 pr-8 py-4.5 bg-white border border-slate-100 rounded-full text-[11px] font-extrabold text-slate-700 outline-none uppercase tracking-[0.2em] placeholder:text-slate-200 focus:ring-4 focus:ring-indigo-50/50 shadow-sm transition-all"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
                            <AnimatePresence mode="wait">
                                {!selectedModuleId ? (
                                    <>
                                        {isLoading ? (
                                            Array(4).fill(0).map((_, i) => <div key={i} className="h-96 bg-white rounded-[60px] animate-pulse border border-slate-100 shadow-sm" />)
                                        ) : filteredModules.length > 0 ? (
                                            filteredModules.map((mod, idx) => (
                                                <motion.div 
                                                    key={mod._id} 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    whileHover={{ y: -5 }}
                                                    className="bg-white border border-slate-100 p-12 rounded-[80px] flex flex-col items-center text-center hover:border-indigo-100/50 hover:shadow-[0_45px_90px_-25px_rgba(99,102,241,0.1)] transition-all group cursor-pointer relative overflow-hidden"
                                                >
                                                    {/* Top Right Decorative Arc (from Image 1) */}
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/60 rounded-bl-[100px] transition-colors group-hover:bg-indigo-100/40" />
                                                    
                                                    <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white mb-10 shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform duration-500 relative z-10">
                                                        <LayoutGrid size={40} />
                                                    </div>
                                                    
                                                    <div className="space-y-4 mb-10 flex-grow relative z-10">
                                                        <h3 className="font-black text-indigo-600 tracking-tight uppercase text-3xl leading-none">{mod.name}</h3>
                                                        <div className="px-6 py-2.5 bg-[#F8FAFC] border border-slate-100 rounded-2xl inline-block shadow-sm">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Operational Unit</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="w-full h-px bg-slate-50 mb-8" />
                                                    
                                                    <div className="w-full flex items-center gap-4 relative z-10">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); can('MODULE_EDIT') && router.push(`/User/MODULES?domainId=${domainId}&moduleId=${mod._id}`); }} 
                                                            disabled={!can('MODULE_EDIT')}
                                                            title={!can('MODULE_EDIT') ? "Matrix Restricted" : "Update Unit Configuration"}
                                                            className={`flex-1 py-5 border text-[11px] font-black uppercase tracking-[0.3em] transition-all rounded-full active:scale-95 shadow-sm ${
                                                                can('MODULE_EDIT')
                                                                ? 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600 hover:shadow-lg'
                                                                : 'bg-slate-50 border-slate-50 text-slate-200 grayscale opacity-40 blur-[0.6px]'
                                                            }`}
                                                        >
                                                            Refine
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); can('MODULE_DELETE') && handleModuleDelete(mod._id); }} 
                                                            disabled={!can('MODULE_DELETE')}
                                                            title={!can('MODULE_DELETE') ? "Matrix Restricted" : "Terminate Unit"}
                                                            className={`w-16 h-16 border rounded-full transition-all flex items-center justify-center active:scale-95 shadow-sm shrink-0 ${
                                                                can('MODULE_DELETE')
                                                                ? 'bg-white border-slate-100 text-slate-200 hover:border-rose-100 hover:text-rose-500 hover:shadow-lg'
                                                                : 'bg-slate-50 border-slate-50 text-slate-100 grayscale opacity-40 blur-[0.8px]'
                                                            }`}
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-32 text-center text-slate-300">
                                                <LayoutGrid size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="font-black uppercase tracking-[0.3em] text-[10px]">No operational units detected</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {templates.map((tpl, idx) => (
                                            <motion.div 
                                                key={tpl._id} 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="group bg-white p-12 rounded-[80px] border border-slate-50/50 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.02)] transition-all flex flex-col relative overflow-hidden"
                                            >
                                                {/* Top Left Icon (Image 2 Style) */}
                                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 border border-indigo-100/50">
                                                    <Workflow size={24} />
                                                </div>

                                                <div className="space-y-4 mb-10 flex-grow">
                                                    <h3 className="font-black text-[#1E293B] tracking-tighter uppercase text-2xl leading-none">{tpl.name || 'New Protocol'}</h3>
                                                    <div className="flex items-center gap-3">
                                                        <div className="px-4 py-2 bg-[#F8FAFC] rounded-xl border border-slate-100 shadow-sm">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Unit</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                                                                {tpl.nodes?.length || 1} Nodes
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Three-Action Bar (Image 2 Architecture) */}
                                                <div className="w-full flex items-center gap-3 relative z-10 pt-4 border-t border-slate-50/80">
                                                    <button 
                                                        onClick={() => can('WORKFLOW_CREATE') && (setTemplateToAssign(tpl), setIsAssignModalOpen(true))}
                                                        disabled={!can('WORKFLOW_CREATE')}
                                                        title={!can('WORKFLOW_CREATE') ? "Matrix Restricted" : "Initialize in Workspace"}
                                                        className={`flex-1 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 ${
                                                            can('WORKFLOW_CREATE')
                                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                                            : 'bg-slate-100 text-slate-300 grayscale opacity-30 blur-[0.8px]'
                                                        }`}
                                                    >
                                                        <Plus size={14} className="stroke-[3]" />
                                                        Assign
                                                    </button>
                                                    <button 
                                                        onClick={() => router.push(`/User/create?id=${tpl._id}&moduleId=${selectedModuleId}&domainId=${domainId}&isTemplate=true`)}
                                                        className="flex-1 py-5 bg-[#F8FAFC] text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <Eye size={16} className="text-slate-400" />
                                                        View
                                                    </button>
                                                    <button 
                                                        onClick={() => can('WORKFLOW_EDIT') && router.push(`/User/create?id=${tpl._id}&moduleId=${selectedModuleId}&domainId=${domainId}&isTemplate=true`)}
                                                        disabled={!can('WORKFLOW_EDIT')}
                                                        title={!can('WORKFLOW_EDIT') ? "Matrix Restricted" : "Refine Protocol"}
                                                        className={`w-16 h-16 border rounded-full transition-all flex items-center justify-center active:scale-95 shadow-sm shrink-0 ${
                                                            can('WORKFLOW_EDIT')
                                                            ? 'bg-white border-slate-100 text-slate-300 hover:text-indigo-600'
                                                            : 'bg-slate-50 border-slate-50 text-slate-100 grayscale opacity-40 blur-[0.8px]'
                                                        }`}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {templates.length === 0 && (
                                            <div className="col-span-full py-32 text-center text-slate-300">
                                                <Zap size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="font-black uppercase tracking-[0.3em] text-[10px]">No protocols detected in sector repository</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {(isModuleModalOpen || isAssignModalOpen) && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setIsModuleModalOpen(false); setIsAssignModalOpen(false); }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100"
                        >
                            {isModuleModalOpen && (
                                <>
                                    <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                        <div className="relative z-10">
                                            <h2 className="text-2xl font-black tracking-tight">{currentModule ? 'Refine Unit' : 'Deploy Unit'}</h2>
                                            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">Manual Unit Integration</p>
                                        </div>
                                        <button onClick={() => setIsModuleModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all relative z-10">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleModuleSubmit} className="p-10 space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Target Sector</label>
                                            <select 
                                                required 
                                                value={localDomainId} 
                                                onChange={(e) => setLocalDomainId(e.target.value)}
                                                className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-700 outline-none border-none shadow-inner cursor-pointer"
                                                disabled={!!domainId && !currentModule}
                                            >
                                                <option value="">Select Organizational Sector...</option>
                                                {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Unit Designation</label>
                                            <input required value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-700 outline-none border-none shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Operational Directive</label>
                                            <textarea
                                                value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)}
                                                rows={4} placeholder="Optional: Specialized unit parameters..."
                                                className="w-full bg-slate-50 rounded-[2rem] p-6 font-bold text-slate-700 outline-none border-none shadow-inner resize-none text-sm"
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Confirm Deployment</button>
                                    </form>
                                </>
                            )}

                            {isAssignModalOpen && (
                                <>
                                    <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                        <div className="relative z-10 text-center w-full">
                                            <div className="flex items-center justify-center gap-3 mb-2">
                                                <Zap size={20} className="text-indigo-400" />
                                                <h2 className="text-2xl font-black tracking-tight leading-none">Assign Protocol</h2>
                                            </div>
                                            <div className="text-xl font-black text-white/50 tracking-tighter uppercase">{templateToAssign?.name}</div>
                                        </div>
                                        <button onClick={() => setIsAssignModalOpen(false)} className="absolute top-10 right-10 p-3 hover:bg-white/10 rounded-2xl transition-all z-10 text-white">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleAssignTemplate} className="p-10 space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                <Briefcase size={12} />
                                                Target Operational Workspace
                                            </label>
                                            <select 
                                                required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                                                className="w-full h-16 bg-slate-100/50 rounded-2xl px-6 font-black text-indigo-600 outline-none border-2 border-transparent focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Target Project...</option>
                                                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div 
                                            onClick={() => setPersonalizeAfter(!personalizeAfter)}
                                            className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all flex items-center justify-between group ${personalizeAfter ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${personalizeAfter ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
                                                    <Edit size={20} className={personalizeAfter ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                                                </div>
                                                <div>
                                                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${personalizeAfter ? 'text-indigo-200' : 'text-slate-400'}`}>Initialization Routine</div>
                                                    <div className="text-sm font-black leading-tight">Tailor for workspace after sync</div>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-8 rounded-xl border-4 flex items-center justify-center transition-all ${personalizeAfter ? 'bg-white border-white text-indigo-600' : 'border-slate-100'}`}>
                                                {personalizeAfter && <CheckCircle size={16} />}
                                            </div>
                                        </div>

                                        <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                                            <Save size={20} />
                                            Synchronize Protocol
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DomainModulesSpace() {
    return (
        <Suspense fallback={
            <div className="flex h-[70vh] items-center justify-center">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
        }>
            <DomainModulesContent />
        </Suspense>
    );
}
