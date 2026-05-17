"use client"

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, Activity, AlertCircle, ListChecks, ArrowRight, ShieldCheck, Users, ClipboardList, LayoutGrid, ExternalLink, FilePlus, Plus, Send, Save, CheckSquare, Image as ImageIcon, ClipboardType, Trash2, Link as Link2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';

interface TaskExecutionPanelProps {
    instance: any;
    node: any;
    workflowId?: string | null;
    onClose: () => void;
    onRefresh: () => void;
}

const TaskExecutionPanel = ({ instance, node, workflowId, onClose, onRefresh }: TaskExecutionPanelProps) => {
    const router = useRouter();
    const { can, isFullAccess } = usePermissions();
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

    // Get work submitted by node operator or predecessors (for validation)
    const incomingEdges = (instance?.workflowId?.edges || []).filter((e: any) => e.target === node.id);
    const sourceNodeIds = incomingEdges.map((e: any) => e.source);

    const lastWorkerSubmission = [...(instance?.history || [])]
        .reverse()
        .find((h: any) => 
            (h.nodeId === node.id || sourceNodeIds.includes(h.nodeId)) && 
            (h.action === 'step_submitted_for_validation' || h.action === 'step_rejected_for_validation' || h.action === 'worker_submitted' || h.action === 'worker_rejected' || h.action === 'APPROVED' || h.action === 'COMPLETED' || h.action === 'step_approved')
        );

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
                    id: `deadline-alert-${node.id}`,
                    icon: <Clock size={20} className="text-amber-500" />,
                    duration: 8000
                });
                setToastShown(deadline);
            } else if (deadlineDay < today) {
                toast.error('🚨 OVERDUE: This task has passed its deadline!', {
                    id: `deadline-alert-${node.id}`,
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
    const isValidationTask = taskType === 'validation' || taskType === 'approval' || node?.type === 'APPROVAL' || node?.type === 'VALIDATION' || data?.validationType === 'simple' || data?.validationType === 'multi' || String(data?.label || '').toLowerCase().includes('validation') || String(userAction || '').toLowerCase().includes('approve');
    const canPerform = isActive && isValidActiveNode && (!isWorkerCompleted || isValidator);
    const canValidate = canPerform && isInstanceActive && (isWorkerCompleted || isValidationTask) && isValidator;
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

    const handleOpenResource = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const url = getTaskUrl();
        if (!url) {
            toast.error('No linked resource found for this stage');
            return;
        }

        if (!data.taskType?.includes('form')) setIsExecuted(true);
        router.push(url);
        handleClose();
    };

    const getTaskUrl = () => {
        return getTaskUrlForNode(node.id);
    };

    const getTaskUrlForNode = (targetNodeId: string) => {
        const targetNode = targetNodeId === node.id ? node : instance?.workflowId?.nodes?.find((n: any) => n.id === targetNodeId);
        if (!targetNode) return null;
        const nodeData = targetNode.data || {};
        
        const isChecklist = (nodeData.taskType === 'checklist' || String(nodeData.userAction || '').toLowerCase().includes('checklist'));
        const isForm = (nodeData.taskType === 'form' || !!nodeData.formId || String(nodeData.userAction || '').toLowerCase().includes('form'));
        const isKanban = (nodeData.taskType === 'kanban' || String(nodeData.userAction || '').toLowerCase().includes('kanban'));

        const baseParams = `instanceId=${instance?._id || ''}&nodeId=${targetNodeId}&workflowId=${workflowId || ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}${isValidator ? '&consult=true' : ''}`;

        if (isForm) {
            return `/form/form2?${baseParams}${nodeData.linkedObjectId ? `&formId=${nodeData.linkedObjectId}` : ''}`;
        }
        if (isChecklist) {
            return `/checklist/designer?${baseParams}${nodeData.linkedObjectId ? `&id=${nodeData.linkedObjectId}` : ''}`;
        }
        if (isKanban) {
            return `/kanban?boardId=${nodeData.linkedObjectId}&${baseParams}`;
        }
        
        return `/${nodeData.taskType || 'task'}/${nodeData.linkedObjectId}?${baseParams}`;
    };

    const getActionLabel = () => {
        const act = String(userAction || '').toLowerCase();
        const type = String(taskType || '').toLowerCase();
        
        if (act.includes('form') || type === 'form') return 'Fill Required Form';
        if (act.includes('approve') || act.includes('reject') || type === 'validation' || type === 'approval') return 'Approve / Reject Task';
        if (act.includes('image') || act.includes('file') || type === 'upload') return 'Upload Documents';
        if (act.includes('report') || act.includes('text') || act.includes('write')) return 'Write Report';
        if (act.includes('checklist') || type === 'checklist') return 'Complete Checklist';
        
        return String(userAction || 'TECHNICAL STEP').toUpperCase();
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

    const handleCopyLink = () => {
        const url = getTaskUrl();
        if (!url) {
            toast.error('No linked resource found');
            return;
        }
        
        const fullUrl = `${window.location.origin}${url}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success('Direct link copied to clipboard!', {
            description: 'You can now share this URL or open it in a new tab.'
        });
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!attachmentId || !instance?._id) return;
        
        // Authorization check for TASK_EDIT
        if (!can('TASK_EDIT')) {
            toast.error('Matrix Restricted: Task edit authority required');
            return;
        }
        
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
            toast.warning('⚠️ Action required: You must first complete the affiliated form or the mandatory action of this step before finalizing.');
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

                        <div className="px-10 py-8 relative shrink-0">
                            <div className="relative z-10 flex items-start justify-between">
                                <div className="space-y-4 max-w-[80%]">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-2 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                                            {getActionLabel()}
                                        </div>
                                        {priority && (
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border flex items-center gap-1.5 ${priority === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${priority === 'critical' ? 'bg-red-600' : priority === 'high' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                                                {priority}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight uppercase">
                                        {data.label || 'Workflow Stage'}
                                    </h2>
                                    
                                    <div className="flex items-center gap-6 pt-2">
                                        {deadline && (
                                            <div className="flex items-center gap-2 text-rose-600">
                                                <Clock size={12} strokeWidth={3} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Due Date: {new Date(deadline).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {estimatedDuration && (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Activity size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{estimatedDuration}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-3xl shadow-sm ${isActive ? 'bg-slate-50 text-indigo-600 border border-slate-100' : 'bg-slate-50 text-slate-300'}`}>
                                    {isExecuted ? <CheckCircle2 size={24} /> : 
                                        node.type === 'start' ? <ArrowRight size={24} /> :
                                        (userAction === 'Fill Form' || taskType === 'form') ? <ClipboardList size={24} /> :
                                            (String(userAction).includes('Image') || taskType === 'upload') ? <ImageIcon size={24} /> :
                                                <AlertCircle size={24} />}
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
                                <button 
                                    onClick={(e) => handleOpenResource(e)}
                                    className={`w-full p-8 border rounded-[32px] transition-all duration-300 flex items-center justify-between group overflow-hidden relative shadow-xl ${
                                        isExecuted 
                                            ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' 
                                            : 'bg-indigo-600 border-transparent hover:bg-indigo-700 shadow-indigo-200'
                                    }`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    
                                    <div className="flex items-center gap-6 relative z-10 text-left">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isExecuted ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'}`}>
                                            {data.taskType === 'form' || String(userAction || '').toLowerCase().includes('form') ? <ClipboardList size={28} /> : <ListChecks size={28} />}
                                        </div>
                                        <div>
                                            <h4 className={`text-xl font-black uppercase tracking-tight ${isExecuted ? 'text-emerald-900' : 'text-white'}`}>
                                                {isExecuted ? 'Modify entry' : 'Fill the form'}
                                            </h4>
                                            <p className={`text-xs font-bold uppercase tracking-widest ${isExecuted ? 'text-emerald-600' : 'text-indigo-100'}`}>
                                                {isExecuted ? 'Action already validated' : 'Click to open now'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`relative z-10 p-4 rounded-2xl transition-all ${isExecuted ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600 group-hover:translate-x-2 shadow-lg shadow-black/5'}`}>
                                        <ExternalLink size={24} />
                                    </div>
                                </button>
                            </div>
                        )}

                        {data.description && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</p>
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                        {data.description}
                                    </p>
                                </div>
                            </div>
                        )}

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
                                            onClick={() => can('TASK_EDIT') && document.getElementById('exec-panel-upload')?.click()}
                                            disabled={isUploading || !can('TASK_EDIT')}
                                            title={!can('TASK_EDIT') ? "Matrix Restricted: Task edit authority required" : "Upload Assets"}
                                            className={`h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                                !can('TASK_EDIT')
                                                ? 'bg-slate-100 text-slate-300 grayscale opacity-30 blur-[0.6px] cursor-not-allowed'
                                                : localAttachments.length > 0 ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                                            }`}
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
                                                            onClick={() => can('TASK_EDIT') && handleDeleteAttachment(att._id)}
                                                            disabled={!can('TASK_EDIT')}
                                                            className={`p-1.5 rounded-lg transition-all ${
                                                                can('TASK_EDIT')
                                                                ? 'text-rose-500 hover:bg-rose-50 opacity-0 group-hover/att:opacity-100'
                                                                : 'text-slate-200 grayscale opacity-30 blur-[0.6px] cursor-not-allowed'
                                                            }`}
                                                            title={!can('TASK_EDIT') ? "Matrix Restricted" : "Delete"}
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
                                        <div className="flex items-center justify-between gap-4 w-full">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                                                    {lastWorkerSubmission.action.includes('rejected') ? <XCircle size={24} /> : <ClipboardList size={24} />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Operator Report</h4>
                                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest italic">
                                                        {lastWorkerSubmission.action.includes('rejected') ? 'Failure signal received' : 'Data submitted for validation'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    const url = getTaskUrlForNode(lastWorkerSubmission.nodeId);
                                                    if (url) {
                                                        router.push(url);
                                                        onClose();
                                                    }
                                                }}
                                                className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-10"
                                            >
                                                <ExternalLink size={14} className="mr-2" /> Open Form Response
                                            </Button>
                                        </div>
                                    
                                    {lastWorkerSubmission.comments && (
                                        <div className="bg-white/80 p-6 rounded-2xl border border-amber-100 shadow-sm">
                                            <p className="text-[11px] font-black uppercase text-amber-400 mb-2 tracking-widest">Operator Observations</p>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                                "{lastWorkerSubmission.comments}"
                                            </p>
                                        </div>
                                    )}

                                    {/* RESPONSE DATA DISPLAY */}
                                    {(lastWorkerSubmission.outputData || lastWorkerSubmission.data) && Object.keys(lastWorkerSubmission.outputData || lastWorkerSubmission.data || {}).length > 0 && (
                                        <div className="bg-white/95 p-6 rounded-2xl border border-amber-100 shadow-sm">
                                            <p className="text-[11px] font-black uppercase text-amber-400 mb-4 tracking-widest">Structured Response</p>
                                            <div className="grid grid-cols-1 gap-4">
                                                {Object.entries(lastWorkerSubmission.outputData || lastWorkerSubmission.data || {}).map(([key, val]: [string, any]) => (
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
                                             By: User (ID: {lastWorkerSubmission.performedBy ? String(lastWorkerSubmission.performedBy).slice(-6) : 'N/A'})
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
                                    placeholder={isValidator && isWorkerCompleted ? "Add a note or rejection reason (optional)..." : "Please provide a detailed report of the activities or findings..."}
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
                            <div className="flex flex-col sm:flex-row gap-6 w-full">
                                <Button
                                    variant="outline"
                                    onClick={handleReject}
                                    disabled={loading}
                                    className="h-16 flex-1 border-2 border-rose-100 rounded-[24px] font-black uppercase text-[10px] tracking-[0.15em] text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
                                >
                                    <XCircle size={18} className="mr-2" /> Reject Step
                                </Button>
                                
                                <Button
                                    onClick={handleApprove}
                                    disabled={loading || !canValidate}
                                    className={`h-16 flex-[2] shadow-xl rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 ${
                                        !canValidate
                                        ? 'bg-slate-100 text-slate-300 grayscale opacity-30 blur-[1px] cursor-not-allowed border border-slate-200 shadow-none'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                                    }`}
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
                                    disabled={loading}
                                    title={isExecuted ? "Update submission" : "Complete Task"}
                                    className={`h-16 w-full ${loading
                                        ? 'bg-slate-100 text-slate-300 animate-pulse cursor-wait'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-100 transition-transform active:scale-95'
                                    } rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3`}
                                >
                                {loading ? <Clock size={20} className="animate-spin" /> : isExecuted ? <CheckCircle2 size={20} /> : <Send size={18} />}
                                {userAction === 'Fill Form' ? (isExecuted ? 'Update & Finalize' : 'Submit & Continue') :
                                 userAction === 'Approve / Reject' ? 'Authorize Progression' :
                                 (String(userAction).includes('File') || String(userAction).includes('Image')) ? (isHistoryNode ? 'Update Assets' : 'Upload & Finalize') : 
                                 isHistoryNode ? 'Send Data' : 'Finalize Stage'}
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