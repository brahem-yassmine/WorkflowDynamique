"use client"

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, AlertCircle, ListChecks, ArrowRight, ShieldCheck, Users, ClipboardList, LayoutGrid, ExternalLink, FilePlus, Plus, Send, Save, CheckSquare, Image as ImageIcon, ClipboardType } from 'lucide-react';
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
                            (isExecutedParam && nodeIdParam === node.id) ||
                            ((userAction === 'Upload File' || userAction === 'Upload Image') && instance?.attachments?.length > 0);

        setIsExecuted(!!nodeExecuted);
        if (instance?.variables) {
            setVariables(instance.variables);
        }
    }, [instance, node.id, searchParams]);

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

    const data = node?.data || {};
    const {
        taskContent,
        userAction,
        priority,
        estimatedDuration,
        deadline,
        taskType = 'normal'
    } = data;

    const isLocked = !!instance?.lockedBy;
    const isLockedByMe = instance?.lockedBy === currentUser?._id;
    const isAnyAssignment = data.assignmentType === 'ANY';
    const canPerformAny = isAnyAssignment && (!isLocked || isLockedByMe);
    const needsLock = isAnyAssignment && !isLocked;
    const isHistoryNode = instance?.currentNodes ? !instance.currentNodes.some((cn: any) => cn.nodeId === node.id) : false;

    const isActive = instance?.status === 'active' || instance?.status === 'in_progress' || instance?.status === 'pending';
    const isInstanceActive = !instance || ['active', 'in_progress', 'pending'].includes(instance.status);
    const canPerform = isActive || node.type === 'start';
    const canValidate = canPerform && isInstanceActive;
    const showButtons = canPerform || canValidate;

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

    const handleApprove = async () => {
        if (loading || !instance?._id) return;
        
        // Safety check if execution is required
        if (data.linkedObjectId && !isExecuted) {
            toast.warning('You must execute the required task before finalising this stage.');
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
                const nodeDataPayload = variables[node.id] || variables[`${node.id}_data`] || {};
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
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 ${isExecuted ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 group-hover:scale-110'}`}>
                                                {data.taskType === 'form' ? <ClipboardList size={26} /> : <ListChecks size={26} />}
                                            </div>
                                            <div>
                                                <h4 className={`text-lg font-black ${isExecuted ? 'text-emerald-900' : 'text-slate-800'}`}>
                                                    {String(data.taskType || 'Task').toUpperCase()} Required
                                                </h4>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Submit details to continue</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isExecuted ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-600'}`}>
                                            {isExecuted ? 'Completed' : 'Mandatory'}
                                        </div>
                                    </div>

                                    {(data.taskType === 'form' || data.taskType === 'checklist' || data.taskType === 'kanban' || data.formId) ? (
                                        <Link
                                            href={
                                                (data.taskType === 'form' || !!data.formId || String(userAction || '').toLowerCase().includes('form')) 
                                                    ? `/form/form2?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}${data.linkedObjectId ? `&formId=${data.linkedObjectId}` : ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}` :
                                                (data.taskType === 'checklist' || String(userAction || '').toLowerCase().includes('checklist')) 
                                                    ? `/checklist/designer?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}${data.linkedObjectId ? `&id=${data.linkedObjectId}` : ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}` :
                                                data.taskType === 'kanban' 
                                                    ? `/kanban?boardId=${data.linkedObjectId}&instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}` :
                                                `/${data.taskType || 'task'}/${data.linkedObjectId}?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}&from=${typeof window !== 'undefined' ? window.location.pathname : ''}`
                                            }
                                            onClick={() => {
                                                if (!data.taskType?.includes('form')) setIsExecuted(true);
                                                handleClose();
                                            }}
                                            className={`w-full h-14 rounded-[22px] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.15em] transition-all ${isExecuted
                                                ? 'bg-indigo-900 text-white hover:bg-slate-800 shadow-lg shadow-emerald-100'
                                                : isActive ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isExecuted ? 'Modify My Submission' : 'Complete Required Action'} 
                                            {isExecuted ? <CheckCircle2 size={18} /> : <ExternalLink size={18} />}
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => setIsExecuted(true)}
                                            className={`w-full h-14 rounded-[22px] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.15em] transition-all ${isExecuted
                                                ? 'bg-emerald-600 text-white shadow-lg'
                                                : isActive ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {isExecuted ? 'Action Confirmed' : 'Mark Task as Executed'}
                                            {isExecuted ? <CheckCircle2 size={18} /> : <Send size={18} />}
                                        </button>
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
                                                {String(userAction).includes('Image') ? "Upload Image Report" : "Upload File Asset"}
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
                                            {localAttachments.length > 0 ? "Add More Items" : "Click to Upload"}
                                        </Button>
                                    </div>

                                    {localAttachments.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3 mt-8 pt-8 border-t border-emerald-100">
                                            {localAttachments.map((att, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm group/att">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <CheckSquare size={14} className="text-emerald-500 shrink-0" />
                                                        <a 
                                                            href={att.url || '#'} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-bold text-slate-600 truncate hover:text-indigo-600 transition-colors underline-offset-4 hover:underline"
                                                        >
                                                            {att.filename}
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center gap-2">
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

                        {/* 4. TEXT AREAS */}
                        {(String(userAction).toLowerCase().includes('report') || String(userAction).toLowerCase().includes('text') || userAction === 'Write Report') && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Section: Mandatory Report & Synthesis
                                    </p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${comment.trim().length > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {comment.trim().length > 10 ? 'Satisfied' : 'Required'}
                                    </span>
                                </div>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Please provide a detailed report of the activities or findings..."
                                    className="min-h-[220px] rounded-[32px] bg-slate-50 border-slate-100 p-8 text-sm placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner border-2 focus:bg-white"
                                />
                                <p className="text-[9px] font-bold text-slate-400 italic px-2">Minimum 10 characters required for finalization.</p>
                            </div>
                        )}
                        
                        {/* Fallback optional notes if no specific text action */}
                        {!(String(userAction).toLowerCase().includes('report') || String(userAction).toLowerCase().includes('text') || userAction === 'Write Report') && (
                             <div className="space-y-4 pt-10 border-t border-slate-50">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                                    Internal Observations (Optional)
                                </p>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Enter optional notes for the audit trail..."
                                    className="min-h-[120px] rounded-[24px] bg-slate-50/50 border-slate-100 p-6 text-sm placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-50/20 transition-all"
                                />
                             </div>
                        )}
                    </div>
                </div>

                {/* FIXED FOOTER: Action Hub */}
                <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-12px_48px_rgba(0,0,0,0.06)] shrink-0 z-20">
                    <div className="flex gap-4">
                        {userAction === 'Approve / Reject' && (
                            <Button
                                variant="outline"
                                onClick={handleReject}
                                disabled={loading}
                                className="h-16 flex-1 border-2 border-slate-100 rounded-[24px] font-black uppercase text-[10px] tracking-[0.15em] text-rose-500 hover:bg-rose-50/50 hover:border-rose-200 transition-all"
                            >
                                <XCircle size={18} className="mr-2" /> Reject Step
                            </Button>
                        )}
                        <Button
                            onClick={handleApprove}
                            disabled={
                                loading || 
                                !canPerform || 
                                (data.linkedObjectId && !isExecuted) || 
                                ((String(userAction).includes('File') || String(userAction).includes('Image')) && localAttachments.length === 0) ||
                                ((String(userAction).toLowerCase().includes('report') || String(userAction).toLowerCase().includes('text')) && comment.trim().length < 10)
                            }
                            className={`h-16 ${(userAction === 'Approve / Reject' || canValidate) ? 'flex-[1.8]' : 'w-full'} ${(
                                loading || 
                                !canPerform || 
                                (data.linkedObjectId && !isExecuted) || 
                                ((String(userAction).includes('File') || String(userAction).includes('Image')) && localAttachments.length === 0) ||
                                ((String(userAction).toLowerCase().includes('report') || String(userAction).toLowerCase().includes('text')) && comment.trim().length < 10)
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
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default TaskExecutionPanel;