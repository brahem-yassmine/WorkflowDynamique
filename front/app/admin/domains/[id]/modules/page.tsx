'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Layers,
    ChevronRight,
    ArrowLeft,
    Eye,
    Copy,
    Projector,
    Briefcase,
    Stethoscope,
    LayoutGrid,
    Activity,
    ClipboardList,
    Save,
    CheckCircle,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/alerts';

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

export default function DomainModulesSpace() {
    const { id: domainId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedModuleId = searchParams.get('moduleId');

    const [modules, setModules] = useState<Module[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
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

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [modulesRes, projectsRes] = await Promise.all([
                apiService.getModules(domainId as string),
                apiService.getProjects()
            ]);
            if (modulesRes.success) setModules(modulesRes.data);
            if (projectsRes.success) setProjects(projectsRes.data);
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
        if (domainId) fetchData();
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
        try {
            const data = { name: moduleName, description: moduleDescription, domainId };
            if (currentModule) {
                await apiService.updateModule(currentModule._id, data);
                toast.success('Module refined');
            } else {
                await apiService.createModule(data);
                toast.success('New module deployed');
            }
            setIsModuleModalOpen(false);
            fetchData();
            window.dispatchEvent(new Event('modulesUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Error occurred');
        }
    };

    const handleModuleDelete = async (mid: string) => {
        const confirmed = await showConfirm({
            title: 'Terminate Unit',
            text: 'Are you sure you want to fragment this unit?',
            confirmButtonText: 'Fragment Unit'
        });
        if (!confirmed) return;
        try {
            await apiService.deleteModule(mid);
            toast.success('Unit fragmented');
            if (selectedModuleId === mid) router.push(`/admin/domains/${domainId}/modules`);
            fetchData();
            window.dispatchEvent(new Event('modulesUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Error occurred');
        }
    };

    const handleAssignTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateToAssign || !selectedProjectId) return;
        try {
            const res = await apiService.duplicateWorkflow(templateToAssign._id, {
                projectId: selectedProjectId,
                name: `${templateToAssign.name} (Project Instance)`
            } as any);
            
            if (res.success) {
                toast.success('Unit protocol assigned to project');
                setIsAssignModalOpen(false);
                if (personalizeAfter && res.data?._id) {
                    router.push(`/admin/create_workflows?id=${res.data._id}`);
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Error occurred');
        }
    };

    const openModuleModal = (mod: Module | null = null) => {
        setCurrentModule(mod);
        setModuleName(mod?.name || '');
        setModuleDescription(mod?.description || '');
        setIsModuleModalOpen(true);
    };

    const filteredModules = modules.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in duration-700">
            {/* Header Overlay */}
            <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Functional Matrix</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Strategic Unit Orchestration</p>
                </div>
                <div className="flex gap-4 relative z-10">
                    {!selectedModuleId ? (
                        <button 
                            onClick={() => openModuleModal()}
                            className="px-8 py-3.5 bg-slate-800 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-700 transition-all flex items-center gap-3"
                        >
                            create new module
                        </button>
                    ) : (
                        <button 
                            onClick={() => router.push(`/admin/create_workflows?moduleId=${selectedModuleId}&domainId=${domainId}&isTemplate=true`)}
                            className="px-8 py-3.5 bg-slate-800 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-700 transition-all flex items-center gap-3"
                        >
                            create new template
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-slate-200 px-10 py-4 rounded-t-[32px] text-xs font-black text-slate-600 uppercase tracking-[0.2em]">
                    {selectedModuleId ? 'liste des templete' : 'liste de module cree'}
                </div>
                
                <div className="flex-1 bg-white border-x border-b border-slate-100 rounded-b-[32px] overflow-hidden p-8">
                    <AnimatePresence mode="wait">
                        {!selectedModuleId ? (
                            <motion.div 
                                key="modules"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full overflow-y-auto space-y-3 custom-scrollbar pr-2"
                            >
                                {isLoading ? (
                                    Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)
                                ) : filteredModules.length > 0 ? (
                                    filteredModules.map((mod) => (
                                        <div key={mod._id} className="bg-slate-600 p-6 rounded-2xl flex items-center justify-between text-white shadow-lg shadow-slate-200/50">
                                            <span className="font-black tracking-tight uppercase">{mod.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openModuleModal(mod)} className="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                                    <Edit size={14} className="text-amber-400" />
                                                    Modifier
                                                </button>
                                                <button onClick={() => handleModuleDelete(mod._id)} className="px-5 py-2.5 bg-slate-800/50 hover:bg-rose-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                                    <Trash2 size={14} className="text-rose-400" />
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No modules found</div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="templates"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full overflow-y-auto space-y-3 custom-scrollbar pr-2"
                            >
                                {templates.length > 0 ? (
                                    templates.map((tpl) => (
                                        <div key={tpl._id} className="bg-slate-600 p-6 rounded-2xl flex items-center justify-between text-white shadow-lg shadow-slate-200/50">
                                            <span className="font-black tracking-tight uppercase">{tpl.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => { setTemplateToAssign(tpl); setIsAssignModalOpen(true); }}
                                                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    asseigner
                                                </button>
                                                <button 
                                                    onClick={() => router.push(`/admin/workflows/${tpl._id}?tab=visual&viewOnly=true`)}
                                                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    view
                                                </button>
                                                <button 
                                                    onClick={() => router.push(`/admin/create_workflows?id=${tpl._id}&moduleId=${selectedModuleId}&domainId=${domainId}&isTemplate=true`)}
                                                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    modifier
                                                </button>
                                                <button className="px-4 py-2 bg-slate-800/50 hover:bg-rose-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                                    supp
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No protocols found</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals - Simplified */}
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
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100"
                        >
                            {isModuleModalOpen && (
                                <div className="p-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentModule ? 'Refine Unit' : 'Deploy Unit'}</h2>
                                        <button onClick={() => setIsModuleModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={24} /></button>
                                    </div>
                                    <form onSubmit={handleModuleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Name</label>
                                            <input required value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-700 outline-none border-none shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Directive</label>
                                            <textarea
                                                value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)}
                                                rows={4} placeholder="Optional: Define the operational boundaries of this unit..."
                                                className="w-full bg-slate-50 rounded-[30px] p-6 font-bold text-slate-700 outline-none border-none shadow-inner resize-none text-sm"
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Confirm Implementation</button>
                                    </form>
                                </div>
                            )}

                            {isAssignModalOpen && (
                                <div className="p-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                                <Zap size={20} />
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Assign Protocol</h2>
                                        </div>
                                        <button onClick={() => setIsAssignModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={24} /></button>
                                    </div>

                                    <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100/50 space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Source Protocol</label>
                                        <div className="text-xl font-black text-slate-700 tracking-tight">{templateToAssign?.name}</div>
                                    </div>

                                    <form onSubmit={handleAssignTemplate} className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                                <Briefcase size={12} />
                                                Target Workspace
                                            </label>
                                            <select 
                                                required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                                                className="w-full h-16 bg-slate-50 rounded-2xl px-6 font-black text-indigo-600 outline-none border-2 border-transparent focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Project destination...</option>
                                                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div 
                                            onClick={() => setPersonalizeAfter(!personalizeAfter)}
                                            className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between group ${personalizeAfter ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl transition-colors ${personalizeAfter ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
                                                    <Edit size={18} className={personalizeAfter ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                                                </div>
                                                <div>
                                                    <div className={`text-[11px] font-black uppercase tracking-widest ${personalizeAfter ? 'text-indigo-100' : 'text-slate-400'}`}>Tailored Implementation</div>
                                                    <div className="text-xs font-bold leading-tight">Personalize for this project after assignment</div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${personalizeAfter ? 'bg-white border-white text-indigo-600' : 'border-slate-200'}`}>
                                                {personalizeAfter && <CheckCircle size={14} />}
                                            </div>
                                        </div>

                                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                                            <Save size={18} />
                                            Finalize Assignment
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
