"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Node } from '@xyflow/react';
import { X, Plus, Trash2, ListChecks, Clock, ShieldAlert, Shield, Users, GraduationCap, LayoutGrid, ClipboardType, FilePlus, CheckSquare, ExternalLink, Paperclip, Image as ImageIcon, Check, Save } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiService } from '@/service/api.service';
import { motion, AnimatePresence } from 'framer-motion';
import { showAlert, showConfirm } from '@/lib/alerts';
import { toast } from 'sonner';

interface NodeDetailsPanelProps {
    selectedNode: Node | null;
    allNodes?: Node[];
    workflowId?: string | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
    initialTab?: string;
}

// Helper Sub-component
const TabButton = ({ active, onClick, icon, title, subtitle }: any) => (
    <motion.button
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-full p-5 rounded-[24px] flex items-center gap-5 transition-all outline-none border-0 text-left relative overflow-hidden group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-transparent text-slate-400 hover:bg-slate-800/40'}`}
    >
        {active && (
            <motion.div
                layoutId="active-tab-glow"
                className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
            />
        )}
        <div className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-white/20 text-white rotate-0' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
            {icon}
        </div>
        <div className="flex flex-col">
            <span className={`text-[11px] font-black uppercase tracking-widest leading-none ${active ? 'text-white' : 'text-slate-300'}`}>{title}</span>
            <span className={`text-[9px] font-bold mt-1 uppercase tracking-tight opacity-60 ${active ? 'text-indigo-200' : 'text-slate-500'}`}>{subtitle}</span>
        </div>
    </motion.button>
);

const NodeDetailsPanel = ({ selectedNode, allNodes, workflowId, initialTab, onClose, onUpdate, onDelete }: NodeDetailsPanelProps) => {
    const router = useRouter();
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [responsibleDomain, setResponsibleDomain] = useState('');
    const [taskType, setTaskType] = useState('');
    const [priority, setPriority] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [condition, setCondition] = useState('');
    const [domains, setDomains] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [restrictedDomain, setRestrictedDomain] = useState('');
    const [availableForms, setAvailableForms] = useState<any[]>([]);
    const [availableProjects, setAvailableProjects] = useState<any[]>([]);
    const [linkedObjectId, setLinkedObjectId] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [availableChecklists, setAvailableChecklists] = useState<any[]>([]);
    const [availableVariables, setAvailableVariables] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState(initialTab || 'general');

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

    // User's requested fields
    const [assignmentType, setAssignmentType] = useState<'ANY' | 'ALL' | 'SINGLE'>('SINGLE');
    const [taskContent, setTaskContent] = useState<string[]>([]);
    const [userAction, setUserAction] = useState<string[]>([]);
    const [assignedTo, setAssignedTo] = useState<string>(''); // For Department or User ID
    const [deadline, setDeadline] = useState('');

    // Authority Enforcement State
    const [requiredDomain, setRequiredDomain] = useState('');
    const [requiredModule, setRequiredModule] = useState('');
    const [requiredAction, setRequiredAction] = useState('approve');
    const [allWorkModules, setAllWorkModules] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [domainsRes, usersRes, rolesRes, formsRes, projectsRes, boardsRes, checklistsRes, modulesRes] = await Promise.all([
                    apiService.getDomains(),
                    apiService.getUsers(),
                    apiService.getRoles(),
                    apiService.getForms(),
                    apiService.getProjects(),
                    apiService.getBoards(),
                    apiService.request('/checklists'),
                    apiService.getModules()
                ]);
                setDomains(domainsRes.success ? domainsRes.data : (Array.isArray(domainsRes) ? domainsRes : []));
                const fetchedUsers = usersRes.success ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []);
                setUsers(fetchedUsers);
                setRoles(rolesRes.success ? rolesRes.data : (Array.isArray(rolesRes) ? rolesRes : []));
                
                const loadedForms = formsRes.success ? formsRes.data : (Array.isArray(formsRes) ? formsRes : []);
                setAvailableForms(loadedForms);
                setAvailableProjects(projectsRes.success ? projectsRes.data : (Array.isArray(projectsRes) ? projectsRes : []));
                setKanbanBoards(boardsRes.success ? boardsRes.data : (Array.isArray(boardsRes) ? boardsRes : []));
                setAvailableChecklists(checklistsRes.success ? checklistsRes.data : (Array.isArray(checklistsRes) ? checklistsRes : []));
                setAllWorkModules(modulesRes.success ? modulesRes.data : (Array.isArray(modulesRes) ? modulesRes : []));

                // Process available variables from forms in allNodes
                if (allNodes) {
                    const vars: any[] = [];
                    for (const node of allNodes) {
                        if (node.type === 'action' && node.data?.linkedObjectId) {
                            const formId = node.data.linkedObjectId;
                            const form = loadedForms.find((f: any) => f._id === formId || f.id === formId);
                            if (form && Array.isArray(form.fields)) {
                                form.fields.forEach((field: any) => {
                                    if (field.name) {
                                        vars.push({
                                            name: field.name,
                                            label: field.label,
                                            nodeLabel: node.data.label,
                                            formTitle: form.title
                                        });
                                    }
                                });
                            }
                        }
                    }
                    setAvailableVariables(vars);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, [allNodes]);

    useEffect(() => {
        console.log('[DEBUG] Users in state:', users);
        console.log('[DEBUG] Filter params:', { domainScope, responsibleDomain });
    }, [users, domainScope, responsibleDomain]);

    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label as string || '');
            setDescription(selectedNode.data.description as string || '');
            const rDomain = selectedNode.data.responsibleDomain as string || '';
            setResponsibleDomain(rDomain);
            setRestrictedDomain(selectedNode.data.restrictedDomain as string || '');
            setTaskType(selectedNode.data.taskType as string || '');
            setPriority(selectedNode.data.priority as string || '');
            setEstimatedDuration(selectedNode.data.estimatedDuration as string || '');
            setCondition(selectedNode.data.condition as string || '');

            // Infer domain scope from domain name if needed
            const isGlobal = ['GLOBAL', 'ALL', 'PUBLIC', 'TOUS'].includes(rDomain.toUpperCase());
            const currentScope = isGlobal ? 'all' : ((selectedNode.data.domainScope as 'all' | 'specific') || 'specific');
            setDomainScope(currentScope);
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

            let aType = (selectedNode.data.assignmentType as 'ANY' | 'ALL' | 'SINGLE') || 'SINGLE';
            if (currentScope === 'all' && aType === 'SINGLE') {
                aType = 'ALL';
            }
            setAssignmentType(aType);
            const savedContent = selectedNode.data.taskContent;
            if (Array.isArray(savedContent)) {
                setTaskContent(savedContent);
            } else if (savedContent) {
                setTaskContent([savedContent as string]);
            } else {
                setTaskContent([]);
            }
            const savedAction = selectedNode.data.userAction;
            if (Array.isArray(savedAction)) {
                setUserAction(savedAction);
            } else if (savedAction) {
                setUserAction([savedAction as string]);
            } else {
                setUserAction([]);
            }
            setAssignedTo(selectedNode.data.assignedTo as string || '');
            setDeadline(selectedNode.data.deadline as string || '');

            // Initialize Authority
            setRequiredDomain(selectedNode.data.requiredDomain as string || '');
            setRequiredModule(selectedNode.data.requiredModule as string || '');
            setRequiredAction(selectedNode.data.requiredAction as string || 'approve');
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
                previewUrl: URL.createObjectURL(file),
                uploadedAt: new Date().toISOString()
            }]);
            setIsUploading(false);
        };
    };

    useEffect(() => {
        if (attachKanban && !kanbanBoardId && label && kanbanBoards.length > 0) {
            const matchingBoard = kanbanBoards.find(b =>
                b.name?.toLowerCase().trim() === label.toLowerCase().trim()
            );
            if (matchingBoard) setKanbanBoardId(matchingBoard._id);
        }
    }, [attachKanban, label, kanbanBoards]);

    const handleCreateBoard = () => {
        if (!label || !selectedNode) {
            showAlert('Stage Name Required', 'Please enter a stage name first to use as board title', 'warning');
            return;
        }

        // Include the node ID and tab so we return to it automatically
        const baseUrl = window.location.href.split('?')[0];
        const search = new URLSearchParams(window.location.search);
        search.set('designerNodeId', selectedNode.id);
        search.set('designerTab', activeTab);
        
        const returnUrl = encodeURIComponent(`${baseUrl}?${search.toString()}`);
        const targetUrl = `/kanban?fromWorkflow=true&designerWorkflowId=${workflowId || ''}&boardName=${encodeURIComponent(label)}&returnUrl=${returnUrl}`;
        
        router.push(targetUrl);
    };

    const handleSave = () => {
        if (selectedNode) {
            onUpdate(selectedNode.id, {
                ...selectedNode.data,
                label,
                description,
                responsibleDomain,
                restrictedDomain,
                taskType,
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
                attachments,
                assignmentType,
                taskContent,
                userAction,
                assignedTo
            });

            toast.success("task updated", {
                description: `Digital logic for '${label}' has been synchronized.`,
                icon: <Check size={18} className="text-emerald-500" />
            });

            onClose();
        }
    };

    const handleSaveWithValidation = async () => {
        if (validationType === 'multi' && validatorIds.length < 2) {
            await showAlert('Validation Error', 'Consensus (Multi) validation strategy requires at least 2 validators.', 'warning');
            return;
        }
        handleSave();
    };

    const handleDelete = async () => {
        if (selectedNode) {
            const confirmed = await showConfirm({
                title: 'Delete Node',
                text: 'Are you sure you want to delete this node?',
                confirmButtonText: 'Yes, Delete',
                danger: true
            });
            if (confirmed) {
                onDelete(selectedNode.id);
            }
        }
    }

    if (!selectedNode) return null;

    return (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-[1200px] h-[90vh] bg-white rounded-[40px] shadow-2xl flex overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* NAVIGATION SIDEBAR */}
                <div className="w-[320px] h-full bg-slate-900 p-8 flex flex-col shrink-0 border-r border-slate-800 z-20">
                    <div className="flex items-center gap-4 mb-12 px-2 flex-none">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <LayoutGrid className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight">Stage details</h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{selectedNode.type} Node</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                        <TabButton
                            active={activeTab === 'general'}
                            onClick={() => setActiveTab('general')}
                            icon={<LayoutGrid size={20} />}
                            title="Base Config"
                            subtitle="Identity & Type"
                        />
                        {selectedNode.type === 'action' && (
                            <>
                                <TabButton
                                    active={activeTab === 'assignment'}
                                    onClick={() => setActiveTab('assignment')}
                                    icon={<Users size={20} />}
                                    title="Assignment"
                                    subtitle="Responsible parties"
                                />
                                <TabButton
                                    active={activeTab === 'validation'}
                                    onClick={() => setActiveTab('validation')}
                                    icon={<ShieldAlert size={20} />}
                                    title="Validation"
                                    subtitle="Approval rules"
                                />
                                <TabButton
                                    active={activeTab === 'config'}
                                    onClick={() => setActiveTab('config')}
                                    icon={<ClipboardType size={20} />}
                                    title="Content & Action"
                                    subtitle="Task UI & Behavior"
                                />
                            </>
                        )}
                        {selectedNode.type === 'condition' && (
                            <TabButton
                                active={activeTab === 'logic'}
                                onClick={() => setActiveTab('logic')}
                                icon={<ShieldAlert size={20} />}
                                title="Routing Logic"
                                subtitle="Decision Rules"
                            />
                        )}
                    </div>

                    <div className="pt-8 mt-6 border-t border-slate-800/50 flex-none">
                        <Button
                            variant="ghost"
                            onClick={handleDelete}
                            className="w-full justify-start h-14 px-6 rounded-2xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-4 font-black transition-all"
                        >
                            <Trash2 size={16} />
                            Destroy Node
                        </Button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 h-full flex flex-col bg-slate-50 relative min-w-0">
                    <button
                        onClick={onClose}
                        className="absolute right-8 top-8 p-3 hover:bg-slate-200/50 rounded-2xl transition-all z-20 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white/50 min-h-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-2xl mx-auto space-y-12"
                            >

                                {/* TAB: GENERAL */}
                                {activeTab === 'general' && (
                                    <section className="space-y-12">
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tactical Configuration</h2>
                                            <p className="text-slate-400 font-medium">Define the identity and resources for this stage.</p>
                                        </div>

                                        <div className="grid gap-10">
                                            <div className="space-y-6">
                                                {selectedNode.type !== 'start' && (
                                                    <div className="space-y-3">
                                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-[#6366f1]">Stage Name</Label>
                                                        <Input
                                                            value={label}
                                                            onChange={(e) => setLabel(e.target.value)}
                                                            className="h-16 px-8 bg-white border-none rounded-[20px] font-bold text-lg text-slate-700 ring-1 ring-slate-100 focus:ring-4 focus:ring-indigo-100 shadow-sm transition-all"
                                                            placeholder="Enter stage name..."
                                                        />
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-[#6366f1]">Internal Description</Label>
                                                    <Textarea
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        className="min-h-[140px] p-8 bg-white border-none rounded-[24px] font-medium text-slate-600 ring-1 ring-slate-100 focus:ring-4 focus:ring-indigo-100 shadow-sm transition-all leading-relaxed"
                                                        placeholder="Describe the purpose of this stage..."
                                                    />
                                                </div>
                                            </div>

                                            {selectedNode.type === 'action' && (
                                                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-fuchsia-500/10 rounded-2xl text-fuchsia-600">
                                                            <LayoutGrid size={20} />
                                                        </div>
                                                        <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-fuchsia-600">Kanban Integration</Label>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                            <span className="text-xs font-bold text-slate-600">Auto-create board for this stage</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={attachKanban}
                                                                onChange={(e) => setAttachKanban(e.target.checked)}
                                                                className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                                            />
                                                        </div>

                                                        {attachKanban && (
                                                            <div className="animate-in fade-in slide-in-from-top-4 space-y-4 pt-4 border-t border-slate-50">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black text-slate-400 uppercase">Linked Workspace Board</Label>
                                                                    <select
                                                                        className="w-full h-14 px-4 bg-white rounded-2xl font-bold text-slate-700 border-none outline-none ring-1 ring-slate-100 shadow-inner"
                                                                        value={kanbanBoardId}
                                                                        onChange={(e) => setKanbanBoardId(e.target.value)}
                                                                    >
                                                                        <option value="">-- No board attached --</option>
                                                                        {kanbanBoards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                                                    </select>
                                                                </div>

                                                                <Button
                                                                    onClick={handleCreateBoard}
                                                                    className="w-full h-14 bg-indigo-50 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-200/50 flex items-center justify-center gap-3"
                                                                >
                                                                    <Plus size={18} />
                                                                    Instantiate New Board
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
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
                                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-[#6366f1]">1. Organization Scope</Label>
                                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setDomainScope('all');
                                                                setResponsibleDomain('GLOBAL');
                                                                setAssignmentType('ALL');
                                                                setAssignedTo('');
                                                            }}
                                                            className={`flex-1 py-4 text-xs font-black tracking-[0.1em] rounded-xl transition-all ${domainScope === 'all' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            Global access
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
                                                    <div className="animate-in fade-in slide-in-from-top-4 space-y-3">
                                                        <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Select Target Domain</Label>
                                                        <select
                                                            className="w-full h-14 px-4 bg-slate-50 rounded-2xl font-bold text-slate-700 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all appearance-none cursor-pointer"
                                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='3' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.2rem' }}
                                                            value={restrictedDomain}
                                                            onChange={(e) => setRestrictedDomain(e.target.value)}
                                                        >
                                                            <option value="">-- Choose Domain --</option>
                                                            <option value="Standard">Standard</option>
                                                            {domains.map(d => <option key={d._id || d.id} value={d.name}>{d.name}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
                                                {true && (
                                                    <>
                                                        <div className="space-y-4">
                                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-[#6366f1]">2. Assignment Strategy</Label>
                                                            <div className={`grid ${domainScope === 'all' ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
                                                                {[
                                                                    { id: 'SINGLE', label: 'INDIVIDUAL', icon: <Users size={16} />, desc: 'One person' },
                                                                    { id: 'ANY', label: 'POOL (ANY)', icon: <Users size={16} />, desc: 'First claim' },
                                                                    { id: 'ALL', label: 'TEAM (ALL)', icon: <GraduationCap size={16} />, desc: 'Consensus' }
                                                                ].filter(opt => domainScope !== 'all' || opt.id !== 'SINGLE').map((opt: any) => (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        key={opt.id}
                                                                        onClick={() => setAssignmentType(opt.id)}
                                                                        className={`flex flex-col items-center justify-center p-5 rounded-[24px] border-2 transition-all gap-2 text-center ${assignmentType === opt.id
                                                                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-lg shadow-indigo-100 ring-2 ring-indigo-500/20'
                                                                            : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                                                                            }`}
                                                                    >
                                                                        <div className={`p-2.5 rounded-xl transition-all ${assignmentType === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'
                                                                            }`}>
                                                                            {opt.icon}
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <span className="text-[9px] font-black uppercase tracking-wider">{opt.label}</span>
                                                                            <p className="text-[7px] font-black opacity-60 uppercase">{opt.desc}</p>
                                                                        </div>
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {assignmentType !== 'ALL' && domainScope !== 'all' && (
                                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-[#6366f1]">3. Target Selection</Label>
                                                                <div className="flex bg-slate-50 p-1 rounded-2xl gap-1">
                                                                    <button
                                                                        onClick={() => setAssigneeSelectionType('role')}
                                                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${assigneeSelectionType === 'role' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                                                    >
                                                                        By Role
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setAssigneeSelectionType('user')}
                                                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${assigneeSelectionType === 'user' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                                                    >
                                                                        By User
                                                                    </button>
                                                                </div>

                                                                {assigneeSelectionType === 'role' ? (
                                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                        <select
                                                                            className="w-full h-16 px-6 bg-slate-50 rounded-[22px] font-bold text-slate-700 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                                                                            value={responsibleDomain}
                                                                            onChange={(e) => {
                                                                                const selectedValue = e.target.value;
                                                                                setResponsibleDomain(selectedValue);
                                                                                // Also set assignedTo to the role ID for backend compatibility
                                                                                const role = roles.find(r => r.name === selectedValue || r._id === selectedValue);
                                                                                if (role) {
                                                                                    setAssignedTo(role._id);
                                                                                    toast.success(`Strategy synchronized: Assigned to Role '${role.name}'`);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <option value="">-- Select Specific Role --</option>

                                                                            {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                                                                        </select>
                                                                        <p className="text-[9px] font-bold text-slate-400 italic px-2">Tasks will be visible to all users assigned this specific role or enterprise scope.</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                        <select
                                                                            className="w-full h-16 px-6 bg-slate-50 rounded-[22px] font-bold text-slate-700 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                                                                            value={assignedTo}
                                                                            onChange={(e) => {
                                                                                const userId = e.target.value;
                                                                                setAssignedTo(userId);
                                                                                const selectedUser = users.find(u => (u._id || u.id) === userId);
                                                                                if (selectedUser) {
                                                                                    toast.success(`Identity linked: ${selectedUser.firstName} ${selectedUser.lastName} selected`, {
                                                                                        description: 'Lattice assignment updated locally.',
                                                                                    });
                                                                                }
                                                                            }}
                                                                        >
                                                                            <option value="">-- Select Specific Member --</option>
                                                                            {users.map((u, idx) => (
                                                                                <option key={u._id || idx} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
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

                                        <div className="space-y-12 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl">
                                            <div className="space-y-6">
                                                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-indigo-600">1. Approval Strategy</Label>
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
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-8 animate-in fade-in slide-in-from-top-4"
                                                >
                                                    <div className="space-y-4">
                                                        <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-indigo-600">2. Validator Type</Label>
                                                        <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-2">
                                                            <button
                                                                onClick={() => setValidatorType('role')}
                                                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${validatorType === 'role' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                            >
                                                                Roles
                                                            </button>
                                                            <button
                                                                onClick={() => setValidatorType('user')}
                                                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${validatorType === 'user' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                            >
                                                                Users
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-indigo-600">3. Select Validators</Label>
                                                        <div className={`w-full bg-slate-50 rounded-[24px] overflow-hidden outline-none ring-1 ring-slate-100 focus-within:ring-4 focus-within:ring-indigo-100 shadow-inner transition-all flex flex-col min-h-[220px] max-h-[300px]`}>
                                                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                                {validatorType === 'role'
                                                                    ? roles.map(r => {
                                                                        const isSelected = validationType === 'multi' ? validatorIds.includes(r._id || r.id) : validatorIds[0] === (r._id || r.id);
                                                                        return (
                                                                            <div 
                                                                                key={r._id || r.id} 
                                                                                onClick={() => {
                                                                                    const id = r._id || r.id;
                                                                                    if (validationType === 'multi') {
                                                                                        if (isSelected) setValidatorIds(validatorIds.filter(vId => vId !== id));
                                                                                        else setValidatorIds([...validatorIds, id]);
                                                                                    } else {
                                                                                        if (!isSelected) setValidatorIds([id]);
                                                                                    }
                                                                                }}
                                                                                className={`p-3.5 px-5 rounded-[16px] cursor-pointer font-bold transition-all text-sm flex items-center justify-between ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-[0.98]' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                                                                            >
                                                                                <span>{r.name}</span>
                                                                                {isSelected && <Check size={18} strokeWidth={3} />}
                                                                            </div>
                                                                        );
                                                                    })
                                                                    : users.map(u => {
                                                                        const isSelected = validationType === 'multi' ? validatorIds.includes(u._id || u.id) : validatorIds[0] === (u._id || u.id);
                                                                        return (
                                                                            <div 
                                                                                key={u._id || u.id} 
                                                                                onClick={() => {
                                                                                    const id = u._id || u.id;
                                                                                    if (validationType === 'multi') {
                                                                                        if (isSelected) setValidatorIds(validatorIds.filter(vId => vId !== id));
                                                                                        else setValidatorIds([...validatorIds, id]);
                                                                                    } else {
                                                                                        if (!isSelected) setValidatorIds([id]);
                                                                                    }
                                                                                }}
                                                                                className={`p-3.5 px-5 rounded-[16px] cursor-pointer font-bold transition-all text-sm flex items-center justify-between ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-[0.98]' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                                                                            >
                                                                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 min-w-0">
                                                                                    <span className="truncate">{u.firstName} {u.lastName}</span>
                                                                                    <span className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>({u.email})</span>
                                                                                </div>
                                                                                {isSelected && <Check size={18} strokeWidth={3} className="shrink-0" />}
                                                                            </div>
                                                                        );
                                                                    })
                                                                }
                                                                {(validatorType === 'role' ? roles : users).length === 0 && (
                                                                    <div className="text-center p-10 text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">
                                                                        No {validatorType}s available
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {validationType === 'multi' && (
                                                            <p className="text-[9px] font-bold text-slate-400 italic px-2">Click multiple items to toggle their selection.</p>
                                                        )}
                                                    </div>

                                                    <div className="p-8 bg-slate-900 rounded-[32px] flex items-center gap-6 border border-slate-800 shadow-2xl">
                                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                            <ShieldAlert className="text-indigo-400" size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-black text-base tracking-tight">
                                                                {validationType === 'multi' ? 'Consensus Required' : 'Solo Approval'}
                                                            </p>
                                                            <p className="text-slate-400 text-xs mt-1 leading-relaxed font-medium">
                                                                {validationType === 'multi'
                                                                    ? 'Every selected party must authorize the transition before it is considered valid.'
                                                                    : 'Any single individual from the selected group can authorize the transition.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* TAB: CONTENT & ACTION */}
                                {activeTab === 'config' && (
                                    <section className="space-y-10">
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Content & Interaction</h2>
                                            <p className="text-slate-400 font-medium">Define what the user sees and what they must do.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600">
                                                        <ClipboardType size={16} />
                                                    </div>
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-indigo-600 font-black">1. Task Content (Admin-provided)</Label>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { id: 'Form', icon: <ListChecks size={14} />, desc: 'Capture data' },
                                                        { id: 'Document', icon: <FilePlus size={14} />, desc: 'PDF / Docs' },
                                                        { id: 'Image', icon: <ImageIcon size={14} />, desc: 'Visuals' },
                                                        { id: 'Text', icon: <ClipboardType size={14} />, desc: 'Read-only' }
                                                    ].map((opt) => {
                                                        const isSelected = taskContent.includes(opt.id);
                                                        return (
                                                            <motion.button
                                                                whileHover={{ scale: 1.02, translateY: -2 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                key={opt.id}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setTaskContent(taskContent.filter(c => c !== opt.id));
                                                                    } else {
                                                                        setTaskContent([...taskContent, opt.id]);
                                                                    }
                                                                }}
                                                                className={`relative flex items-center gap-3 p-3.5 rounded-[24px] transition-all border-2 text-left overflow-hidden ${isSelected
                                                                    ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100 ring-2 ring-indigo-500/10'
                                                                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                                                                    }`}
                                                            >
                                                                {isSelected && (
                                                                    <motion.div
                                                                        layoutId={`active-content-bg-${opt.id}`}
                                                                        className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"
                                                                    />
                                                                )}
                                                                <div className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${isSelected
                                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                                                    }`}>
                                                                    {opt.icon}
                                                                </div>
                                                                <div className="flex flex-col items-start min-w-0">
                                                                    <span className={`text-[10px] font-black uppercase tracking-wider truncate w-full ${isSelected ? 'text-indigo-900' : 'text-slate-500'
                                                                        }`}>{opt.id}</span>
                                                                    <span className={`text-[7px] font-black uppercase opacity-60 truncate w-full ${isSelected ? 'text-indigo-600' : 'text-slate-300'
                                                                        }`}>{opt.desc}</span>
                                                                </div>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>

                                                {taskContent.includes('Form') && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] font-black text-slate-400 uppercase">Link Form</Label>
                                                            <button
                                                                onClick={() => {
                                                                    // Save the node state to the workflow canvas so the draft isn't lost
                                                                    handleSave();
                                                                    
                                                                    router.push(`/form?designerNodeId=${selectedNode.id}&designerTab=config${workflowId ? `&designerWorkflowId=${workflowId}` : ''}&fromWorkflow=true`);
                                                                }}
                                                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors group"
                                                            >
                                                                <Plus size={12} className="group-hover:rotate-90 transition-transform" />
                                                                Create New Form
                                                            </button>
                                                        </div>
                                                        <select
                                                            className="w-full h-14 px-6 bg-slate-50/80 rounded-[20px] font-bold text-slate-800 border-none outline-none ring-1 ring-slate-100 focus:ring-4 focus:ring-indigo-500/10 shadow-inner transition-all appearance-none"
                                                            value={linkedObjectId}
                                                            onChange={(e) => setLinkedObjectId(e.target.value)}
                                                        >
                                                            <option value="">-- Choose Existing Form --</option>
                                                            {Array.isArray(availableForms) && availableForms.map(f => (
                                                                <option key={f._id || f.id} value={f._id || f.id}>{f.title || f.name || 'Untitled Form'}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-[8px] font-bold text-slate-400 italic">Select a form that users will fill during this stage.</p>
                                                    </div>
                                                )}

                                                {(taskContent.includes('Document') || taskContent.includes('Image')) && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                                        <input type="file" id="content-file-upload-2" className="hidden" onChange={handleFileUpload} />
                                                        <Button
                                                            onClick={() => document.getElementById('content-file-upload-2')?.click()}
                                                            className="w-full h-14 bg-white border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center gap-3 text-indigo-600 font-bold hover:bg-indigo-50 transition-all font-black uppercase text-[10px] tracking-widest"
                                                        >
                                                            <Plus size={18} />
                                                            Import {taskContent.filter(c => ['Document', 'Image'].includes(c)).join(' / ')}
                                                        </Button>

                                                        {attachments.length > 0 && (
                                                            <div className="grid grid-cols-1 gap-2 mt-4">
                                                                {attachments.map((att, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            {att.url?.startsWith('data:image') ? <ImageIcon size={14} className="text-indigo-500" /> : <Paperclip size={14} className="text-indigo-500" />}
                                                                            <span className="text-[10px] font-bold text-slate-600 truncate">{att.filename}</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {taskContent.includes('Text') && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 space-y-4 pt-4 border-t border-slate-50">
                                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-[#6366f1]">Task Instructions / Text Content</Label>
                                                        <Textarea
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            placeholder="Enter the read-only text or instructions for the user..."
                                                            className="min-h-[120px] bg-slate-50 border-none rounded-xl p-6 font-medium text-slate-600 focus:ring-4 focus:ring-indigo-100 transition-all leading-relaxed"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                                                        <CheckSquare size={16} />
                                                    </div>
                                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-emerald-600 font-black">2. Targeted Action (Required from User)</Label>
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        { id: 'Fill Form', icon: <ListChecks size={16} />, desc: 'Link dynamic forms' },
                                                        { id: 'Upload File', icon: <FilePlus size={16} />, desc: 'Evidence submission' },
                                                        { id: 'Upload Image', icon: <ImageIcon size={16} />, desc: 'Image submission' },
                                                        { id: 'Write Report', icon: <ClipboardType size={16} />, desc: 'Detailed feedback' },
                                                    ].map((opt) => (
                                                        <motion.button
                                                            whileHover={{ x: 6, scale: 1.01 }}
                                                            whileTap={{ scale: 0.99 }}
                                                            key={opt.id}
                                                            onClick={() => {
                                                                if (userAction.includes(opt.id)) {
                                                                    setUserAction(userAction.filter(a => a !== opt.id));
                                                                } else {
                                                                    setUserAction([...userAction, opt.id]);
                                                                }
                                                            }}
                                                            className={`w-full flex items-center justify-between p-5 rounded-[28px] transition-all border-2 group ${userAction.includes(opt.id)
                                                                ? 'border-emerald-500 bg-emerald-50/50 shadow-xl shadow-emerald-100 ring-4 ring-emerald-500/5'
                                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                                <div className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${userAction.includes(opt.id)
                                                                    ? 'bg-emerald-600 text-white shadow-md'
                                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                                                    }`}>
                                                                    {opt.icon}
                                                                </div>
                                                                <div className="flex flex-col items-start min-w-0">
                                                                    <span className={`text-[10px] font-black uppercase tracking-wider truncate w-full ${userAction.includes(opt.id) ? 'text-emerald-900' : 'text-slate-500'
                                                                        }`}>{opt.id}</span>
                                                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tight opacity-60 truncate w-full">{opt.desc}</span>
                                                                </div>
                                                            </div>
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${userAction.includes(opt.id) ? 'bg-emerald-600 scale-100 rotate-0 shadow-lg' : 'bg-slate-100 scale-50 opacity-0 rotate-45'
                                                                }`}>
                                                                <CheckSquare size={14} className="text-white" />
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>

                                                {userAction.includes('Fill Form') && (
                                                    <div className="pt-8 mt-8 border-t border-slate-100 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Connect Workflow Resource</Label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const role = window.location.pathname.includes('/admin/') ? 'admin' : (window.location.pathname.includes('/User/') ? 'user' : '');
                                                                    router.push(`/form${workflowId ? `?designerWorkflowId=${workflowId}&from=${role}&fromWorkflow=true&designerNodeId=${selectedNode?.id}` : `?from=${role}&fromWorkflow=true&designerNodeId=${selectedNode?.id}`}`);
                                                                }}
                                                                className="text-indigo-600 font-black text-[10px] uppercase tracking-widest gap-2"
                                                            >
                                                                <Plus size={14} /> New Form
                                                            </Button>
                                                        </div>
                                                        <select
                                                            className="w-full h-14 px-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100"
                                                            value={linkedObjectId}
                                                            onChange={(e) => setLinkedObjectId(e.target.value)}
                                                        >
                                                            <option value="">-- Choose Existing Form --</option>
                                                            {availableForms.map(f => (
                                                                <option key={f._id} value={f._id}>{f.title || f.name || 'Unnamed Form'}</option>
                                                            ))}
                                                        </select>

                                                        {linkedObjectId && (
                                                            <div className="p-6 bg-emerald-50 rounded-2xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-white rounded-xl text-emerald-500 shadow-sm">
                                                                        <ClipboardType size={18} />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-emerald-900">Form Connected</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const role = window.location.pathname.includes('/admin/') ? 'admin' : (window.location.pathname.includes('/User/') ? 'user' : '');
                                                                        router.push(`/form/form2?id=${linkedObjectId}${workflowId ? `&designerWorkflowId=${workflowId}&role=${role}` : `&role=${role}`}&fromWorkflow=true&designerNodeId=${selectedNode?.id}`);
                                                                    }}
                                                                    className="text-emerald-600 font-black text-[10px] uppercase tracking-widest gap-2"
                                                                >
                                                                    Edit Form <ExternalLink size={14} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {taskType === 'checklist' && (
                                                    <div className="pt-8 mt-8 border-t border-slate-100 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Connect Checklist</Label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const role = window.location.pathname.includes('/admin/') ? 'admin' : 'User';
                                                                    const basePath = role === 'admin' ? '/checklist/designer' : '/User/newCheck';
                                                                    router.push(`${basePath}${workflowId ? `?designerWorkflowId=${workflowId}&role=${role}` : `?role=${role}`}&fromWorkflow=true&designerNodeId=${selectedNode?.id}`);
                                                                }}
                                                                className="text-indigo-600 font-black text-[10px] uppercase tracking-widest gap-2"
                                                            >
                                                                <Plus size={14} /> New Checklist
                                                            </Button>
                                                        </div>
                                                        <select
                                                            className="w-full h-14 px-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100"
                                                            value={linkedObjectId}
                                                            onChange={(e) => setLinkedObjectId(e.target.value)}
                                                        >
                                                            <option value="">-- Choose Checklist --</option>
                                                            {availableChecklists.map(c => (
                                                                <option key={c._id} value={c._id}>{c.name || 'Unnamed Checklist'}</option>
                                                            ))}
                                                        </select>
                                                        {linkedObjectId && (
                                                            <div className="p-6 bg-indigo-50 rounded-2xl flex items-center justify-between mt-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm">
                                                                        <CheckSquare size={18} />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-indigo-900">Checklist Connected</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const role = window.location.pathname.includes('/admin/') ? 'admin' : (window.location.pathname.includes('/User/') ? 'user' : '');
                                                                        const basePath = role === 'admin' ? '/checklist/designer' : '/User/newCheck';
                                                                        router.push(`${basePath}?id=${linkedObjectId}${workflowId ? `&designerWorkflowId=${workflowId}&role=${role}` : `&role=${role}`}&fromWorkflow=true&designerNodeId=${selectedNode?.id}`);
                                                                    }}
                                                                    className="text-indigo-600 font-black text-[10px] uppercase tracking-widest gap-2"
                                                                >
                                                                    Edit Checklist <ExternalLink size={14} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {taskType === 'kanban' && (
                                                    <div className="pt-8 mt-8 border-t border-slate-100 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Connect Board Mapping</Label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const role = window.location.pathname.includes('/admin/') ? 'admin' : 'User';
                                                                    router.push(`/kanban${workflowId ? `?designerWorkflowId=${workflowId}&role=${role}` : `&role=${role}`}&fromWorkflow=true&designerNodeId=${selectedNode?.id}`);
                                                                }}
                                                                className="text-indigo-600 font-black text-[10px] uppercase tracking-widest gap-2"
                                                            >
                                                                <Plus size={14} /> New Board
                                                            </Button>
                                                        </div>
                                                        <select
                                                            className="w-full h-14 px-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-100"
                                                            value={linkedObjectId}
                                                            onChange={(e) => setLinkedObjectId(e.target.value)}
                                                        >
                                                            <option value="">-- Choose Project/Board --</option>
                                                            {availableProjects.map(p => (
                                                                <option key={p._id} value={p._id}>{p.name || 'Unnamed Project'}</option>
                                                            ))}
                                                        </select>

                                                        {linkedObjectId && (
                                                            <div className="p-6 bg-blue-50 rounded-2xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm">
                                                                        <LayoutGrid size={18} />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-blue-900">Board Linked</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const role = window.location.pathname.includes('/admin/') ? 'admin' : 'User';
                                                                        router.push(`/kanban?boardId=${linkedObjectId}${workflowId ? `&designerWorkflowId=${workflowId}&role=${role}` : `&role=${role}`}&fromWorkflow=true&designerNodeId=${selectedNode?.id}`);
                                                                    }}
                                                                    className="text-blue-600 font-black text-[10px] uppercase tracking-widest gap-2"
                                                                >
                                                                    View Board <ExternalLink size={14} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* TAB: LOGIC */}
                                {activeTab === 'logic' && selectedNode.type === 'condition' && (
                                    <section className="space-y-10">
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dynamic Routing</h2>
                                            <p className="text-slate-400 font-medium">Assign a logical rule to determine the flow path.</p>
                                        </div>

                                        <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl space-y-10 border border-slate-800">
                                            <div className="flex items-center gap-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 w-fit">
                                                <ShieldAlert className="text-indigo-400" size={24} />
                                                <span className="text-indigo-200 font-black text-[10px] uppercase tracking-widest">Logic Engine v4.0</span>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-indigo-100">Structural Rule</Label>
                                                <Input
                                                    value={condition}
                                                    onChange={(e) => setCondition(e.target.value)}
                                                    placeholder="amount > 5000"
                                                    className="h-16 bg-slate-800 border-none rounded-2xl font-mono text-2xl text-emerald-400 focus:ring-2 focus:ring-emerald-500 shadow-inner px-8 placeholder:text-slate-700"
                                                />
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Example: <span className="text-amber-500/80">department == 'Finance' && total &gt; 1000</span></p>
                                            </div>

                                            {availableVariables.length > 0 && (
                                                <div className="pt-6 border-t border-slate-800/50 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Form Fields</Label>
                                                        <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded">Current Process Scope</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                                        {availableVariables.map((v, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setCondition(prev => (prev ? `${prev} && ` : '') + v.name)}
                                                                className="flex items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800/50 rounded-xl transition-all group text-left"
                                                            >
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-xs font-black text-slate-300 tracking-tight group-hover:text-indigo-400 transition-colors uppercase">
                                                                        {v.name}
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.05em] truncate">
                                                                        Label: {v.label || 'None'} • {v.nodeLabel}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[10px] font-black text-indigo-500 px-2.5 py-1 bg-indigo-500/5 rounded-lg border border-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                                                                    Insert
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-6 bg-slate-800/30 rounded-3xl space-y-4 border border-slate-800/50">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldAlert size={14} className="text-amber-500" /> Help & Syntax
                                                </p>
                                                <ul className="space-y-2">
                                                    <li className="text-[10px] font-medium text-slate-400 leading-relaxed list-disc ml-4">Use standard operators: <span className="text-emerald-400 font-mono">==, !=, &gt;, &lt;, &amp;&amp;, ||</span></li>
                                                    <li className="text-[10px] font-medium text-slate-400 leading-relaxed list-disc ml-4">Case sensitive variable names.</li>
                                                    <li className="text-[10px] font-medium text-slate-400 leading-relaxed list-disc ml-4">The path follow <span className="text-emerald-500 font-black">YES</span> if result is truthy, <span className="text-rose-500 font-black">NO</span> otherwise.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-white border-t border-slate-200 flex items-center justify-end gap-4 flex-none shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                        <Button variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold text-slate-500">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveWithValidation}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-12 font-black shadow-xl shadow-indigo-500/20 transition-all border-none"
                        >
                            Commit Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeDetailsPanel;
