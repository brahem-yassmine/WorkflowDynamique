"use client"

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, AlertCircle, ListChecks, ArrowRight, ShieldCheck, Users, ClipboardList, LayoutGrid, ExternalLink, FilePlus, Plus, Send, Save, CheckSquare, Image as ImageIcon } from 'lucide-react';
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
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (instance?.attachments) {
            setLocalAttachments(instance.attachments);
        }
    }, [instance]);

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
                const res = await apiService.approveNode(instance._id, node.id, comment);
                if (res.success) {
                    toast.success('Stage approved successfully');
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
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col rounded-[40px] overflow-hidden max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="p-8 pb-4 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
                    <div className="relative z-10 text-left">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-4 rounded-[22px] shadow-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {node.type === 'start' ? <ArrowRight size={28} strokeWidth={3} /> :
                                    userAction === 'Fill Form' || taskType === 'form' ? <ClipboardList size={28} /> :
                                        userAction === 'Upload File' || taskType === 'upload' ? <FilePlus size={28} /> :
                                            userAction === 'Approve / Reject' || taskType === 'validation' ? <ShieldCheck size={28} /> :
                                                <AlertCircle size={28} strokeWidth={3} />}
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-3 hover:bg-slate-100 rounded-2xl transition-all border-0 outline-none bg-transparent text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500/80">
                                    {userAction || 'TECHNICAL STEP'}
                                </span>
                                {isActive && <div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span></div>}
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight truncate">
                                {data.label || 'Workflow Stage'}
                            </h2>
                        </div>

                        {/* METADATA */}
                        <div className="flex flex-wrap gap-4 mt-6">
                            {priority && (
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${priority === 'critical' ? 'bg-red-600' : priority === 'high' ? 'bg-rose-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                        <span className="text-xs font-bold text-slate-700 capitalize">{priority}</span>
                                    </div>
                                </div>
                            )}
                            {estimatedDuration && (
                                <div className="flex flex-col border-l border-slate-100 pl-4">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimation</span>
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-700">{estimatedDuration}</span>
                                    </div>
                                </div>
                            )}
                            {deadline && (
                                <div className="flex flex-col border-l border-slate-100 pl-4">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
                                    <div className="flex items-center gap-2 text-rose-600">
                                        <Clock size={12} />
                                        <span className="text-xs font-bold">{new Date(deadline).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resource Output Section */}
                        {data.linkedObjectId && (
                            <div className="mt-8 space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 flex items-center gap-2">
                                    <ClipboardList size={14} /> Linked Assets & Tasks
                                </p>

                                <div className={`group relative p-6 border rounded-[28px] transition-all duration-300 ${isActive ? 'bg-emerald-50/50 border-emerald-200 shadow-lg shadow-emerald-500/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 ${isActive ? 'bg-white text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                                {data.taskType === 'form' ? <ClipboardList size={22} /> : <ListChecks size={22} />}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-black ${isActive ? 'text-emerald-900' : 'text-slate-600'}`}>
                                                    Dynamic {data.taskType?.toUpperCase() || 'ASSET'}
                                                </h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">External Integration Bound</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {isActive ? 'Active' : 'Accessible'}
                                        </div>
                                    </div>

                                    <Link
                                        href={
                                            data.taskType === 'form' ? `/form/form2?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}` :
                                                data.taskType === 'checklist' ? `/checklist?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}` :
                                                    `/${data.taskType}s/${data.linkedObjectId}?instanceId=${instance?._id || ''}&nodeId=${node.id}&workflowId=${workflowId || ''}`
                                        }
                                        onClick={handleClose}
                                        className={`w-full h-12 rounded-[18px] flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.1em] transition-all ${isActive
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-200'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200'
                                            }`}
                                    >
                                        {isActive ? 'Execute Task Now' : 'View/Fill Asset'} <ArrowRight size={16} strokeWidth={3} />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* POOL ASSIGNMENT ALERT */}
                {isActive && isAnyAssignment && (
                    <div className={`px-8 py-3 flex items-center justify-between ${isLocked ? 'bg-indigo-50 border-y border-indigo-100' : 'bg-amber-50 border-y border-amber-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isLocked ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'}`}>
                                {isLocked ? <ShieldCheck size={14} /> : <Users size={14} />}
                            </div>
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-indigo-900' : 'text-amber-900'}`}>
                                    {isLocked ? (isLockedByMe ? "You have locked this task" : "Task locked by a teammate") : "Department Pool Available"}
                                </p>
                                <p className="text-[9px] font-medium text-slate-500">
                                    {isLocked ? "Only the locker can submit progress." : "Click below to claim responsibility for this stage."}
                                </p>
                            </div>
                        </div>
                        {needsLock && (
                            <Button
                                onClick={handleLockTask}
                                disabled={loading}
                                className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black uppercase rounded-xl shadow-lg"
                            >
                                <Plus size={12} className="mr-1" /> Claim Task
                            </Button>
                        )}
                    </div>
                )}

                {/* MAIN CONTENT AREA */}
                <div className="flex-grow overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar scroll-smooth">
                    {/* SCOPE BADGES */}
                    <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1.5 bg-slate-900/5 backdrop-blur-sm border border-slate-900/10 rounded-full text-[10px] font-black uppercase text-slate-700">
                            {taskType}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-full text-indigo-600 text-[10px] font-black uppercase">
                            <ShieldCheck size={12} />
                            {data.domainScope === 'all' ? 'Organization Wide' : (data.responsibleDomain || 'Technical Domain')}
                        </div>
                    </div>

                    {/* CONFIG DISPLAY */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm"><LayoutGrid size={16} /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Configuration</p>
                                <p className="text-xs font-bold text-slate-700">{taskContent || 'Standard'}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl text-emerald-500 shadow-sm"><CheckSquare size={16} /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Action Protocol</p>
                                <p className="text-xs font-bold text-slate-700">{userAction || 'Execution'}</p>
                            </div>
                        </div>
                    </div>

                    {/* INSTRUCTIONS */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context & Guidelines</p>
                        <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-[28px]">
                            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                "{data.description || "Active step in the business process. Please follow organizational guidelines."}"
                            </p>
                        </div>
                    </div>

                    {/* TASK SPECIFIC SECTIONS */}
                    <div className="space-y-6">
                        {taskContent === 'Form' && (
                            <div className="p-6 border-2 border-indigo-100 bg-indigo-50/30 rounded-[28px] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                        <ClipboardList size={22} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-indigo-900">Data Form Required</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Structured input requested</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/form/form2?instanceId=${instance?.isKanban ? '' : (instance?._id || '')}&nodeId=${node.id}${instance?.isKanban ? `&taskId=${instance._id}` : ''}`}
                                    onClick={handleClose}
                                    className="w-full h-14 bg-indigo-600 text-white rounded-[20px] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Open Form Portal <ArrowRight size={16} />
                                </Link>
                            </div>
                        )}

                        {taskContent === 'Document' && (
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Documents</p>
                                <div className="space-y-2">
                                    {(data.attachments || []).map((att: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg"><ClipboardList size={14} /></div>
                                                <span className="text-[10px] font-bold text-slate-700">{att.filename}</span>
                                            </div>
                                            <a href={att.url} target="_blank" rel="noreferrer" className="text-xs font-black text-indigo-600 uppercase hover:underline">Download</a>
                                        </div>
                                    ))}
                                    {(!data.attachments || data.attachments.length === 0) && (
                                        <p className="text-[10px] text-slate-400 italic">No resources attached to this stage.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {taskContent === 'Image' && (
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Assets</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {(data.attachments || []).map((att: any, idx: number) => (
                                        <div key={idx} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-4 ring-transparent hover:ring-indigo-100 transition-all">
                                            <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a href={att.url} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-xl text-slate-900"><ExternalLink size={16} /></a>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data.attachments || data.attachments.length === 0) && (
                                        <p className="text-[10px] text-slate-400 italic col-span-2">No visual evidence found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. USER ACTION INTERFACE */}
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                            {userAction === 'Upload File' && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence Submission</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <input type="file" id="exec-file-upload-action" className="hidden" onChange={handleFileUpload} />
                                        <button
                                            onClick={() => document.getElementById('exec-file-upload-action')?.click()}
                                            className="h-24 bg-emerald-50/30 border-2 border-dashed border-emerald-200 rounded-[28px] flex flex-col items-center justify-center gap-2 hover:border-emerald-400 text-emerald-600 transition-all group"
                                        >
                                            <div className="p-2 bg-white rounded-xl shadow-sm ring-1 ring-emerald-100"><FilePlus size={20} /></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Click to upload file</span>
                                        </button>
                                    </div>
                                    {localAttachments.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {localAttachments.map((att, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                                    <span className="text-[9px] font-bold text-slate-600 truncate">{att.filename}</span>
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {userAction === 'Write Report' && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Report</p>
                                    <Textarea
                                        placeholder="Enter detailed stage report here..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="min-h-[180px] rounded-[32px] bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 transition-all p-8 text-sm shadow-inner"
                                    />
                                </div>
                            )}

                            {userAction === 'Approve / Reject' && (
                                <div className="p-8 bg-amber-50/50 border border-amber-100 rounded-[32px] flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Validation Protocol</h4>
                                        <p className="text-xs text-amber-700 font-medium leading-relaxed">Your authorization is required to progress this workflow to the next sequence.</p>
                                    </div>
                                </div>
                            )}

                            {/* Optional Remark */}
                            {userAction !== 'Write Report' && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Remark (Optional)</p>
                                    <Textarea
                                        placeholder="Add any observations or notes..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="min-h-[120px] rounded-[28px] bg-slate-50/50 border-none p-6 text-sm shadow-inner"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {!isInstanceActive && (
                        <div className="p-4 rounded-2xl border flex items-center justify-center gap-3 shadow-sm bg-slate-50 border-slate-200/60 text-slate-400">
                            <AlertCircle size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Workflow {instance?.status?.toUpperCase() || 'FINALISED'} - Read Only
                            </span>
                        </div>
                    )}
                </div>

                {/* FOOTER BUTTONS */}
                <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-12px_40px_rgba(0,0,0,0.03)]">
                    {needsLock ? (
                        <div className="flex flex-col items-center gap-5 text-center p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <div className="p-5 bg-white rounded-[28px] text-amber-500 shadow-sm ring-1 ring-slate-100"><Users size={32} /></div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Departmental Task Available</h4>
                                <p className="text-[10px] text-slate-500 font-bold max-w-[320px]">This stage is assigned to your department. Claim it to begin the execution protocol.</p>
                            </div>
                            <Button
                                onClick={handleLockTask}
                                disabled={loading}
                                className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-amber-200"
                            >
                                <Plus size={16} className="mr-2" /> Claim & Lock Stage
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            {showButtons && (
                                <>
                                    {(userAction === 'Approve / Reject' || canValidate) && (
                                        <Button
                                            variant="ghost"
                                            onClick={handleReject}
                                            disabled={loading}
                                            className="h-16 flex-1 border-2 border-slate-100 rounded-[24px] font-black uppercase text-[10px] tracking-widest text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all"
                                        >
                                            <XCircle size={18} className="mr-2" /> Reject Step
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleApprove}
                                        disabled={loading || !canPerform}
                                        className={`h-16 ${(userAction === 'Approve / Reject' || canValidate) ? 'flex-[1.5]' : 'w-full'} bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {loading ? <Clock size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                            {userAction === 'Approve / Reject' ? 'Authorize Completion' :
                                                userAction === 'Fill Form' ? 'Submit Data' :
                                                    userAction === 'Upload File' ? 'Upload & Complete' :
                                                        userAction === 'Write Report' ? 'Submit Report' :
                                                            'Finalize Stage'}
                                        </div>
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default TaskExecutionPanel;