"use client"

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, AlertCircle, ListChecks, ArrowRight, ShieldCheck, Users, ClipboardList, LayoutGrid, ExternalLink, FilePlus, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TaskExecutionPanelProps {
    instance: any;
    node: any;
    workflowId?: string | null;
    onClose: () => void;
    onRefresh: () => void;
}

const TaskExecutionPanel = ({ instance, node, workflowId, onClose, onRefresh }: TaskExecutionPanelProps) => {
    const router = useRouter();
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [variables, setVariables] = useState<any>({});
    const [isUploading, setIsUploading] = useState(false);
    const [localAttachments, setLocalAttachments] = useState<any[]>([]);

    useEffect(() => {
        if (instance?.attachments) {
            setLocalAttachments(instance.attachments);
        }
    }, [instance]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !instance?._id) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                const res = await apiService.request(`/workflow-instances/${instance._id}/attachments`, {
                    method: 'POST',
                    body: JSON.stringify({
                        filename: file.name,
                        url: base64
                    })
                });

                if (res.success) {
                    toast.success('Document attached successfully!');
                    setLocalAttachments(prev => [...prev, res.data]);
                } else {
                    toast.error(res.message || 'Upload failed');
                }
            } catch (err: any) {
                toast.error(err.message || 'Connection error');
            } finally {
                setIsUploading(false);
            }
        };
    };

    // Lookup & Auth data
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    setCurrentUser(JSON.parse(userStr));
                } catch (e) {
                    console.error('Error parsing current user:', e);
                }
            }
        }

        const fetchLookups = async () => {
            try {
                const [usersRes, rolesRes] = await Promise.all([
                    apiService.getUsers(),
                    apiService.getRoles()
                ]);
                if (usersRes?.success) setUsers(usersRes.data);
                if (rolesRes?.success) setRoles(rolesRes.data);
            } catch (err) {
                console.error('Error fetching lookup data:', err);
            }
        };
        fetchLookups();
    }, []);

    const resolveNames = (ids: string[], type: 'user' | 'role') => {
        if (!ids || ids.length === 0) return 'Everyone';
        if (type === 'user') {
            return ids.map(id => {
                const user = users.find(u => (u._id === id || u.id === id));
                if (user) return user.firstName ? `${user.firstName} ${user.lastName}` : (user.email || id);
                return id;
            }).join(', ');
        } else {
            return ids.map(id => {
                const role = roles.find(r => (r._id === id || r.id === id));
                return role ? role.name : id;
            }).join(', ');
        }
    };

    const checkAssigneeAccess = () => {
        if (!currentUser || !node) return false;
        if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return true;

        const data = node.data || {};

        // Domain restriction check
        if (data.domainScope !== 'all' && data.responsibleDomain && currentUser.domain !== data.responsibleDomain) {
            console.log('Permission Denied: Domain mismatch', { user: currentUser.domain, required: data.responsibleDomain });
            return false;
        }

        if (data.assigneeType === 'all') return true;

        // Resolve current user's Role ID from the fetched roles list
        const currentUserRoleObj = roles.find(r => r.name === currentUser.role);
        const currentUserRoleId = currentUserRoleObj?._id || currentUserRoleObj?.id;

        console.log('Checking Assignee Access:', {
            type: data.assigneeType,
            requiredIds: data.assigneeIds,
            userRoleId: currentUserRoleId,
            userRoleName: currentUser.role,
            userId: currentUser._id || currentUser.id
        });

        if (data.assigneeType === 'group' && data.assigneeIds) {
            return data.assigneeIds.includes(currentUserRoleId) || data.assigneeIds.includes(currentUser.role);
        }

        if (data.assigneeType === 'specific' && data.assigneeIds) {
            return data.assigneeIds.includes(currentUser.id) || data.assigneeIds.includes(currentUser._id);
        }

        return false;
    };

    const checkValidatorAccess = () => {
        if (!currentUser || !node) return false;
        if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return true;

        const data = node.data || {};

        // Domain restriction mirror for validators (security)
        if (data.domainScope !== 'all' && data.responsibleDomain && currentUser.domain !== data.responsibleDomain) {
            return false;
        }

        if (!data.validationType || data.validationType === 'none') {
            return checkAssigneeAccess();
        }

        // Resolve current user's Role ID
        const currentUserRoleObj = roles.find(r => r.name === currentUser.role);
        const currentUserRoleId = currentUserRoleObj?._id || currentUserRoleObj?.id;

        console.log('Checking Validator Access:', {
            type: data.validatorType,
            requiredIds: data.validatorIds,
            userRoleId: currentUserRoleId,
            userId: currentUser._id
        });

        if (data.validatorType === 'role' && data.validatorIds) {
            return data.validatorIds.includes(currentUserRoleId) || data.validatorIds.includes(currentUser.role);
        }

        if (data.validatorType === 'user' && data.validatorIds) {
            return data.validatorIds.includes(currentUser.id) || data.validatorIds.includes(currentUser._id);
        }

        return false;
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        console.log('Action triggered:', action, 'Node:', node.id, 'Instance:', instance?._id);
        if (!checkValidatorAccess() && instance && node.type !== 'start') {
            alert("Unauthorized: Specific validation permissions required.");
            return;
        }

        try {
            setLoading(true);
            if (!instance && node.type === 'start') {
                const res = await apiService.createInstance({
                    workflowId: workflowId || node.data.workflowId || (window.location.search.split('workflowId=')[1]?.split('&')[0]),
                    title: `Instance: ${node.data.label || 'New Workflow'}`
                });
                if (res.success && res.data?._id) {
                    router.push(`/Workflows/instances/${res.data._id}`);
                    onClose();
                }
                return;
            }

            if (!instance) return;
            const res = action === 'approve'
                ? await apiService.approveNode(instance._id, node.id, { comment, variables })
                : await apiService.rejectNode(instance._id, node.id);

            if (res.success) {
                onRefresh();
                onClose();
            }
        } catch (err: any) {
            console.error('Error processing task:', err);
            alert(err.message || "An error occurred while processing the task.");
        } finally {
            setLoading(false);
        }
    };

    if (!node) return null;
    const data = node.data || {};

    let isActive = false;
    if (instance?.currentNodes) {
        isActive = instance.currentNodes.some((cn: any) => cn.nodeId === node.id);
    } else if (!instance && node.type === 'start') {
        isActive = true;
    }

    const isSystemAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const canPerform = (isActive && (checkAssigneeAccess() || node.type === 'start')) || (!instance && (isSystemAdmin || checkAssigneeAccess()));
    const canValidate = isActive && (checkValidatorAccess() || !instance || node.type === 'start');

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-4 right-4 w-full md:w-[480px] bg-white/80 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] z-[1000] flex flex-col border border-white/40 rounded-[32px] overflow-hidden"
        >
            {/* Header with Background Gradient */}
            <div className="p-8 pb-6 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -ml-24 -mb-24 blur-[60px]"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`p-4 rounded-[22px] shadow-lg ${isActive ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                            {node.type === 'start' ? <ArrowRight size={28} strokeWidth={3} /> : <AlertCircle size={28} strokeWidth={3} />}
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100/50 rounded-2xl transition-all group">
                            <X size={24} className="text-slate-300 group-hover:text-slate-600" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500/80">
                                {node.type?.toUpperCase()} PROTOCOL
                            </span>
                            {isActive && <div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span></div>}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight truncate">
                            {data.label || 'Workflow Unit'}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow overflow-y-auto px-8 py-2 space-y-8 custom-scrollbar">
                {/* Badges Bar */}
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/5 backdrop-blur-sm border border-slate-900/10 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                        <span className="text-[10px] font-black uppercase text-slate-700">{data.taskType || 'Task'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-full text-indigo-600">
                        <ShieldCheck size={12} />
                        <span className="text-[10px] font-black uppercase">{data.domainScope === 'all' ? 'Global Organization' : (data.responsibleDomain || 'No Domain')}</span>
                    </div>
                </div>

                {/* Instructions Glass Box */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Standard Operational Procedure</p>
                    <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-[24px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 blur-2xl group-hover:bg-white/60 transition-colors"></div>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic relative z-10">
                            "{data.description || "Active step in the business process. Please adhere to corporate compliance guidelines during execution."}"
                        </p>
                    </div>
                </div>

                {/* Metadata & Matrix Combined */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm flex flex-col gap-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priority Class</p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${data.priority === 'high' || data.priority === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : data.priority === 'medium' ? 'bg-blue-500' : 'bg-emerald-400'}`}></div>
                            <span className="text-sm font-black text-slate-800 uppercase">{data.priority || 'Standard'}</span>
                        </div>
                    </div>
                    <div className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm flex flex-col gap-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA Deadline</p>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-indigo-400" />
                            <span className="text-sm font-black text-slate-800">{data.estimatedDuration || 'No SLA'}</span>
                        </div>
                    </div>
                </div>

                {/* Responsibility Matrix */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Permission Matrix</p>
                    <div className="space-y-3">
                        <div className="p-4 bg-white/50 border border-slate-100 rounded-[20px] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl"><Users size={16} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Target Team</span>
                                    <span className="text-xs font-bold text-slate-700">{data.assigneeType === 'all' ? 'All Members' : resolveNames(data.assigneeIds || [], data.assigneeType === 'group' ? 'role' : 'user')}</span>
                                </div>
                            </div>
                        </div>
                        {data.validationType !== 'none' && data.validationType && (
                            <div className="p-4 bg-white/50 border border-slate-100 rounded-[20px] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl"><ShieldCheck size={16} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Step Validator</span>
                                        <span className="text-xs font-bold text-slate-700">{resolveNames(data.validatorIds || [], data.validatorType || 'user')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resource Output Section */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 flex items-center gap-2">
                        <ClipboardList size={14} /> Linked Assets & Tasks
                    </p>

                    {/* Kanban Integration Board */}
                    {data.attachKanban && data.kanbanBoardId && (
                        <div className={`mt-4 group relative p-6 border rounded-[28px] transition-all duration-300 ${canPerform ? 'bg-indigo-50/50 border-indigo-200 shadow-lg shadow-indigo-500/5' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 ${canPerform ? 'bg-white text-indigo-500' : 'bg-slate-100 text-slate-300'}`}>
                                        <LayoutGrid size={22} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black ${canPerform ? 'text-indigo-900' : 'text-slate-400'}`}>
                                            Kanban Board Attached
                                        </h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">External Board Sync Active</p>
                                    </div>
                                </div>
                            </div>

                            {canPerform ? (
                                <Link
                                    href={`/kanban/${data.kanbanBoardId}`}
                                    className="w-full h-12 bg-indigo-600 text-white rounded-[18px] flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all font-sans"
                                >
                                    Open Board <ExternalLink size={14} />
                                </Link>
                            ) : (
                                <div className="p-3 bg-white/60 rounded-xl border border-dashed border-slate-200 text-slate-500 italic text-[10px]">
                                    Board access restricted until progression.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Task type specific rendering */}
                    {data.linkedObjectId ? (
                        <div className={`group relative p-6 border rounded-[28px] transition-all duration-300 mt-4 ${canPerform ? 'bg-emerald-50/50 border-emerald-200 shadow-lg shadow-emerald-500/5' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 ${canPerform ? 'bg-white text-emerald-500' : 'bg-slate-100 text-slate-300'}`}>
                                        {data.taskType === 'form' ? <ClipboardList size={22} /> : <ListChecks size={22} />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black ${canPerform ? 'text-emerald-900' : 'text-slate-400'}`}>
                                            Dynamic {data.taskType?.toUpperCase() || 'ASSET'}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">External Integration Bound</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                                    {isActive ? 'Active' : (canPerform ? 'Preview' : 'Locked')}
                                </div>
                            </div>

                            {canPerform ? (
                                <Link
                                    href={
                                        data.taskType === 'form' ? `/form/form2?instanceId=${instance?._id || ''}&nodeId=${node.id}` :
                                            data.taskType === 'checklist' ? `/checklist?instanceId=${instance?._id || ''}&nodeId=${node.id}` :
                                                `/${data.taskType}s/${data.linkedObjectId}?instanceId=${instance?._id || ''}&nodeId=${node.id}`
                                    }
                                    className="w-full h-12 bg-emerald-600 text-white rounded-[18px] flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-200 transition-all font-sans"
                                >
                                    {isActive ? 'Execute Task Now' : 'Preview Asset Structure'} <ArrowRight size={16} strokeWidth={3} />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2 p-3 bg-white/60 rounded-xl border border-dashed border-slate-200 text-slate-500 italic text-[10px]">
                                    <Clock size={14} />
                                    <span>Locked until workflow progression reaches this unit.</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        (data.taskType === 'form' || data.taskType === 'checklist') ? (
                            <div className="p-5 bg-rose-50 border border-rose-100 rounded-[24px] flex flex-col gap-2 mt-4">
                                <div className="flex items-center gap-2 text-rose-600">
                                    <XCircle size={18} />
                                    <span className="text-xs font-black uppercase">Configuration Error</span>
                                </div>
                                <p className="text-[11px] text-rose-800/70 font-medium">This node is set as a {data.taskType}, but no template is bound.</p>
                            </div>
                        ) : data.taskType === 'normal' ? (
                            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-[28px] space-y-6 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                            <FilePlus size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Project Evidence</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Attachments & Media</p>
                                        </div>
                                    </div>
                                    {isUploading && <Clock className="animate-spin text-indigo-500 h-4 w-4" />}
                                </div>

                                {/* Reference Materials (from Node Template) */}
                                {data.attachments && data.attachments.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Reference Assets</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {data.attachments.map((att: any, idx: number) => (
                                                <a
                                                    key={`ref-${idx}`}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between p-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl hover:bg-indigo-50 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                                                            <ImageIcon size={14} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">{att.filename}</span>
                                                            <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">Protocol Reference</span>
                                                        </div>
                                                    </div>
                                                    <ExternalLink size={14} className="text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Instance Uploads */}
                                <div className="space-y-3">
                                    {(localAttachments.length > 0 || data.attachments?.length > 0) && (
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Operational Uploads</p>
                                    )}

                                    {localAttachments.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {localAttachments.map((att, idx) => (
                                                <div
                                                    key={`upload-${idx}`}
                                                    className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                                            <ShieldCheck size={14} />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">{att.filename}</span>
                                                            <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Evidence Sync'd</span>
                                                        </div>
                                                    </div>
                                                    <a href={att.url} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        !instance && (
                                            <div className="p-10 border-2 border-dashed border-slate-200 rounded-[28px] text-center space-y-3">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                                    <AlertCircle size={24} />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No evidence captured</p>
                                            </div>
                                        )
                                    )}

                                    {isActive && (
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <input
                                                type="file"
                                                id="execution-file-upload"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={!instance || isUploading}
                                            />
                                            <button
                                                onClick={() => document.getElementById('execution-file-upload')?.click()}
                                                disabled={!instance || isUploading}
                                                className="h-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 group border-0 outline-none"
                                            >
                                                <ImageIcon size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Add Media</span>
                                            </button>
                                            <button
                                                onClick={() => document.getElementById('execution-file-upload')?.click()}
                                                disabled={!instance || isUploading}
                                                className="h-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 group border-0 outline-none"
                                            >
                                                <FilePlus size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Add Document</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-white/40 border border-slate-100 rounded-[20px] text-[10px] text-slate-400 font-bold italic text-center mt-4">
                                No external resources configured for this unit.
                            </div>
                        )
                    )}
                </div>

                {/* Workflow Guidance Tip */}
                {!isActive && !instance && (
                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[28px] text-white shadow-xl shadow-indigo-100 flex flex-col gap-3 relative overflow-hidden">
                        <ArrowRight size={48} className="absolute -right-4 -bottom-4 opacity-10 rotate-[-15deg]" />
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                            <ArrowRight size={14} /> System Guidance
                        </div>
                        <p className="text-xs font-bold leading-relaxed">
                            You are viewing a template mode. To activate this specific task and fill the form, return to the <span className="underline decoration-white/40">Start</span> node and click <span className="bg-white/20 px-1.5 py-0.5 rounded">Initialize Flow</span>.
                        </p>
                    </div>
                )}

                {/* Comment Field (Only if Active) */}
                {isActive && (
                    <div className="space-y-3 pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolution Logs</p>
                            <span className="text-[8px] font-bold text-slate-300 uppercase">Required for rejection</span>
                        </div>
                        <Textarea
                            placeholder="Describe the outcome of this step..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[120px] rounded-2xl border-slate-100 focus-visible:ring-indigo-100 focus:border-indigo-200 text-sm font-medium"
                        />
                    </div>
                )}
                <div className="h-4"></div>
            </div>

            {/* Footer Actions Area */}
            {canValidate ? (
                <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100/50 space-y-4">
                    <div className="flex gap-4">
                        {(instance || node.type !== 'start') && (
                            <Button
                                variant="outline"
                                onClick={() => handleAction('reject')}
                                disabled={loading}
                                className="flex-1 h-14 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 hover:shadow-md transition-all font-black uppercase text-[10px] tracking-widest gap-2"
                            >
                                <XCircle size={16} /> Discard Flow
                            </Button>
                        )}
                        <Button
                            onClick={() => handleAction('approve')}
                            disabled={loading}
                            className={`flex-1 h-14 rounded-2xl ${!instance && node.type === 'start' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all`}
                        >
                            <CheckCircle2 size={16} /> {!instance && node.type === 'start' ? 'Initialize Flow' : 'Finalize Step'}
                        </Button>
                    </div>
                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                        {!instance && node.type === 'start'
                            ? 'Creating a new persistent instance of this workflow for tracking.'
                            : 'This action will transition the flow state to the next logical node.'}
                    </p>
                </div>
            ) : (
                <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100/50">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/60 flex items-center justify-center gap-3 shadow-sm">
                        {isActive ? (
                            <>
                                <AlertCircle className="text-rose-500" size={18} />
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Awaiting Validator Review</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="text-slate-400" size={18} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol View Only</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default TaskExecutionPanel;
