'use client'

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    FolderKanban,
    MoreHorizontal,
    Calendar,
    Layers,
    Trash2,
    Edit,
    Eye,
    Clock,
    ArrowRight,
    Briefcase,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { apiService } from '@/service/api.service';
import Link from 'next/link';

interface Project {
    _id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    isAllDomains: boolean;
    allowedDomains: string[];
    createdAt: string;
    updatedAt: string;
}

import { useRouter } from 'next/navigation';

interface Domain {
    _id: string;
    name: string;
    code: string;
    isActive: boolean;
}

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        status: 'planning',
        isAllDomains: true,
        allowedDomains: [] as string[],
        domain: '',
        color: '#6366f1'
    });
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        try {
            const response = await apiService.getDomains();
            if (response.success) {
                setDomains(response.data);
            }
        } catch (error) {
            console.error('Error fetching domains:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProjects();
            if (response.success) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await apiService.createProject(newProject);
            if (response.success) {
                setProjects([response.data, ...projects]);
                setIsModalOpen(false);
                setNewProject({
                    name: '',
                    description: '',
                    status: 'planning',
                    isAllDomains: true,
                    allowedDomains: [],
                    domain: '',
                    color: '#6366f1'
                });
                toast.success('Project created successfully');
            }
        } catch (error: any) {
            toast.error('Error creating project: ' + error.message);
        }
    };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.deleteProject(id);
      if (response.success) {
        toast.success('Project deleted successfully');
        setProjects(prev => prev.filter(p => p._id !== id));
        if (selectedProject?._id === id) setSelectedProject(null);
      }
    } catch (error: any) {
      toast.error('Error during deletion: ' + error.message);
    }
  };

    const startEditing = (project: any) => {
        setNewProject({
            name: project.name,
            description: project.description || '',
            domain: project.domain || '',
            allowedDomains: project.allowedDomains || [],
            isAllDomains: project.isAllDomains || false,
            status: project.status || 'active',
            color: project.color || '#6366f1'
        });
        setEditingProjectId(project._id);
        setIsModalOpen(true);
        setSelectedProject(null);
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'planning': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'completed': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'on-hold': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Toaster position="top-right" richColors />
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search projects by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchProjects} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
                        <Clock size={20} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Project Grid - Now full width */}
                <div className="overflow-y-auto pr-2 custom-scrollbar">
                    {filteredProjects.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-300">
                                <FolderKanban size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">No Project Found</h3>
                            <p className="text-slate-500 mt-2 max-w-xs">Organize your workflows by creating your first project container.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                            >
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project._id}
                                    project={project}
                                    isSelected={selectedProject?._id === project._id}
                                    onClick={() => router.push(`/admin/projects/${project._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Project Inspector Modal */}
                <AnimatePresence>
                    {selectedProject && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedProject(null)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
                            >
                                <div className="p-8 flex-grow overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(selectedProject.status)}`}>
                                            {selectedProject.status} Status
                                        </div>
                                        <button
                                            onClick={() => setSelectedProject(null)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                                        <div className="bg-indigo-600 w-24 h-24 rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                                            <Briefcase size={40} />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedProject.name}</h2>
                                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Project Environment</p>
                                            <p className="text-sm font-medium text-slate-500 leading-relaxed mt-4">
                                                {selectedProject.description || 'This environment serves as a containment and orchestration layer for specialized operational workflows.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        <div className="p-6 bg-slate-50 rounded-[28px] space-y-4">
                                            <DetailRow label="Strategic Visibility" icon={<Layers size={16} />}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm ${selectedProject.isAllDomains ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-amber-600 border-amber-100'}`}>
                                                    {selectedProject.isAllDomains ? 'Universal Access' : 'Restricted Lattice'}
                                                </span>
                                            </DetailRow>
                                            {!selectedProject.isAllDomains && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Authorized Sectors</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {selectedProject.allowedDomains.map(d => (
                                                            <span key={d} className="px-2 py-1 bg-white text-slate-600 rounded-md border border-slate-100 text-[9px] font-black uppercase tracking-tight shadow-sm">
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-[28px] space-y-4">
                                            <DetailRow label="Genesis Date" icon={<Calendar size={16} />}>
                                                <span className="text-sm font-bold text-slate-700">{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                                            </DetailRow>
                                            <DetailRow label="Last Synchronization" icon={<Clock size={16} />}>
                                                <span className="text-sm font-bold text-slate-700">{new Date(selectedProject.updatedAt).toLocaleDateString()}</span>
                                            </DetailRow>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                                    <div className="flex gap-4">
                                        <Link href={`/admin/workflows?projectId=${selectedProject._id}`} className="flex-[2]">
                                            <button className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200">
                                                <Layers size={18} />
                                                Inspect Workflows
                                            </button>
                                        </Link>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => startEditing(selectedProject)}
                                            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-inter"
                                        >
                                            <Edit size={16} />
                                            Update Environment
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedProject._id)}
                                            className="px-6 py-4 bg-rose-50 text-rose-600 rounded-[20px] hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center justify-center shadow-lg shadow-rose-50"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Construct Environment</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    placeholder="e.g. Q1 Operations"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium h-24 resize-none"
                                    placeholder="What is this project about?"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Status</label>
                                <select
                                    value={newProject.status}
                                    onChange={e => setNewProject({ ...newProject, status: e.target.value as any })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                >
                                    <option value="planning">Planning</option>
                                    <option value="active">Active</option>
                                    <option value="on-hold">On Hold</option>
                                </select>
                            </div>

                            <div className="space-y-4 pt-2">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-indigo-50/50 transition-colors group">
                                    <input
                                        type="checkbox"
                                        checked={newProject.isAllDomains}
                                        onChange={e => setNewProject({ ...newProject, isAllDomains: e.target.checked })}
                                        className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                    />
                                    <div>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">Available to All Domains</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Everyone in the organization can see this project</p>
                                    </div>
                                </label>

                                {!newProject.isAllDomains && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Specific Domains</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {domains.map(domain => (
                                                <div
                                                    key={domain._id}
                                                    onClick={() => {
                                                        const current = newProject.allowedDomains;
                                                        if (current.includes(domain.name)) {
                                                            setNewProject({ ...newProject, allowedDomains: current.filter(d => d !== domain.name) });
                                                        } else {
                                                            setNewProject({ ...newProject, allowedDomains: [...current, domain.name] });
                                                        }
                                                    }}
                                                    className={`px-3 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer text-center ${newProject.allowedDomains.includes(domain.name)
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                                                        }`}
                                                >
                                                    {domain.name}
                                                </div>
                                            ))}
                                        </div>
                                        {newProject.allowedDomains.length === 0 && (
                                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-1">Select at least one domain</p>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function ProjectCard({ project, isSelected, onClick }: { project: Project; isSelected: boolean; onClick: () => void }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500';
            case 'planning': return 'bg-indigo-500';
            case 'completed': return 'bg-slate-400';
            case 'on-hold': return 'bg-amber-500';
            default: return 'bg-slate-300';
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={onClick}
            className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-100 hover:border-indigo-200 shadow-sm'}`}
        >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusColor(project.status)}`}></div>

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                        <Briefcase size={20} className="text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{project.status}</p>
                    </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(project.status)} animate-pulse`}></div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Created</span>
                        <span className="text-xs font-black text-slate-700">{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <button className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                    <ArrowRight size={16} />
                </button>
            </div>
        </motion.div>
    );
}

function DetailRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-400">
                <div className="p-2.5 bg-slate-50 rounded-xl">{icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
            </div>
            {children}
        </div>
    );
}
