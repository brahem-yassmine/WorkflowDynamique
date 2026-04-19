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
    Sparkles,
    Workflow,
    Copy,
    Palette,
    Info,
    ShieldAlert
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
    color?: string;
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

const COLORS = [
    '#6366f1', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#a855f7', // Purple
    '#ec4899', // Pink
];

function DomainModulesContent() {
    const router = useRouter();
    const { can, btnDisabledClass, permissionDisabledClass } = usePermissions();
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
    const [moduleColor, setModuleColor] = useState(COLORS[0]);
    const [modWorkflows, setModWorkflows] = useState<any[]>([]);
    const [localDomainId, setLocalDomainId] = useState('');
    const [activeView, setActiveView] = useState<'units' | 'config'>('units');
    const [currentDomain, setCurrentDomain] = useState<any>(null);
    
    // Sector Config States
    const [sectorName, setSectorName] = useState('');
    const [sectorDescription, setSectorDescription] = useState('');
    const [sectorColor, setSectorColor] = useState(COLORS[0]);
    const [isSavingSector, setIsSavingSector] = useState(false);

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
            const fetchedDomains = results[1].success ? results[1].data : [];
            setDomains(fetchedDomains);
            
            if (domainId) {
                const found = fetchedDomains.find((d: any) => d._id === domainId);
                if (found) {
                    setCurrentDomain(found);
                    setSectorName(found.name);
                    setSectorDescription(found.description);
                    setSectorColor(found.color || COLORS[0]);
                }
            }
            
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

    const handleSectorUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domainId) return;
        try {
            setIsSavingSector(true);
            await apiService.updateDomain(domainId, { 
                name: sectorName, 
                description: sectorDescription, 
                color: sectorColor 
            });
            toast.success('Sector matrix recalibrated');
            setCurrentDomain((prev: any) => prev ? { ...prev, name: sectorName, description: sectorDescription, color: sectorColor } : null);
        } catch (err: any) {
            toast.error(err.message || 'Calibration failed');
        } finally {
            setIsSavingSector(false);
        }
    };

    const handleSectorDelete = async () => {
        if (!domainId) return;
        const confirmed = await showConfirm({
            title: 'Terminate Sector Node',
            text: 'This operation is irreversible.',
            confirmButtonText: 'Initialize Termination'
        });
        if (!confirmed) return;
        try {
            await apiService.deleteDomain(domainId);
            toast.success('Sector matrix purged');
            router.push('/User/DOMAINS');
        } catch (err: any) {
            toast.error(err.message || 'Termination aborted');
        }
    };

    useEffect(() => {
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
            const data = { 
                name: moduleName, 
                description: moduleDescription, 
                domainId: targetDomainId,
                color: moduleColor 
            };
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

    const handleDuplicateTemplate = async (id: string) => {
        try {
            const res = await apiService.duplicateWorkflow(id);
            if (res.success) {
                toast.success('Protocol duplicated');
                if (selectedModuleId) fetchTemplates(selectedModuleId);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error duplicating protocol');
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

    const openModuleModal = async (mod: Module | null = null) => {
        setCurrentModule(mod);
        setModuleName(mod?.name || '');
        setModuleDescription(mod?.description || '');
        setModuleColor(mod?.color || COLORS[0]);
        setLocalDomainId(mod?.domainId || domainId || '');
        
        if (mod) {
            try {
                const res = await apiService.request(`/workflows?moduleId=${mod._id}&isTemplate=true`);
                if (res.success) setModWorkflows(res.data);
            } catch (err) {
                console.error('Failed to load module protocols');
                setModWorkflows([]);
            }
        } else {
            setModWorkflows([]);
        }

        setIsModuleModalOpen(true);
    };

    const filteredModules = modules.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <Toaster position="top-right" richColors />

            <aside className="w-80 bg-indigo-700 text-white flex flex-col h-full shadow-2xl relative overflow-hidden flex-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                
                <div className="p-6">
                    <button 
                        onClick={() => router.push('/User/DOMAINS')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 hover:text-white transition-colors group px-4 py-2 bg-white/5 rounded-xl border border-white/5"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Domains
                    </button>
                </div>

                <div className="px-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden group">
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

                <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-8 scrollbar-hide">
                    <div className="space-y-2">
                        <div className="px-4 mb-4">
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] opacity-60">Operations</span>
                        </div>
                        <button 
                            onClick={() => {
                                setActiveView('units');
                                router.push(`/User/MODULES?domainId=${domainId}`);
                            }}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black transition-all group ${activeView === 'units' ? 'bg-white text-indigo-700 shadow-xl shadow-indigo-900/20' : 'text-indigo-200 hover:text-white hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Grid size={18} />
                                <span className="text-xs">CONFIG & MODULES</span>
                            </div>
                            <ChevronRight size={14} className={activeView === 'units' ? 'opacity-100' : 'opacity-0'} />
                        </button>
                        
                        <div className="mt-6 space-y-1">
                            {modules.map(mod => (
                                <button 
                                    key={mod._id}
                                    onClick={() => {
                                        setActiveView('units');
                                        router.push(`/User/MODULES?domainId=${domainId}&moduleId=${mod._id}`);
                                    }}
                                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/5 ${selectedModuleId === mod._id ? 'text-white bg-indigo-600/50' : 'text-indigo-200 hover:text-white'}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedModuleId === mod._id ? 'bg-white' : 'bg-indigo-400'}`}></div>
                                    {mod.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10 mx-4">
                        <button 
                            onClick={() => setActiveView('config')}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'config' ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-200 hover:text-white hover:bg-white/5'}`}
                        >
                            <Settings size={16} />
                            Sector Config
                        </button>
                    </div>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAFC]">
                <div className="flex-1 py-10 px-16 max-w-7xl mx-auto w-full space-y-12">
                    
                    <section className="relative group p-12 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-12">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                         
                         <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl relative">
                                     <div className="absolute inset-0 bg-white/10 rounded-3xl blur-sm group-hover:blur-md transition-all"></div>
                                      {activeView === 'units' ? <Layers size={48} /> : <Settings size={48} />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-4xl md:text-5xl font-black text-[#1E293B] tracking-tighter leading-none">
                                            {activeView === 'units' ? (
                                                <>Functional <span className="text-indigo-600">Matrix</span></>
                                            ) : (
                                                <>Sector <span className="text-indigo-600">Config</span></>
                                            )}
                                        </h2>
                                        <div className="px-4 py-1.5 bg-indigo-50/50 rounded-full border border-indigo-100/50">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Management v2.4</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                        <span className="w-12 h-[2px] bg-indigo-100/60" />
                                        {activeView === 'units' ? 'Strategic Unit Orchestration' : 'Strategic Matrix Calibration'}
                                    </p>
                                </div>
                            </div>

                            {activeView === 'units' && (
                                <div className="relative z-10 flex flex-col gap-3 flex-none pr-4">
                                    {!selectedModuleId ? (
                                        <button 
                                            onClick={() => can('Module.CREATE') && openModuleModal()}
                                            title={!can('Module.CREATE') ? "Matrix Restricted" : "Initialize New Unit"}
                                            className="group/btn relative px-10 py-5 rounded-full overflow-hidden shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                                        >
                                            <Plus size={20} className="group-hover/btn:rotate-90 transition-transform stroke-[3]" />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Deploy New Unit</span>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => can('Workflow.CREATE') && router.push(`/User/create?domainId=${domainId}&moduleId=${selectedModuleId}&isTemplate=true&fresh=true`)}
                                            title={!can('Workflow.CREATE') ? "Matrix Restricted" : "Establish New Protocol"}
                                            className="group/btn relative px-10 py-5 rounded-full overflow-hidden shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                                        >
                                            <Zap size={20} className="relative z-10 transition-transform group-hover/btn:scale-110 stroke-[3]" />
                                            <span className="relative z-10 text-[11px] font-black uppercase tracking-widest">Forge Protocol</span>
                                        </button>
                                    )}
                                </div>
                            )}
                         </div>
                    </section>

                    <div className="flex flex-col space-y-10">
                        {activeView === 'units' ? (
                            <>
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
                                            className="w-full md:w-80 h-14 bg-white border border-slate-100 rounded-3xl pl-16 pr-8 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/5 transition-all"
                                        />
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={selectedModuleId || 'grid'}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {!selectedModuleId ? (
                                            filteredModules.length > 0 ? (
                                                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${permissionDisabledClass('Module.VIEW')}`}>
                                                    {filteredModules.map((mod, idx) => (
                                                    <motion.div 
                                                        key={mod._id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        onClick={() => router.push(`/User/MODULES?domainId=${domainId}&moduleId=${mod._id}`)}
                                                        className="group relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150 group-hover:bg-indigo-100/50 opacity-40"></div>
                                                        
                                                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                                            <div 
                                                                className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110"
                                                                style={{ backgroundColor: mod.color || COLORS[0] }}
                                                            >
                                                                <LayoutGrid size={32} />
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{mod.name}</h3>
                                                                <div className="inline-flex px-4 py-1 bg-slate-50 rounded-full border border-slate-100">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Operational Unit</span>
                                                                </div>
                                                            </div>

                                                            <div className="w-full pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openModuleModal(mod);
                                                                    }}
                                                                    className={`flex-1 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all ${btnDisabledClass('Module.UPDATE')}`}
                                                                >
                                                                    Refine
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleModuleDelete(mod._id);
                                                                    }}
                                                                    className={`w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all ${btnDisabledClass('Module.DELETE')}`}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-24 text-center">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                                        <Box size={40} />
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">No units currently deployed</h3>
                                                </div>
                                            )
                                        ) : (
                                        <div className={`space-y-4 ${permissionDisabledClass('Workflow.VIEW')}`}>
                                            {templates.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {templates.map((tpl, idx) => (
                                                <motion.div 
                                                    key={tpl._id} 
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-white p-8 rounded-[40px] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
                                                >
                                                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 rounded-l-full scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                                                    
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-[15deg] transition-all duration-500 shadow-sm group-hover:shadow-indigo-200">
                                                            <Workflow size={24} />
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); can('Workflow.CREATE') && handleDuplicateTemplate(tpl._id); }}
                                                                title={!can('Workflow.CREATE') ? "Matrix Restricted" : "Clone Template"}
                                                                className={`p-3 rounded-xl transition-colors ${
                                                                    can('Workflow.CREATE')
                                                                    ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white'
                                                                    : 'bg-slate-50 text-slate-200 cursor-not-allowed pointer-events-none'
                                                                }`}
                                                            >
                                                                <Copy size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); can('Workflow.DELETE') && handleTemplateDelete(tpl._id); }}
                                                                title={!can('Workflow.DELETE') ? "Matrix Restricted" : "Delete Template"}
                                                                className={`p-3 rounded-xl transition-colors ${
                                                                    can('Workflow.DELETE') 
                                                                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'
                                                                    : 'bg-slate-50 text-slate-200 cursor-not-allowed pointer-events-none'
                                                                }`}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
    
                                                    <div className="space-y-2 mb-8 flex-grow">
                                                        <h3 className="font-black text-slate-800 tracking-tight uppercase text-lg group-hover:text-indigo-600 transition-colors leading-tight">{tpl.name || 'New Protocol'}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Unit</span>
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tpl.nodes?.length || 0} Nodes</span>
                                                        </div>
                                                    </div>
    
                                                    <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                                                            <button 
                                                                onClick={() => { can('Workflow.CREATE') && (setTemplateToAssign(tpl), setIsAssignModalOpen(true)); }}
                                                                title={!can('Workflow.CREATE') ? "Matrix Restricted" : "Assign to Project"}
                                                                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
                                                                    can('Workflow.CREATE')
                                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100/50'
                                                                    : 'bg-slate-100 text-slate-300 grayscale opacity-30 cursor-not-allowed pointer-events-none'
                                                                }`}
                                                            >
                                                                <Plus size={14} className="stroke-[3]" />
                                                                Assign
                                                            </button>
                                                            <button 
                                                                onClick={() => router.push(`/User/create?id=${tpl._id}&moduleId=${selectedModuleId}&domainId=${domainId}&isTemplate=true`)}
                                                                className={`flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95`}
                                                            >
                                                                <Eye size={16} className="text-slate-400" />
                                                                View
                                                            </button>
                                                            <button 
                                                                onClick={() => { can('Workflow.UPDATE') && router.push(`/User/create?id=${tpl._id}&moduleId=${selectedModuleId}&domainId=${domainId}&isTemplate=true`); }}
                                                                title={!can('Workflow.UPDATE') ? "Matrix Restricted" : "Refine Protocol"}
                                                                className={`p-3.5 border rounded-2xl transition-all flex items-center justify-center active:scale-95 shadow-sm shrink-0 bg-white border-slate-100 text-slate-400 hover:text-indigo-600 ${
                                                                    can('Workflow.UPDATE') ? '' : 'bg-slate-50 border-slate-50 text-slate-200 grayscale opacity-40 cursor-not-allowed pointer-events-none'
                                                                }`}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                    </div>
                                                </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="col-span-full py-32 text-center text-slate-300">
                                                    <Zap size={48} className="mx-auto mb-4 opacity-20" />
                                                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">No protocols detected in sector repository</p>
                                                </div>
                                            )}
                                        </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-12"
                            >
                                <div className="lg:col-span-2 space-y-8">
                                    <form onSubmit={handleSectorUpdate} className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 p-12 space-y-10">
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Sector Name</label>
                                                <input 
                                                    required 
                                                    value={sectorName} 
                                                    onChange={(e) => setSectorName(e.target.value)}
                                                    placeholder="Assign unit designation..."
                                                    className="w-full h-16 bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white border-2 rounded-2xl px-6 font-bold text-slate-700 outline-none transition-all shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Operational Directive (Description)</label>
                                                <textarea 
                                                    required 
                                                    value={sectorDescription} 
                                                    onChange={(e) => setSectorDescription(e.target.value)}
                                                    rows={5}
                                                    placeholder="Detail the procedural scope of this sector..."
                                                    className="w-full bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white border-2 rounded-[32px] p-8 font-bold text-slate-700 outline-none transition-all resize-none shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                    <Palette size={14} className="text-indigo-400" />
                                                    Matrix Visual Identifier
                                                </label>
                                                <div className="flex flex-wrap gap-4">
                                                    {COLORS.map(c => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => setSectorColor(c)}
                                                            className={`w-12 h-12 rounded-2xl border-4 transition-all ${sectorColor === c ? 'border-white scale-110 shadow-lg ring-4 ring-indigo-100' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={isSavingSector}
                                            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isSavingSector ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Save size={20} className="stroke-[3]" />
                                                    Synchronize Matrix
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                                        <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-4 relative z-10">
                                            <Info size={24} className="text-indigo-400" />
                                            Lattice Integrity
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider leading-relaxed relative z-10 mb-8 opacity-80">
                                            Domain configurations define the boundaries of organizational data flow. Ensure the directive accurately reflects current business operations.
                                        </p>
                                        <div className="space-y-4 relative z-10 flex flex-col gap-3">
                                            <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group/node">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400 group-hover/node:bg-indigo-500 group-hover/node:text-white transition-all">
                                                    <ShieldAlert size={20} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Protected Node</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-rose-50 border border-rose-100 rounded-[40px] p-10 space-y-8 shadow-xl shadow-rose-100/20">
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-black text-rose-800 tracking-tight uppercase italic leading-none">Danger Zone</h3>
                                            <p className="text-[10px] text-rose-600/70 font-black uppercase tracking-widest leading-relaxed">Decommissioning this sector will permanently fragment all linked modules and templates.</p>
                                        </div>
                                        <button 
                                            onClick={handleSectorDelete}
                                            className="w-full py-5 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <Trash2 size={18} />
                                            Decommission Sector
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
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
                            className="absolute inset-0 bg-slate-900/60"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100"
                        >
                            {isModuleModalOpen && (
                                <>
                                    <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16"></div>
                                        <div className="relative z-10">
                                            <h2 className="text-2xl font-black tracking-tight">{currentModule ? 'Refine Unit' : 'Deploy Unit'}</h2>
                                            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">Manual Unit Integration</p>
                                        </div>
                                        <button onClick={() => setIsModuleModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all relative z-10">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleModuleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
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

                                        {/* Color Matrix */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                <Palette size={14} className="text-indigo-400" />
                                                Visual Matrix Identifier
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                {COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setModuleColor(c)}
                                                        className={`w-9 h-9 rounded-xl border-4 transition-all ${moduleColor === c ? 'border-white scale-110 shadow-lg ring-2 ring-indigo-100' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Operational Directive</label>
                                            <textarea
                                                value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)}
                                                rows={3} placeholder="Optional: Specialized unit parameters..."
                                                className="w-full bg-slate-50 rounded-[2rem] p-6 font-bold text-slate-700 outline-none border-none shadow-inner resize-none text-sm"
                                            />
                                        </div>

                                        {/* Internal Protocols Registry */}
                                        {currentModule && (
                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                    <Activity size={14} className="text-emerald-500" />
                                                    Internal Protocol Registry
                                                </label>
                                                <div className="bg-slate-50 rounded-3xl p-6 space-y-3">
                                                    {modWorkflows.length > 0 ? (
                                                        modWorkflows.map((w) => (
                                                            <div key={w._id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{w.name}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-4 text-[9px] font-black uppercase tracking-widest text-slate-300 italic">No protocols assigned to this unit</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Confirm Deployment</button>
                                    </form>
                                </>
                            )}

                            {isAssignModalOpen && (
                                <>
                                    <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16"></div>
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
