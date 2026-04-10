"use client"

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, AlertCircle, ListChecks, ArrowRight, ShieldCheck, Users, ClipboardList, LayoutGrid, ExternalLink, FilePlus, Plus, Send, Save, CheckSquare, Image as ImageIcon, ClipboardType, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [variables, setVariables] = useState<any>({});
    const [isExecuted, setIsExecuted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [localAttachments, setLocalAttachments] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (instance?.attachments) {
            setLocalAttachments(instance.attachments);
        }
        
        // Check if task is already executed based on variables, node status, OR query params
        const vars = instance?.variables || {};
        const isExecutedParam = searchParams.get('executed') === 'true';
        const nodeIdParam = searchParams.get('nodeId');
        
        const nodeExecuted = vars[node.id] || 
                            vars[node.id + '_executed'] || 
                            vars[node.id + '_data'] ||
                            node.status === 'executed' || 
                            node.workerCompleted ||
                            (isExecutedParam && nodeIdParam === node.id) ||
                            ((userAction === 'Upload File' || userAction === 'Upload Image') && instance?.attachments?.length > 0);

        setIsExecuted(!!nodeExecuted);
        if (instance?.variables) {
            setVariables(instance.variables);
        }
    }, [instance, node.id, searchParams]);

    const isValidator = node?.data?.validatorIds?.includes(currentUser?._id) || 
                       node?.data?.validatorIds?.includes(currentUser?.id) ||
                       (node?.data?.validatorType === 'role' && (
                           node?.data?.validatorIds?.includes(currentUser?.role) ||
                           node?.data?.validatorIds?.includes(currentUser?.specificRole) ||
                           (currentUser?.specificRoleId && node?.data?.validatorIds?.includes(currentUser?.specificRoleId))
                       )) ||
                       (currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super_admin');

    // Get work submitted by node operator
    const lastWorkerSubmission = [...(instance?.history || [])]
        .reverse()
        .find((h: any) => h.nodeId === node.id && (h.action === 'step_submitted_for_validation' || h.action === 'step_rejected_for_validation' || h.action === 'worker_submitted' || h.action === 'worker_rejected'));

    const data = node?.data || {};
    const {
        taskContent,
        userAction,
        priority,
        estimatedDuration,
        deadline,
        taskType = 'normal'
    } = data;

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
    }, []);

    const [toastShown, setToastShown] = useState<string | null>(null);
    useEffect(() => {
        if (deadline && toastShown !== deadline) {
            const deadlineDate = new Date(deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const deadlineDay = new Date(deadlineDate);
            deadlineDay.setHours(0, 0, 0, 0);

            if (deadlineDay.getTime() === today.getTime()) {
                toast.warning('⚠️ LAST DAY: This task must be completed today!', {
                    icon: <Clock size={20} className="text-amber-500" />,
                    duration: 8000
                });
                setToastShown(deadline);
            } else if (deadlineDay < today) {
                toast.error('🚨 OVERDUE: This task has passed its deadline!', {
                    icon: <AlertCircle size={20} className="text-rose-500" />,
                    duration: 10000
                });
                setToastShown(deadline);
            }
        }
    }, [deadline, toastShown]);

    const isLocked = !!node?.responsibleUser;
    const isLockedByMe = node?.responsibleUser === currentUser?._id;
    const isAnyAssignment = data.assignmentType === 'ANY';
    const canPerformAny = isAnyAssignment && (!isLocked || isLockedByMe);
    const needsLock = isAnyAssignment && !isLocked;
    const isHistoryNode = instance?.currentNodes ? !instance.currentNodes.some((cn: any) => cn.nodeId === node.id) : false;

    const safeStatus = String(instance?.status || 'pending').toLowerCase();
    const isActive = safeStatus === 'active' || safeStatus === 'in_progress' || safeStatus === 'pending';
    const isInstanceActive = !instance || ['active', 'in_progress', 'pending'].includes(safeStatus);
    const isWorkerCompleted = !!node.workerCompleted;
    
    // Only allow performance if it's an active node (in currentNodes) and not already submitted by worker (unless validator)
    const isValidActiveNode = !instance ? (node.type === 'start') : (!isHistoryNode);
    const canPerform = isActive && isValidActiveNode && (!isWorkerCompleted || isValidator);
    const canValidate = canPerform && isInstanceActive && isWorkerCompleted && isValidator;
    const showButtons = canPerform || canValidate;

    const getFullUrl = (url: string) => {
        if (!url || typeof url !== 'string') return url;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        if (url.startsWith('uploads/')) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
            return `${baseUrl}/${url}`;
        }
        return url;
    };

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

    const handleLockTask = async () => {
        if (!instance?._id || !node?.id) return;
        setLoading(true);
        try {
            const res = await apiService.lockNode(instance._id, node.id);
            if (res.success) {
                toast.success('Task locked for you.');
                onRefresh();
            } else {
                toast.error(res.message || 'Failed to lock task');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!attachmentId || !instance?._id) return;
        
        try {
            const res = await apiService.request(`/workflow-instances/${instance._id}/attachments/${attachmentId}`, {
                method: 'DELETE'
            });

            if (res.success) {
                toast.success('Attachment removed');
                setLocalAttachments(prev => prev.filter(att => (att._id || att.id) !== attachmentId));
                onRefresh();
            } else {
                toast.error(res.message || 'Deletion failed');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error deleting file');
        }
    };

    const handleApprove = async () => {
        if (loading || !instance?._id) return;
        
        const isUploadTask = Boolean(String(userAction).match(/file|image/i));
        const hasUploadedItems = localAttachments.length > 0;
        const validLinkedObjectId = data.linkedObjectId && String(data.linkedObjectId).trim() !== '';
        
        // Safety check if execution is required (bypass if it's purely an upload task and files are provided)
        if (validLinkedObjectId && !isExecuted && !(isUploadTask && hasUploadedItems)) {
            toast.warning('⚠️ Action requise : Vous devez d\'abord compléter le formulaire affilié ou l\'action obligatoire de cette étape avant de finaliser.');
            return;
        }

        setLoading(true);
        try {
            if (instance.isKanban) {
                const res = await apiService.updateTask(instance._id, { status: 'done' });
                if (res.success) {
                    toast.success('Task finalized successfully');
                    onRefresh();
                    onClose();
                } else {
                    toast.error(res.message || 'Finalization failed');
                }
            } else {
                let nodeDataPayload = variables[node.id] || variables[`${node.id}_data`] || {};
                
                // If this is an upload task, explicitly include the attachments in the payload 
                // so they appear in the task execution outputData
                if (localAttachments.length > 0 && (String(userAction).includes('File') || String(userAction).includes('Image') || String(taskContent || '').includes('Document') || String(taskContent || '').includes('Image'))) {
                    nodeDataPayload = {
                        ...nodeDataPayload,
                        attachments: localAttachments.map(att => att.url)
                    };
                }

                const res = isHistoryNode 
                    ? await apiService.updateNodeData(instance._id, node.id, comment, nodeDataPayload)
                    : await apiService.approveNode(instance._id, node.id, comment, nodeDataPayload);
                    
                if (res.success) {
                    toast.success(isHistoryNode ? 'Modification saved successfully' : 'Stage approved successfully');
                    onRefresh();
                    onClose();
                } else {
                    toast.error(res.message || 'Approval failed');
                }
            }
        } catch (err: any) {
            toast.error(err.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (loading || !instance?._id) return;
        setLoading(true);
        try {
            const res = await apiService.rejectNode(instance._id, node.id, comment);
            if (res.success) {
                toast.success('Stage rejected');
                onRefresh();
                onClose();
            } else {
                toast.error(res.message || 'Rejection failed');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Fonction de fermeture sécurisée
    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            console.error('onClose function is not provided');
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col rounded-[40px] overflow-hidden h-[95vh] sm:h-auto sm:max-h-[92vh]"
            >
                {/* Close Button - Floating at top right of the whole modal */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 z-[1010] p-3 hover:bg-slate-100 rounded-2xl transition-all border-0 outline-none bg-white/80 backdrop-blur-sm shadow-sm text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>

                {/* SCROLLABLE AREA: Header + Content Together */}
                <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth flex flex-col">
                        {/* MODIFICATION STATE INDICATOR */}
                        {isExecuted && (
                            <div className="mx-10 mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Modification Mode</p>
                                        <h4 className="text-sm font-bold text-emerald-900">Task previously finalized</h4>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-white/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                                    Revision Active
                                </div>
                            </div>
                        )}

                        <div className="p-10 pb-6 relative shrink-0">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-40 -mt-40 blur-[100px]" />
                        <div className="relative z-10 text-left">
                            <div className={`p-4 rounded-[24px] shadow-lg mb-6 w-fit ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {isExecuted ? <CheckCircle2 size={32} /> : 
                                    node.type === 'start' ? <ArrowRight size={32} strokeWidth={3} /> :
                                    (userAction === 'Fill Form' || taskType === 'form') ? <ClipboardList size={32} /> :
                                        (String(userAction).includes('Image') || taskType === 'upload') ? <ImageIcon size={32} /> :
                                            (String(userAction).includes('File') || taskType === 'upload') ? <FilePlus size={32} /> :
                                                (userAction === 'Approve / Reject' || taskType === 'validation') ? <ShieldCheck size={32} /> :
                                                    <AlertCircle size={32} strokeWidth={3} />}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500/80">
                                        {String(userAction || 'TECHNICAL STEP').toUpperCase()}
                                    </span>
                                    {isActive && !isLocked && <div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span></div>}
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
                                    {data.label || 'Workflow Stage'}
                                </h2>
                            </div>

                            {/* METADATA STRIP */}
                            <div className="flex flex-wrap gap-6 mt-8">
                                {priority && (
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Priorité</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${priority === 'critical' ? 'bg-red-600' : priority === 'high' ? 'bg-rose-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                            <span className="text-[11px] font-black text-slate-700 uppercase">{priority}</span>
                                        </div>
                                    </div>
                                )}
                                {estimatedDuration && (
                                    <div className="flex flex-col border-l border-slate-100 pl-6">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Estimation</span>
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-slate-400" />
                                            <span className="text-[11px] font-black text-slate-700 uppercase">{estimatedDuration}</span>
                                        </div>
                                    </div>
                                )}
                                {deadline && (
                                    <div className="flex flex-col border-l border-slate-100 pl-6">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Échéance</span>
                                        <div className="flex items-center gap-2 text-rose-600">
                                            <Clock size={12} />
                                            <span className="text-[11px] font-black uppercase">{new Date(deadline).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* POOL ASSIGNMENT ALERT (If applicable) */}
                    {isActive && isAnyAssignment && (
                        <div className={`mx-8 mb-6 p-4 flex items-center justify-between rounded-2xl ${isLocked ? 'bg-indigo-50/50 border border-indigo-100' : 'bg-amber-50/50 border border-amber-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isLocked ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'}`}>
                                    {isLocked ? <ShieldCheck size={14} /> : <Users size={14} />}
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-indigo-900' : 'text-amber-900'}`}>
                                        {isLocked ? (isLockedByMe ? "Task Locked to You" : "Locked by Teammate") : "Available in Pool"}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-500">
                                        {isLocked ? "Secure process path active." : "Claim to begin execution."}
                                    </p>
                                </div>
                            </div>
                            {needsLock && (
                                <Button
                                    onClick={handleLockTask}
                                    disabled={loading}
                                    className="h-8 px-4 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black uppercase rounded-lg shadow-sm"
                                >
                                    Claim Task
                                </Button>
                            )}
                        </div>
                    )}

                    {/* MAIN CONTENT WORKSPACE */}
                    <div className="px-10 pb-10 space-y-10">
                        {/* 1. EXECUTION / DYNAMIC ASSETS SECTION */}
                        {data.linkedObjectId && (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80 flex items-center gap-2">
                                    <LayoutGrid size={14} /> Required Process Resource
                                </p>

                                <div className={`p-8 border rounded-[32px] transition-all duration-500 ${isExecuted ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 ${isExecuted || (Boolean(String(userAction).match(/file|image/i)) && localAttachments.length > 0) ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 group-hover:scale-110'}`}>
                                                {data.taskType === 'form' ? <ClipboardList size={26} /> : <ListChecks size={26} />}
                                            </div>
                                            <div>
                                                <h4 className={`text-lg font-black ${isExecuted || (Boolean(String(userAction).match(/file|image/i)) && localAttachments.length > 0) ? 'text-emerald-900' : 'text-slate-800'}`}>
                                                    {data.taskType === 'form' ? 'Formulaire requis' : 
                                                     data.taskType === 'checklist' ? 'Checklist requise' : 
                                                     'Action complémentaire'}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                                                    {isExecuted || (Boolean(String(userAction).match(/file|image/i)) && localAttachments.length > 0) ? 'Condition remplie' : 'Action obligatoire pour continuer'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${(isExecuted || (Boolean(String(userAction).match(/file|image/i)) && localAttachments.length > 0)) ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-600'}`}>
                                            {(isExecuted || (Boolean(String(userAction).match(/file|image/i)) && localAttachments.length > 0)) ? 'Validé' : 'Obligatoire'}
                                        </div>
                                    </div>

                                    {(data.taskType === 'form' || data.taskType === 'checklist' || data.taskType === 'kanban' || data.formId || 
                                      String(userAction || '').toLowerCase().includes('form') || 
                                      String(userAction || '').toLowerCase().includes('checklist') || 
                                      String(userAction || '').toLowerCase().includes('kanban') ||
                                      String(taskContent || '').toLowerCase().includes('form') ||
                                      String(taskContent || '').toLowerCase().includes('checklist') ||
                                      String(taskContent || '').toLowerCase().includes('kanban')) ? (
                                        <Link
                                            href={
                                                (data.taskType === 'form' || !!data.formId || String(userAction || '').toLowerCase().includes('form')) 
                                                    ? `/form/form2?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}${data.linkedObjectId ? `&formId=${data.linkedObjectId}` : ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}${isValidator ? '&consult=true' : ''}` :
                                                (data.taskType === 'checklist' || String(userAction || '').toLowerCase().includes('checklist')) 
                                                    ? `/checklist/designer?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}${data.linkedObjectId ? `&id=${data.linkedObjectId}` : ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}${isValidator ? '&consult=true' : ''}` :
                                                data.taskType === 'kanban' 
                                                    ? `/kanban?boardId=${data.linkedObjectId}&instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}${isValidator ? '&consult=true' : ''}` :
                                                `/${data.taskType || 'task'}/${data.linkedObjectId}?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}${isValidator ? '&consult=true' : ''}`
                                            }
                                            onClick={() => {
                                                if (!data.taskType?.includes('form')) setIsExecuted(true);
                                                handleClose();
                                            }}
                                            className={`w-full h-14 rounded-[22px] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.15em] transition-all ${isExecuted || isValidator
                                                ? 'bg-indigo-900 text-white hover:bg-slate-800 shadow-lg'
                                                : canPerform ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed hidden'
                                                }`}
                                        >
                                            {isValidator ? 'Consult Record / Operator Data' : isExecuted ? 'Modify My Submission' : 'Complete Required Action'} 
                                            {isExecuted || isValidator ? <CheckCircle2 size={18} /> : <ExternalLink size={18} />}
                                        </Link>
                                    ) : (
                                        null
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. DESCRIPTION & INSTRUCTIONS */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Context & Instructions</p>
                            <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    {data.description || "Active operations cycle. Please follow the defined protocols for this workflow node."}
                                </p>

                                {data.attachments && data.attachments.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-4">Referential Assets Supplied by Admin</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {data.attachments.map((att: any, idx: number) => (
                                                <div key={idx} className="group relative overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50/50 p-2 hover:bg-white transition-all">
                                                    {att.url?.includes('data:image/') || att.url?.includes('uploads/') || (typeof att.url === 'string' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.url)) ? (
                                                        <div className="space-y-3">
                                                            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-100">
                                                                <img src={getFullUrl(att.url)} alt={att.filename} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                                            </div>
                                                            <div className="flex items-center justify-between px-2">
                                                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">{att.filename}</span>
                                                                <a href={getFullUrl(att.url)} download={att.filename} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                                                    <ImageIcon size={14} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between p-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                                                                    <FilePlus size={16} />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[140px] font-mono">{att.filename}</span>
                                                            </div>
                                                            <a href={getFullUrl(att.url)} target="_blank" rel="noopener noreferrer" className="p-2.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. UPLOAD SECTIONS (If applicable) */}
                        {(String(userAction).includes('File') || String(userAction).includes('Image')) && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section: Digital Proof / Submission</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${localAttachments.length > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {localAttachments.length > 0 ? 'Supplied' : 'Required'}
                                    </span>
                                </div>
                                <div className={`p-10 border-2 border-dashed rounded-[32px] transition-all ${localAttachments.length > 0 ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'}`}>
                                    <input type="file" id="exec-panel-upload" accept={userAction === 'Upload Image' ? 'image/*' : '*'} className="hidden" onChange={handleFileUpload} />
                                    <div className="flex flex-col items-center gap-5 text-center">
                                        <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-lg transition-transform ${localAttachments.length > 0 ? 'bg-emerald-500 text-white scale-90' : 'bg-white text-indigo-500'}`}>
                                            {isUploading ? <Clock size={32} className="animate-spin" /> : localAttachments.length > 0 ? <CheckCircle2 size={32} /> : (String(userAction).includes('Image') ? <ImageIcon size={32} /> : <FilePlus size={32} />)}
                                        </div>
                                        <div className="space-y-2">
                                             <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                                                {String(userAction).includes('Image') && String(userAction).includes('File') 
                                                  ? "Upload Image / File" 
                                                  : String(userAction).includes('Image')
                                                    ? "Upload Image" 
                                                    : "Upload File"}
                                             </h4>
                                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest max-w-[280px]">
                                                {localAttachments.length > 0 ? `Confirmed: ${localAttachments.length} items` : "Please upload the requested digital assets"}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => document.getElementById('exec-panel-upload')?.click()}
                                            disabled={isUploading}
                                            className={`h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${localAttachments.length > 0 ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}
                                        >
                                            {localAttachments.length > 0 ? "Add More Items" : 
                                              (String(userAction).includes('Image') && String(userAction).includes('File'))
                                                ? "Upload Image or File"
                                                : String(userAction).includes('Image')
                                                  ? "Upload Image Only"
                                                  : "Upload File Only"}
                                        </Button>
                                    </div>

                                    {localAttachments.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3 mt-8 pt-8 border-t border-emerald-100">
                                            {Array.from(new Map(localAttachments.map(att => [att.url, att])).values()).map((att, idx) => (
                                                <div key={att._id || idx} className="flex items-center justify-between p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm group/att">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <CheckSquare size={14} className="text-emerald-500 shrink-0" />
                                                        <a 
                                                            href={getFullUrl(att.url) || '#'} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-bold text-slate-600 truncate hover:text-indigo-600 transition-colors underline-offset-4 hover:underline"
                                                        >
                                                            {att.filename}
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleDeleteAttachment(att._id)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover/att:opacity-100 transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                        <ExternalLink size={12} className="text-slate-300 group-hover/att:text-indigo-500 transition-colors" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        (String(userAction).includes('Image') || String(userAction).includes('File')) && data.linkedObjectId && (
                                            <div className="mt-6 animate-in fade-in zoom-in-95 duration-700">
                                                <Link
                                                    href={`/form/form2?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}&formId=${data.linkedObjectId}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}`}
                                                    className="w-full h-12 bg-white border border-indigo-100 rounded-2xl flex items-center justify-center gap-3 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm"
                                                >
                                                    <ClipboardType size={16} />
                                                    Fill Associated Form First
                                                </Link>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. OPERATOR EVIDENCE (Special section for validators) */}
                        {isValidator && lastWorkerSubmission && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Operator Evidence & Submissions
                                </p>
                                <div className="p-8 bg-amber-50/30 border-2 border-amber-100 rounded-[32px] space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                                            {lastWorkerSubmission.action.includes('rejected') ? <XCircle size={24} /> : <ClipboardList size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Operator Report</h4>
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest italic">
                                                {lastWorkerSubmission.action.includes('rejected') ? 'Signal d\'échec reçu' : 'Données soumises pour validation'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {lastWorkerSubmission.comments && (
                                        <div className="bg-white/80 p-6 rounded-2xl border border-amber-100 shadow-sm">
                                            <p className="text-[11px] font-black uppercase text-amber-400 mb-2 tracking-widest">Observations de l'opérateur</p>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                                "{lastWorkerSubmission.comments}"
                                            </p>
                                        </div>
                                    )}

                                    {/* RESPONSE DATA DISPLAY */}
                                    {lastWorkerSubmission.outputData && Object.keys(lastWorkerSubmission.outputData).length > 0 && (
                                        <div className="bg-white/95 p-6 rounded-2xl border border-amber-100 shadow-sm">
                                            <p className="text-[11px] font-black uppercase text-amber-400 mb-4 tracking-widest">Réponse Structurée</p>
                                            <div className="grid grid-cols-1 gap-4">
                                                {Object.entries(lastWorkerSubmission.outputData).map(([key, val]: [string, any]) => (
                                                    <div key={key} className="flex flex-col gap-1 pb-3 border-b border-amber-50 last:border-0 last:pb-0">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">{key.replace(/_/g, ' ')}</span>
                                                        <span className="text-sm font-bold text-slate-800">
                                                            {Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-amber-600">
                                        <div className="px-3 py-1 bg-white rounded-full border border-amber-100">
                                             Par: Utilisateur (ID: {lastWorkerSubmission.performedBy ? String(lastWorkerSubmission.performedBy).slice(-6) : 'N/A'})
                                        </div>
                                        <div className="px-3 py-1 bg-white rounded-full border border-amber-100">
                                             {new Date(lastWorkerSubmission.timestamp || instance.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {((String(userAction).toLowerCase().includes('report') || String(userAction).toLowerCase().includes('text') || userAction === 'Write Report')) && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        {isValidator && isWorkerCompleted ? "Section: Remarques de Validation" : "Section: Mandatory Report & Synthesis"}
                                    </p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${(isValidator && isWorkerCompleted) || comment.trim().length > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {(isValidator && isWorkerCompleted) ? 'Optional' : comment.trim().length > 10 ? 'Satisfied' : 'Required'}
                                    </span>
                                </div>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={isValidator && isWorkerCompleted ? "Ajoutez une note ou un motif de refus (optionnel)..." : "Please provide a detailed report of the activities or findings..."}
                                    className="min-h-[220px] rounded-[32px] bg-slate-50 border-slate-100 p-8 text-sm placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner border-2 focus:bg-white"
                                />
                                {(!isValidator || !isWorkerCompleted) && (
                                    <p className="text-[9px] font-bold text-slate-400 italic px-2">Minimum 10 characters required for finalization.</p>
                                )}
                            </div>
                        )}
                        
                        {/* Fallback optional notes if no specific text action */}
                    </div>
                </div>

                {/* FIXED FOOTER: Action Hub */}
                <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-12px_48px_rgba(0,0,0,0.06)] shrink-0 z-20">
                    <div className="flex gap-4">
                        {isValidator && (
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <Button
                                    variant="outline"
                                    onClick={handleReject}
                                    disabled={loading}
                                    className="h-16 flex-1 border-2 border-rose-100 rounded-[24px] font-black uppercase text-[10px] tracking-[0.10em] text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
                                >
                                    <XCircle size={18} className="mr-2" /> Exit Protocol
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        const msg = prompt("Enter alert message for the worker:");
                                        if (msg) {
                                            setLoading(true);
                                            try {
                                                await apiService.createNotification({
                                                    recipient: lastWorkerSubmission?.performedBy,
                                                    title: "Action Required / Alert",
                                                    message: `Admin Alert for "${node.data?.label}": ${msg}`,
                                                    type: "alert",
                                                    link: `/Workflows/instances/${instance._id}`
                                                });
                                                toast.success("Alert sent to worker");
                                            } catch (err) {
                                                toast.error("Failed to send alert");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    disabled={loading}
                                    className="h-16 flex-1 border-2 border-amber-100 rounded-[24px] font-black uppercase text-[10px] tracking-[0.10em] text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all"
                                >
                                    <AlertCircle size={18} className="mr-2" /> Envoiyer Alerte
                                </Button>

                                <Button
                                    onClick={handleApprove}
                                    disabled={loading || !canValidate}
                                    className="h-16 flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <CheckCircle2 size={20} /> Validate Step
                                </Button>
                            </div>
                        )}

                        {!isValidator && (
                            <>
                            {isWorkerCompleted ? (
                                <div className="w-full flex items-center justify-center gap-3 h-16 bg-amber-50 text-amber-600 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] border border-amber-100">
                                    <Clock size={20} /> Waiting for Validation
                                </div>
                            ) : (
                                <Button
                                onClick={handleApprove}
                                disabled={
                                    loading || 
                                    !canPerform || 
                                    !!(data.linkedObjectId && !isExecuted && !String(userAction).match(/file|image/i)) || 
                                    (Boolean(String(userAction).match(/file|image/i)) && localAttachments.length === 0) ||
                                    (Boolean(String(userAction).match(/report|text|writing/i)) && comment.trim().length < 10)
                                }
                                className={`h-16 w-full ${(
                                    loading || 
                                    !canPerform || 
                                    !!(data.linkedObjectId && !isExecuted && !String(userAction).match(/file|image/i)) || 
                                    (Boolean(String(userAction).match(/file|image/i)) && localAttachments.length === 0) ||
                                    (Boolean(String(userAction).match(/report|text|writing/i)) && comment.trim().length < 10)
                                ) 
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-100 transition-transform active:scale-95'
                                } rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3`}
                            >
                                {loading ? <Clock size={20} className="animate-spin" /> : isExecuted ? <CheckCircle2 size={20} /> : <Send size={18} />}
                                {userAction === 'Fill Form' ? (isExecuted ? 'Update & Finalize' : 'Submit & Continue') :
                                 userAction === 'Approve / Reject' ? 'Authorize Progression' :
                                 (String(userAction).includes('File') || String(userAction).includes('Image')) ? (isHistoryNode ? 'Update Assets' : 'Upload & Finalize') : 
                                 isHistoryNode ? 'Update Data' : 'Finalize Stage'}
                            </Button>
                            )}
                            </>
                        )}
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default TaskExecutionPanel;