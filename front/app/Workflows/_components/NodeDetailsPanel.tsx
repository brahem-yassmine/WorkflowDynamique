"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Node } from '@xyflow/react';
import { X, Plus, Trash2, ListChecks, Clock, ShieldAlert, GraduationCap, LayoutGrid, ClipboardType, FilePlus, CheckSquare, ExternalLink, Paperclip, Image as ImageIcon } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiService } from '@/service/api.service';

interface NodeDetailsPanelProps {
    selectedNode: Node | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

// Helper Sub-component
const TabButton = ({ active, onClick, icon, title, subtitle }: any) => (
    <button
        onClick={onClick}
        className={`w-full p-5 rounded-[24px] flex items-center gap-5 transition-all outline-none border-0 text-left ${active ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' : 'bg-transparent text-slate-400 hover:bg-slate-800/50'}`}
    >
        <div className={`p-3 rounded-xl ${active ? 'bg-white/10 text-white' : 'bg-slate-800 text-slate-500 transition-colors'}`}>
            {icon}
        </div>
        <div className="flex flex-col">
            <span className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-300'}`}>{title}</span>
            <span className={`text-[10px] font-bold mt-0.5 ${active ? 'text-indigo-200' : 'text-slate-500'}`}>{subtitle}</span>
        </div>
    </button>
);

const NodeDetailsPanel = ({ selectedNode, onClose, onUpdate, onDelete }: NodeDetailsPanelProps) => {
    const router = useRouter();
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [responsibleDomain, setResponsibleDomain] = useState('');
    const [taskType, setTaskType] = useState('normal');
    const [priority, setPriority] = useState('medium');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [condition, setCondition] = useState('');
    const [domains, setDomains] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [availableForms, setAvailableForms] = useState<any[]>([]);
    const [availableProjects, setAvailableProjects] = useState<any[]>([]);
    const [linkedObjectId, setLinkedObjectId] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [activeTab, setActiveTab] = useState('general');

    // New Fields
    const [domainScope, setDomainScope] = useState<'all' | 'specific'>('specific');
    const [validationType, setValidationType] = useState<'automatic' | 'simple' | 'multi'>('simple');
    const [validatorType, setValidatorType] = useState<'user' | 'role'>('role');
    const [validatorIds, setValidatorIds] = useState<string[]>([]);
    const [assigneeType, setAssigneeType] = useState<'specific' | 'group' | 'all'>('specific');
    const [assigneeSelectionType, setAssigneeSelectionType] = useState<'user' | 'role'>('role');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

    // Board integration state
    const [attachKanban, setAttachKanban] = useState(false);
    const [kanbanBoardId, setKanbanBoardId] = useState('');
    const [kanbanBoards, setKanbanBoards] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [domainsRes, usersRes, rolesRes, formsRes, projectsRes, boardsRes] = await Promise.all([
                    apiService.getDomains(),
                    apiService.getUsers(),
                    apiService.getRoles(),
                    apiService.getForms(),
                    apiService.getProjects(),
                    apiService.getBoards()
                ]);
                if (domainsRes.success) setDomains(domainsRes.data);
                if (usersRes.success) setUsers(usersRes.data);
                if (rolesRes.success) setRoles(rolesRes.data);
                if (formsRes.success) setAvailableForms(formsRes.data);
                if (projectsRes.success) setAvailableProjects(projectsRes.data);
                if (boardsRes.success) setKanbanBoards(boardsRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label as string || '');
            setDescription(selectedNode.data.description as string || '');
            setResponsibleDomain(selectedNode.data.responsibleDomain as string || '');
            setTaskType(selectedNode.data.taskType as string || 'normal');
            setPriority(selectedNode.data.priority as string || 'medium');
            setEstimatedDuration(selectedNode.data.estimatedDuration as string || '');
            setCondition(selectedNode.data.condition as string || '');

            // Set new fields from data or defaults with type safety
            setDomainScope((selectedNode.data.domainScope as 'all' | 'specific') || 'specific');
            setValidationType((selectedNode.data.validationType as 'automatic' | 'simple' | 'multi') || 'simple');
            setValidatorType((selectedNode.data.validatorType as 'user' | 'role') || 'role');
            setValidatorIds((selectedNode.data.validatorIds as string[]) || []);
            setAssigneeType((selectedNode.data.assigneeType as 'specific' | 'group' | 'all') || 'specific');
            setAssigneeSelectionType((selectedNode.data.assigneeSelectionType as 'user' | 'role') || 'role');
            setAssigneeIds((selectedNode.data.assigneeIds as string[]) || []);
            setLinkedObjectId(selectedNode.data.linkedObjectId as string || '');
            setAttachKanban(!!selectedNode.data.attachKanban);
            setKanbanBoardId(selectedNode.data.kanbanBoardId as string || '');
            setAttachments(Array.isArray(selectedNode.data.attachments) ? selectedNode.data.attachments : []);
        }
    }, [selectedNode]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;
            setAttachments(prev => [...prev, {
                filename: file.name,
                url: base64,
                previewUrl: URL.createObjectURL(file), // For reliable opening in new tab before save
                uploadedAt: new Date().toISOString()
            }]);
            setIsUploading(false);
        };
    };

    // Auto-select kanban board if possible
    useEffect(() => {
        if (attachKanban && !kanbanBoardId && label && kanbanBoards.length > 0) {
            const matchingBoard = kanbanBoards.find(b =>
                b.name?.toLowerCase().trim() === label.toLowerCase().trim()
            );
            if (matchingBoard) setKanbanBoardId(matchingBoard._id);
        }
    }, [attachKanban, label, kanbanBoards]);

    const handleCreateBoard = async () => {
        if (!label) {
            alert('Please enter a task name first');
            return;
        }
        try {
            const res = await apiService.request('/boards', {
                method: 'POST',
                body: JSON.stringify({
                    name: label,
                    description: `Automatically created for workflow step: ${label}`
                })
            });
            if (res.success) {
                const newBoard = res.data;
                setKanbanBoards([...kanbanBoards, newBoard]);
                setKanbanBoardId(newBoard._id);
            }
        } catch (err) {
            console.error('Error creating board:', err);
        }
    };

    const handleSave = () => {
        if (selectedNode) {
            onUpdate(selectedNode.id, {
                ...selectedNode.data,
                label,
                description,
                responsibleDomain,
                taskType,
                priority,
                estimatedDuration,
                condition,
                domainScope,
                validationType,
                validatorType,
                validatorIds,
                assigneeType,
                assigneeSelectionType,
                assigneeIds,
                linkedObjectId,
                attachKanban,
                kanbanBoardId,
                attachments
            });
            onClose(); // Close the modal after saving
        }
    };

    const handleDelete = () => {
        if (selectedNode && window.confirm('Are you sure you want to delete this node?')) {
            onDelete(selectedNode.id);
        }
    }

    if (!selectedNode) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in zoom-in-95 duration-300 border border-slate-100">

                {/* Fixed Header (Mobile) or Sidebar Nav (Desktop) */}
                <div className="w-full md:w-80 bg-slate-900 flex flex-col">
                    <div className="p-8 border-b border-slate-800/50">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl w-fit mb-6">
                            <ShieldAlert className="text-indigo-400" size={24} />
                        </div>
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Node Architect</h3>
                        <p className="text-2xl font-black text-white tracking-tight line-clamp-2">
                            {label || 'Untitled Step'}
                        </p>
                    </div>

                    <nav className="flex-grow p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                        <TabButton
                            active={activeTab === 'general'}
                            onClick={() => setActiveTab('general')}
                            icon={<ShieldAlert size={18} />}
                            title="Base Config"
                            subtitle="Label & Instructions"
                        />

                        {selectedNode.type === 'action' && (
                            <>
                                <TabButton
                                    active={activeTab === 'assignment'}
                                    onClick={() => setActiveTab('assignment')}
                                    icon={<GraduationCap size={18} />}
                                    title="Assignment"
                                    subtitle="Team & Resources"
                                />
                                <TabButton
                                    active={activeTab === 'validation'}
                                    onClick={() => setActiveTab('validation')}
                                    icon={<ShieldAlert size={18} />}
                                    title="Validation"
                                    subtitle="Approval Logic"
                                />
                            </>
                        )}

                        {selectedNode.type === 'condition' && (
                            <TabButton
                                active={activeTab === 'logic'}
                                onClick={() => setActiveTab('logic')}
                                icon={<ShieldAlert size={18} />}
                                title="Routing"
                                subtitle="Decision Rules"
                            />
                        )}
                    </nav>

                    <div className="p-8 mt-auto bg-slate-800/20">
                        <Button
                            onClick={handleDelete}
                            variant="ghost"
                            className="w-full h-12 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase text-[10px] tracking-widest transition-all"
                        >
                            <Trash2 size={16} />
                            Destroy Node
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow flex flex-col bg-slate-50/50 relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute right-8 top-8 p-3 hover:bg-slate-200/50 rounded-2xl transition-all z-10 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
                        <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">

                            {/* TAB: GENERAL */}
                            {activeTab === 'general' && (
                                <section className="space-y-12">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tactical Configuration</h2>
                                        <p className="text-slate-400 font-medium">Define the identity and resources for this stage.</p>
                                    </div>

                                    <div className="grid gap-10">
                                        {/* Task Identity */}
                                        <div className="space-y-6">
                                            {selectedNode.type !== 'start' && (
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Task Designation</Label>
                                                    <Input
                                                        value={label}
                                                        onChange={(e) => setLabel(e.target.value)}
                                                        placeholder="ex: HR Validation"
                                                        className="h-14 bg-white border-2 border-slate-100 rounded-2xl font-bold text-lg text-slate-700 focus:ring-indigo-100 shadow-sm"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Operational Instructions</Label>
                                                <Textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Detail the steps to follow..."
                                                    className="bg-white border-2 border-slate-100 rounded-2xl font-medium text-slate-600 focus:ring-indigo-100 min-h-[120px] text-base shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {selectedNode.type !== 'start' && selectedNode.type !== 'condition' && (
                                            <>
                                                {/* Task Type Selection */}
                                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Work Model (Type)</Label>
                                                        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-2">
                                                            <button
                                                                onClick={() => setTaskType('normal')}
                                                                className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${taskType === 'normal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                                            >
                                                                1. Normal
                                                            </button>
                                                            <button
                                                                onClick={() => setTaskType('form')}
                                                                className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${taskType === 'form' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                                            >
                                                                2. Form
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {taskType === 'normal' && (
                                                        <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] space-y-6 animate-in slide-in-from-top-4">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Attachments & Media</Label>
                                                                {isUploading && <Clock className="animate-spin text-indigo-500" size={14} />}
                                                            </div>

                                                            {attachments.length > 0 && (
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {attachments.map((att, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm group">
                                                                            <div className="flex items-center gap-3">
                                                                                <Paperclip size={14} className="text-indigo-500" />
                                                                                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px] font-medium">{att.filename}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <a
                                                                                    href={att.previewUrl || att.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="p-1 text-slate-300 hover:text-indigo-500 transition-colors outline-none h-fit w-fit bg-transparent border-0"
                                                                                >
                                                                                    <ExternalLink size={14} />
                                                                                </a>
                                                                                <button
                                                                                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                                                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors outline-none h-fit w-fit bg-transparent border-0"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="flex gap-4">
                                                                <input
                                                                    type="file"
                                                                    id="node-file-upload"
                                                                    className="hidden"
                                                                    onChange={handleFileUpload}
                                                                />
                                                                <button
                                                                    onClick={() => document.getElementById('node-file-upload')?.click()}
                                                                    className="flex-1 h-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600 outline-none border-0"
                                                                >
                                                                    <ImageIcon size={18} />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Add Media</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => document.getElementById('node-file-upload')?.click()}
                                                                    className="flex-1 h-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600 outline-none border-0"
                                                                >
                                                                    <FilePlus size={18} />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Add Document</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {taskType === 'form' && (
                                                        <div className="space-y-6 animate-in slide-in-from-top-4">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-[11px] font-black text-slate-500 uppercase">Connect a Form</Label>
                                                                <Button
                                                                    onClick={() => router.push('/form')}
                                                                    variant="link"
                                                                    className="text-[10px] font-black text-indigo-600 uppercase"
                                                                >
                                                                    <Plus size={14} className="mr-1" /> Create New Form
                                                                </Button>
                                                            </div>
                                                            <select
                                                                className="w-full h-14 px-4 bg-white border-2 border-indigo-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                                                value={linkedObjectId}
                                                                onChange={(e) => setLinkedObjectId(e.target.value)}
                                                            >
                                                                <option value="">-- Select a form --</option>
                                                                {availableForms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* External Kanban Link */}
                                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Kanban Integration (Optional)</Label>
                                                            <span className="text-[10px] text-slate-400 font-medium">Link a specific board to this stage</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setAttachKanban(!attachKanban)}
                                                            className={`w-14 h-8 rounded-full transition-all relative ${attachKanban ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}
                                                        >
                                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${attachKanban ? 'left-7 shadow-sm' : 'left-1'}`} />
                                                        </button>
                                                    </div>

                                                    {attachKanban && (
                                                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                                            <div className="flex items-center justify-between px-1">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Board</span>
                                                                <button
                                                                    onClick={handleCreateBoard}
                                                                    className="text-[10px] font-black text-emerald-600 uppercase hover:text-emerald-700 flex items-center gap-1"
                                                                >
                                                                    <Plus size={12} /> Auto-Generate Board
                                                                </button>
                                                            </div>
                                                            <select
                                                                className="w-full h-14 px-4 bg-white border-2 border-emerald-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
                                                                value={kanbanBoardId}
                                                                onChange={(e) => setKanbanBoardId(e.target.value)}
                                                            >
                                                                <option value="">-- Choose a Kanban board --</option>
                                                                {kanbanBoards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* TAB: ASSIGNMENT */}
                            {activeTab === 'assignment' && selectedNode.type === 'action' && (
                                <section className="space-y-10">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Responsibility</h2>
                                        <p className="text-slate-400 font-medium">Configure who is authorized to execute this stage.</p>
                                    </div>

                                    <div className="grid gap-10">
                                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Access Scope</Label>
                                                <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-2">
                                                    <button
                                                        onClick={() => setDomainScope('all')}
                                                        className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.1em] rounded-xl transition-all ${domainScope === 'all' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        Global Access
                                                    </button>
                                                    <button
                                                        onClick={() => setDomainScope('specific')}
                                                        className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.1em] rounded-xl transition-all ${domainScope === 'specific' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        Restricted Domain
                                                    </button>
                                                </div>
                                            </div>

                                            {domainScope === 'specific' && (
                                                <div className="animate-in fade-in slide-in-from-top-4">
                                                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-4">Target Organization Unit</Label>
                                                    <select
                                                        className="w-full h-14 px-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100"
                                                        value={responsibleDomain}
                                                        onChange={(e) => setResponsibleDomain(e.target.value)}
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {domains.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Designated Assignees</Label>
                                                <select
                                                    className="w-full h-14 px-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border-none outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100"
                                                    value={assigneeType}
                                                    onChange={(e) => {
                                                        const val = e.target.value as any;
                                                        setAssigneeType(val);
                                                        if (val === 'group') setAssigneeSelectionType('role');
                                                        if (val === 'specific') setAssigneeSelectionType('user');
                                                    }}
                                                >
                                                    <option value="all">Everyone in selected domain</option>
                                                    <option value="group">Specific Roles</option>
                                                    <option value="specific">Nominated Users</option>
                                                </select>
                                            </div>

                                            {assigneeType !== 'all' && (
                                                <div className="animate-in fade-in slide-in-from-top-4 space-y-4">
                                                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                                        Selection Pool ({assigneeType === 'group' ? 'Roles' : 'Individual Users'})
                                                    </Label>
                                                    <select
                                                        multiple
                                                        className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-slate-700 border-none outline-none ring-1 ring-slate-100 min-h-[160px] focus:ring-2 focus:ring-indigo-100 shadow-inner"
                                                        value={assigneeIds}
                                                        onChange={(e) => setAssigneeIds(Array.from(e.target.selectedOptions, o => o.value))}
                                                    >
                                                        {assigneeType === 'group' ? (
                                                            roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)
                                                        ) : (
                                                            users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)
                                                        )}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Priority Grade</Label>
                                                <select
                                                    className="w-full h-14 px-4 bg-white rounded-2xl font-bold text-slate-700 border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                                    value={priority}
                                                    onChange={(e) => setPriority(e.target.value)}
                                                >
                                                    <option value="low">Low Priority</option>
                                                    <option value="medium">Standard</option>
                                                    <option value="high">High Priority</option>
                                                    <option value="critical">Mission Critical</option>
                                                </select>
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Estimated TTL</Label>
                                                <div className="relative">
                                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <Input
                                                        value={estimatedDuration}
                                                        onChange={(e) => setEstimatedDuration(e.target.value)}
                                                        placeholder="e.g., 2h 30m"
                                                        className="h-14 pl-14 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* TAB: VALIDATION */}
                            {activeTab === 'validation' && selectedNode.type === 'action' && (
                                <section className="space-y-10">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Validation Matrix</h2>
                                        <p className="text-slate-400 font-medium">Determine the criteria for step completion and approval.</p>
                                    </div>

                                    <div className="space-y-8 bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
                                        <div className="space-y-6">
                                            <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Approval Strategy</Label>
                                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-2 rounded-2xl">
                                                {(['automatic', 'simple', 'multi'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setValidationType(type)}
                                                        className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${validationType === type ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100/50' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {validationType !== 'automatic' && (
                                            <div className="animate-in fade-in slide-in-from-top-4 space-y-8 pt-8 border-t border-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Qualified Validators</Label>
                                                    <div className="flex bg-slate-100/50 p-1 rounded-xl">
                                                        <button
                                                            onClick={() => setValidatorType('role')}
                                                            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${validatorType === 'role' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                                        >
                                                            Roles
                                                        </button>
                                                        <button
                                                            onClick={() => setValidatorType('user')}
                                                            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${validatorType === 'user' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                                        >
                                                            Users
                                                        </button>
                                                    </div>
                                                </div>

                                                <select
                                                    multiple
                                                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 min-h-[200px] outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100 shadow-inner"
                                                    value={validatorIds}
                                                    onChange={(e) => setValidatorIds(Array.from(e.target.selectedOptions, o => o.value))}
                                                >
                                                    {validatorType === 'role' ? roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>) : users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                                                </select>

                                                <div className="p-6 bg-slate-900 rounded-3xl flex items-center gap-4 border border-slate-800 shadow-xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                                        <ShieldAlert className="text-indigo-400" size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">
                                                            {validationType === 'multi' ? 'Consensus Required' : 'Solo Approval'}
                                                        </p>
                                                        <p className="text-slate-400 text-xs mt-1">
                                                            {validationType === 'multi' ? 'Every selected party must authorize the transition.' : 'Any single individual from the group can authorize.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* TAB: ROUTING (Condition Node) */}
                            {activeTab === 'logic' && selectedNode.type === 'condition' && (
                                <section className="space-y-10">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dynamic Routing</h2>
                                        <p className="text-slate-400 font-medium">Assign a logical rule to determine the flow path.</p>
                                    </div>

                                    <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl space-y-10 text-left border border-slate-800">
                                        <div className="flex items-center gap-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 w-fit">
                                            <ShieldAlert className="text-indigo-400" size={24} />
                                            <span className="text-indigo-200 font-black text-[10px] uppercase tracking-widest">Logic Engine v4.0</span>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Structural Rule (Variables)</Label>
                                            <Input
                                                value={condition}
                                                onChange={(e) => setCondition(e.target.value)}
                                                placeholder="invoice_val > 5000"
                                                className="h-16 bg-slate-800 border-none rounded-2xl font-mono text-2xl text-emerald-400 focus:ring-2 focus:ring-emerald-500 shadow-inner px-8"
                                            />
                                            <p className="text-slate-500 text-sm font-medium italic">Example: department == 'Finance' && total &gt; 1000</p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-8 px-12 bg-white border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Lattice OS Configurator</p>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                Save Changes
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse"></div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeDetailsPanel;
