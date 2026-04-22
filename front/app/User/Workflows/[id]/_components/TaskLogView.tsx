'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/service/api.service';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PlayCircle,
  FileText,
  ClipboardList,
  Mail,
  Eye,
  MessageSquare,
  X,
  Play,
  Flag,
  Paperclip,
  Activity,
  ChevronRight,
  AlertCircle,
  ShieldAlert,
  Send,
  Users as UsersIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TaskLogViewProps {
  workflowId: string;
}

export default function TaskLogView({ workflowId }: TaskLogViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [workflow, setWorkflow] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ message: '', recipientId: '' });
  const [reportingTask, setReportingTask] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    if (workflowId === 'standard') {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [wfRes, instancesRes, usersRes] = await Promise.all([
        apiService.getWorkflowById(workflowId),
        apiService.getInstances({ workflowId }),
        apiService.getUsers()
      ]);

      if (wfRes.success) setWorkflow(wfRes.data);
      if (usersRes.success) setUsers(usersRes.data);

      if (instancesRes.success && wfRes.success) {
        const aggregatedTasks: any[] = [];
        const instances = instancesRes.data;

        const isLogicBlock = (type: string) => {
            return ['syncJoin', 'parallelStart', 'parallel_split', 'parallel_join', 'start', 'end', 'condition', 'gateway', 'split', 'join'].includes(type);
        };

        instances.forEach((inst: any) => {
          // 1. Completed/Rejected tasks
          inst.executionPath?.forEach((path: any) => {
            const nodeDef = wfRes.data.nodes?.find((n: any) => n.id === path.nodeId);
            if (!nodeDef || isLogicBlock(nodeDef.type)) return;
            
            aggregatedTasks.push({
              id: `${inst._id}-${path.nodeId}-${path.timestamp}`,
              instanceId: inst._id,
              instanceTitle: inst.title,
              nodeId: path.nodeId,
              name: nodeDef?.data?.label || 'Action Sequence',
              status: path.action === 'rejected' ? 'REJECTED' : 'COMPLETED',
              performedBy: path.performedBy,
              timestamp: path.timestamp,
              type: nodeDef?.data?.userAction === 'Fill Form' ? 'Formulaire' : 
                    nodeDef?.data?.userAction === 'Write Report' ? 'Texte' : 
                    nodeDef?.data?.userAction === 'Upload File' ? 'Fichier' :
                    (nodeDef?.data?.userAction || 'Tâche'),
              assignmentType: nodeDef?.data?.assignmentType || 'SINGLE',
              responsibleDomain: nodeDef?.data?.responsibleDomain,
              approvedBy: inst.history?.filter((h: any) => h.nodeId === path.nodeId && (h.action === 'partial_approval' || h.action === 'step_approved')).map((h: any) => h.performedBy) || [path.performedBy],
              nodeData: nodeDef?.data,
              outputData: path.outputData,
              comments: path.comments
            });
          });

          // 2. In Progress tasks
          inst.currentNodes?.forEach((curr: any) => {
            const nodeDef = wfRes.data.nodes?.find((n: any) => n.id === curr.nodeId);
            if (!nodeDef || isLogicBlock(nodeDef.type)) return;

            aggregatedTasks.push({
              id: `${inst._id}-${curr.nodeId}`,
              instanceId: inst._id,
              instanceTitle: inst.title,
              nodeId: curr.nodeId,
              name: nodeDef?.data?.label || 'Active Step',
              status: 'IN_PROGRESS',
              performedBy: null,
              timestamp: curr.startedAt,
              type: nodeDef?.data?.userAction === 'Fill Form' ? 'Formulaire' : 
                    nodeDef?.data?.userAction === 'Write Report' ? 'Texte' : 
                    nodeDef?.data?.userAction === 'Upload File' ? 'Fichier' :
                    (nodeDef?.data?.userAction || 'Tâche'),
              assignmentType: nodeDef?.data?.assignmentType || 'SINGLE',
              responsibleDomain: nodeDef?.data?.responsibleDomain,
              approvedBy: curr.approvedBy || [],
              nodeData: nodeDef?.data
            });
          });
          
          // 3. Potential tasks (Not Started)
          wfRes.data.nodes?.forEach((node: any) => {
             if (isLogicBlock(node.type)) return;
             
             const isDone = inst.executionPath?.some((p: any) => p.nodeId === node.id);
             const isInProgress = inst.currentNodes?.some((c: any) => c.nodeId === node.id);
             
             if (!isDone && !isInProgress) {
               aggregatedTasks.push({
                 id: `${inst._id}-${node.id}-not-started`,
                 instanceId: inst._id,
                 instanceTitle: inst.title,
                 nodeId: node.id,
                 name: node.data?.label || 'Future Step',
                 status: 'NOT_STARTED',
                 performedBy: null,
                 timestamp: null,
                 type: node.data?.userAction === 'Fill Form' ? 'Formulaire' : 
                       node.data?.userAction === 'Write Report' ? 'Texte' : 
                       node.data?.userAction === 'Upload File' ? 'Fichier' :
                       (node.data?.userAction || 'Tâche'),
                 assignmentType: node.data?.assignmentType || 'SINGLE',
                 responsibleDomain: node.data?.responsibleDomain,
                 approvedBy: [],
                 nodeData: node.data
               });
             }
          });
        });

        const uniqueTasks = Array.from(new Map(aggregatedTasks.map(item => [item.id, item])).values());
        setTasks(uniqueTasks.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.instanceTitle.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'ALL') return matchesSearch;
    return t.status === filter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REJECTED': return <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1.5"><XCircle size={10} /> Rejected</span>;
      case 'COMPLETED': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 size={10} /> Completed</span>;
      case 'IN_PROGRESS': return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5"><PlayCircle size={10} /> In Progress</span>;
      case 'NOT_STARTED': return <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-1.5"><Clock size={10} /> Not Started</span>;
      default: return null;
    }
  };

  const getUserName = (userId: string) => {
    if (!userId) return 'Pending';
    const user = users.find(u => u._id === userId || u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'System / Unknown';
  };

  const handleReportSubmit = async () => {
    if (!reportForm.message || !reportForm.recipientId) {
       toast.error('Please select a recipient and enter a message.');
       return;
    }

    try {
       const res = await apiService.request('/task-reports', {
          method: 'POST',
          body: JSON.stringify({
             instanceId: reportingTask.instanceId,
             nodeId: reportingTask.nodeId,
             workflowId: workflowId,
             recipientId: reportForm.recipientId,
             message: reportForm.message,
             submissionData: reportingTask.outputData
          })
       });

       if (res.success) {
          toast.success('Incident reported to user successfully.');
          setShowReportModal(false);
          setReportForm({ message: '', recipientId: '' });
       }
    } catch (err) {
       toast.error('Failed to send report.');
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-64 gap-4 animate-pulse"><Activity className="text-indigo-600 w-10 h-10" /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Processing Node Log...</p></div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 text-sm shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['ALL', 'COMPLETED', 'REJECTED', 'IN_PROGRESS', 'NOT_STARTED'].map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === opt 
                ? 'bg-slate-900 text-white shadow-xl' 
                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              {opt.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportModal(false)} className="absolute inset-0 bg-slate-900/40" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-10 w-full max-w-lg relative z-10 shadow-2xl border border-rose-100">
                <div className="flex items-center gap-4 mb-8 text-rose-600">
                   <div className="p-3 bg-rose-50 rounded-2xl">
                      <ShieldAlert size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Generate Incident Report</h3>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target User</label>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 flex items-center gap-3">
                         <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[9px]">
                            {getUserName(reportForm.recipientId).substring(0, 2)}
                         </div>
                         {getUserName(reportForm.recipientId)}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Remark / Technical Note</label>
                      <textarea
                        value={reportForm.message}
                        onChange={(e) => setReportForm({ ...reportForm, message: e.target.value })}
                        placeholder="Describe the issue or required modifications..."
                        className="w-full h-32 p-6 bg-slate-50 border-none rounded-[24px] focus:ring-4 focus:ring-rose-50 outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300 transition-all shadow-inner"
                      />
                   </div>

                   <button 
                     onClick={handleReportSubmit}
                     className="w-full py-5 bg-rose-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                   >
                     <Send size={18} /> Dispatch Report
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-slate-200 shadow-inner">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <AlertCircle size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">No actionable logs</h3>
             <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Waiting for protocol execution...</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(idx * 0.05, 0.5) }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group relative border-l-8 border-l-slate-200 hover:border-l-indigo-500"
            >
              <div className="p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                    task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                    task.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                    task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {task.type === 'Formulaire' ? <ClipboardList size={28} /> : 
                     task.type === 'Texte' ? <FileText size={28} /> : 
                     task.type === 'Fichier' ? <Paperclip size={28} /> :
                     <Activity size={28} />}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase group-hover:text-indigo-600 transition-colors">{task.name}</h4>
                    <div className="flex items-center gap-3">
                       {getStatusBadge(task.status)}
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                         {task.type}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-12 w-full xl:w-auto pt-6 xl:pt-0 border-t xl:border-t-0 border-slate-50">
                   <div className="min-w-[140px]">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 underline decoration-indigo-100 underline-offset-2">Main Operator</p>
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-black">
                            {getUserName(task.performedBy).substring(0, 2)}
                         </div>
                         <p className="text-xs font-black text-slate-700">{getUserName(task.performedBy)}</p>
                      </div>
                   </div>

                   <div className="hidden md:block text-right">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Execution Log</p>
                       <p className="text-xs font-black text-slate-700 leading-none">{task.timestamp ? new Date(task.timestamp).toLocaleDateString() : 'Pending'}</p>
                       {task.timestamp && (
                        <p className="text-[9px] font-bold text-indigo-500 mt-1 uppercase tracking-tighter opacity-80">{new Date(task.timestamp).toLocaleTimeString()}</p>
                       )}
                   </div>

                   {/* Action Buttons */}
                   <div className="flex items-center gap-3 ml-auto">
                     {(task.status === 'COMPLETED' || task.status === 'REJECTED') && (
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all text-[11px] font-black uppercase tracking-[0.1em] shadow-xl shadow-slate-200 group/btn"
                        >
                          <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                          Consult Work
                        </button>
                      )}
                      {task.performedBy && (
                        <a 
                          href={`mailto:${users.find(u => u._id === task.performedBy)?.email}?subject=Question: ${task.name}`}
                          className="p-3.5 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all shadow-sm"
                          title="Contact lead"
                        >
                          <Mail size={18} />
                        </a>
                      )}
                   </div>
                </div>
              </div>

              {/* Pool Details */}
              {task.assignmentType !== 'SINGLE' && (
                <div className="px-10 pb-8 pt-4 bg-slate-50/50 border-t border-slate-50 flex flex-wrap gap-4">
                  <div className="w-full flex items-center gap-2 mb-2">
                     <UsersIcon size={14} className="text-indigo-500" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consensus Tracking ({task.assignmentType})</span>
                     <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  {task.approvedBy?.length > 0 ? (
                    [...new Set(task.approvedBy.map(String))].map((uid: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-2 transition-all">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]"></div>
                         <span className="text-[10px] font-black text-slate-700">{getUserName(uid)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-bold text-slate-300 uppercase italic px-2 tracking-widest">Building team consensus...</p>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-900/80"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
            >
              <div className="bg-indigo-600 p-12 text-white relative overflow-hidden shrink-0">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full opacity-50"></div>
                
                <div className="flex items-center gap-6 mb-4 relative z-10">
                   <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10">
                      <FileText size={32} />
                   </div>
                   <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-70 mb-1">Process Forensic Scan</p>
                      <h2 className="text-4xl font-black tracking-tight uppercase leading-tight">{selectedTask.name}</h2>
                   </div>
                </div>
              </div>

              <div className="p-12 overflow-y-auto custom-scrollbar flex-grow bg-slate-50/30 space-y-12">
                <div className="grid grid-cols-2 gap-10 pt-6 border-t border-slate-100">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] underline decoration-indigo-200 underline-offset-4">Active Operator</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{getUserName(selectedTask.performedBy)}</p>
                    <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase opacity-70">Protocol Alignment</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] underline decoration-indigo-200 underline-offset-4">Execution Timestamp</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">{new Date(selectedTask.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] font-bold text-slate-400">{new Date(selectedTask.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="space-y-12">
                   <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                         <Activity size={18} className="text-indigo-500" /> Evidence Analysis
                      </span>
                      <div className="h-px flex-1 bg-slate-200"></div>
                   </div>

                   {selectedTask.comments && (
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={16} /> User Rational / Remarks
                         </p>
                         <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm text-lg font-bold text-slate-600 italic leading-relaxed relative border-l-8 border-l-indigo-500">
                            "{selectedTask.comments}"
                         </div>
                      </div>
                   )}

                   {selectedTask.outputData && Object.keys(selectedTask.outputData).length > 0 ? (
                    <div className="space-y-6">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Data Payload Extraction</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(selectedTask.outputData).map(([key, value]: [string, any]) => {
                            const isImageUrl = (url: string) => {
                              if (typeof url !== 'string') return false;
                              return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes('uploads/');
                            };

                            const isFileUrl = (url: string) => {
                              if (typeof url !== 'string') return false;
                              return /\.(pdf|doc|docx|xls|xlsx|zip|txt)$/i.test(url);
                            };

                            const getFullUrl = (url: string) => {
                              if (typeof url !== 'string') return url;
                              if (url.startsWith('http')) return url;
                              if (url.startsWith('uploads/')) {
                                const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
                                return `${baseUrl}/${url}`;
                              }
                              return url;
                            };

                            const renderMediaValue = (v: any) => {
                              if (isImageUrl(v)) {
                                return (
                                  <div className="relative group/img overflow-hidden rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-xl w-full">
                                     <img src={getFullUrl(v)} alt={key} className="w-full h-auto max-h-[400px] object-cover" />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={getFullUrl(v)} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-xl">
                                           <Eye size={12} /> Open Full View
                                        </a>
                                     </div>
                                  </div>
                                );
                              }
                              if (isFileUrl(v) || (typeof v === 'string' && v.startsWith('http'))) {
                                return (
                                  <a 
                                    href={getFullUrl(v)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-100 transition-all group/file w-full"
                                  >
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 text-indigo-500 group-hover/file:bg-indigo-500 group-hover/file:text-white transition-all">
                                       <Paperclip size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                       <p className="text-xs font-black text-slate-700 truncate">{String(v).split('/').pop() || 'Download Attachment'}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Click to access file</p>
                                    </div>
                                  </a>
                                );
                              }
                              return (
                                <span className="text-sm font-black text-slate-800 break-words opacity-90">
                                  {typeof v === 'boolean' ? (v ? 'YES' : 'NO') : String(v)}
                                </span>
                              );
                            };

                            return (
                              <div key={key} className={`flex flex-col gap-2 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors group/item ${Array.isArray(value) ? 'col-span-1 md:col-span-2' : ''}`}>
                                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest group-hover/item:text-indigo-600">{key.replace(/_/g, ' ')}</span>
                                 <div className="mt-1 w-full">
                                    {Array.isArray(value) ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {value.map((v, i) => (
                                          <div key={i} className="w-full">
                                            {renderMediaValue(v)}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      renderMediaValue(value)
                                    )}
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                   ) : (
                    <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 p-20 text-center opacity-70">
                       <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-6" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose">No dynamic data captured for this operator.<br/>Action confirmed via manual validation.</p>
                    </div>
                   )}
                </div>
              </div>

              <div className="p-10 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                 <button 
                   onClick={() => setSelectedTask(null)}
                   className="flex-1 py-5 bg-slate-900 text-white rounded-[26px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-2xl"
                 >
                   Exit Protocol
                 </button>
                 {selectedTask.type === 'Formulaire' && (
                    <button 
                      onClick={() => toast.info('Generating PDF document preview...')}
                      className="flex-1 py-5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-[26px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-100 transition-all"
                    >
                      <FileText size={18} /> Review Document
                    </button>
                  )}
                 <button 
                    onClick={() => { setReportingTask(selectedTask); setReportForm({ ...reportForm, recipientId: selectedTask.performedBy }); setShowReportModal(true); }}
                    className="flex-1 py-5 bg-rose-500 text-white rounded-[26px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-rose-600 transition-all shadow-xl shadow-rose-100"
                 >
                    <ShieldAlert size={18} /> Send Incident Report
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
