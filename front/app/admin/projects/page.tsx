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
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import Link from 'next/link';

interface Project {
    _id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    createdAt: string;
    updatedAt: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', status: 'planning' });

    useEffect(() => {
        fetchProjects();
    }, []);

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
                setNewProject({ name: '', description: '', status: 'planning' });
            }
        } catch (error: any) {
            alert('Error creating project: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this project? It must have no linked workflows.')) return;
        try {
            const response = await apiService.deleteProject(id);
            if (response.success) {
                setProjects(prev => prev.filter(p => p._id !== id));
                if (selectedProject?._id === id) setSelectedProject(null);
            }
        } catch (error: any) {
            alert('Error during deletion: ' + error.message);
        }
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
                {/* Project Grid */}
                <div className="lg:col-span-8 overflow-y-auto pr-2 custom-scrollbar">
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
                                    onClick={() => setSelectedProject(project)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Project Inspector */}
                <div className="lg:col-span-4 h-full">
                    <AnimatePresence mode="wait">
                        {selectedProject ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(selectedProject.status)}`}>
                                        {selectedProject.status}
                                    </div>
                                </div>

                                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                                    <Briefcase size={32} />
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{selectedProject.name}</h2>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">{selectedProject.description || 'No description provided for this project.'}</p>

                                <div className="space-y-6 flex-grow">
                                    <DetailRow label="Created On" icon={<Calendar size={16} />}>
                                        <span className="text-sm font-bold text-slate-700">
                                            {new Date(selectedProject.createdAt).toLocaleDateString()}
                                        </span>
                                    </DetailRow>
                                    <DetailRow label="Last Update" icon={<Clock size={16} />}>
                                        <span className="text-sm font-bold text-slate-700">
                                            {new Date(selectedProject.updatedAt).toLocaleDateString()}
                                        </span>
                                    </DetailRow>
                                </div>

                                <div className="pt-8 border-t border-slate-50 space-y-3">
                                    <Link href={`/admin/workflows?projectId=${selectedProject._id}`} className="block">
                                        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                                            <Layers size={16} />
                                            View Project Workflows
                                        </button>
                                    </Link>
                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                                            <Edit size={14} />
                                            Edit Details
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedProject._id)}
                                            className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-slate-100/30 rounded-3xl border border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-slate-200 border border-slate-100">
                                    <Eye size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-400 tracking-tight">Project Inspector</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Select a project to see its configuration and workflows.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Create New Project</h2>
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
