'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/service/api.service';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PlayCircle,
  Users,
  FileText,
  ClipboardList,
  Mail,
  Eye,
  MessageSquare,
  X,
  Activity,
  ChevronRight,
  ShieldAlert,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function GlobalTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [reportingTask, setReportingTask] = useState<any>(null);
  const [reportNote, setReportNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [instancesRes, usersRes, workflowsRes] = await Promise.all([
        apiService.getInstances(),
        apiService.getUsers(),
        apiService.getWorkflows()
      ]);

      if (usersRes.success) setUsers(usersRes.data);

      if (instancesRes.success && workflowsRes.success) {
        const aggregatedTasks: any[] = [];
        const instances = instancesRes.data;
        const workflows = workflowsRes.data;

        // Unified Logic Block Filter (Filters out non-actionable technical nodes)
        const isLogicBlock = (type: string) => {
          return ['syncJoin', 'parallelStart', 'parallel_split', 'parallel_join', 'start', 'end', 'condition', 'gateway', 'split', 'join'].includes(type);
        };

        instances.forEach((inst: any) => {
          const wf = workflows.find((w: any) => w._id === (inst.workflowId?._id || inst.workflowId));
          if (!wf) return;

          // 1. Process Completed/Rejected Tasks (Execution Path)
          inst.executionPath?.forEach((path: any) => {
            const nodeDef = wf.nodes?.find((n: any) => n.id === path.nodeId);
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
              // Map all users who contributed to this specific node instance (Consensus handling)
              approvedBy: inst.history?.filter((h: any) => h.nodeId === path.nodeId && (h.action === 'partial_approval' || h.action === 'step_approved')).map((h: any) => h.performedBy) || [path.performedBy],
              nodeData: nodeDef?.data,
              outputData: path.outputData,
              comments: path.comments,
              workflowName: wf.name
            });
          });

          // 2. Process In-Progress Tasks (Current Nodes)
          inst.currentNodes?.forEach((curr: any) => {
            const nodeDef = wf.nodes?.find((n: any) => n.id === curr.nodeId);
            if (!nodeDef || isLogicBlock(nodeDef.type)) return;

            aggregatedTasks.push({
              id: `${inst._id}-${curr.nodeId}`,
              instanceId: inst._id,
              instanceTitle: inst.title,
              nodeId: curr.nodeId,
              name: nodeDef?.data?.label || 'In Progress Step',
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
              nodeData: nodeDef?.data,
              workflowName: wf.name
            });
          });
        });

        // Unique tasks by ID and sorted by time
        const uniqueTasks = Array.from(new Map(aggregatedTasks.map(item => [item.id, item])).values());
        setTasks(uniqueTasks.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }));
      }
    } catch (error) {
      console.error('Error fetching global tasks:', error);
      toast.error('Failed to load operational tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.instanceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'ALL') return matchesSearch;
    return t.status === filter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REJECTED': return <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1.5"><XCircle size={10} /> Rejected</span>;
      case 'COMPLETED': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 size={10} /> Completed</span>;
      case 'IN_PROGRESS': return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5"><PlayCircle size={10} /> In Progress</span>;
      default: return null;
    }
  };

  const getUserName = (userId: string) => {
    if (!userId) return 'Pending';
    const user = users.find(u => u._id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'System Agent';
  };

  const getUserRole = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user?.specificRole || user?.role || 'User';
  };

  const handleReport = () => {
    if (!reportNote.trim()) return toast.error('Please enter a note for the report');
    toast.success(`Problem report sent for: ${reportingTask.name}`);
    setReportingTask(null);
    setReportNote('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity className="animate-spin text-indigo-600 w-12 h-12" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Aggregating Global Operations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <ClipboardList size={28} className="text-indigo-400" />
                  </div>
                  <h1 className="text-4xl font-black tracking-tight uppercase leading-none">Task Control Inspector</h1>
              </div>
              <p className="text-slate-400 font-medium max-w-xl text-lg">
                  Analyze every operational task across all active workflows. Technical logic blocks are excluded for focus.
              </p>
          </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-2 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['ALL', 'COMPLETED', 'IN_PROGRESS', 'REJECTED'].map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === opt 
                ? 'bg-slate-900 text-white shadow-xl' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search and Filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[22px] shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 text-sm"
          />
        </div>
      </div>

      {/* Main Task List */}
      <div className="space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-32 text-center shadow-inner">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-300">
               <ShieldAlert size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Operational Silence</h3>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">No tasks found matching your criteria</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={task.id}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group border-l-8 border-l-slate-200 hover:border-l-indigo-500"
            >
              <div className="p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 shadow-inner ${
                    task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                    task.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                    task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {task.type === 'Formulaire' ? <ClipboardList size={30} /> : 
                     task.type === 'Texte' ? <FileText size={30} /> : 
                     task.type === 'Fichier' ? <Paperclip size={30} /> :
                     <Activity size={30} />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                       <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase group-hover:text-indigo-600 transition-colors">{task.name}</h4>
                       {getStatusBadge(task.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest underline decoration-2 underline-offset-4">{task.workflowName}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.instanceTitle}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-tighter border border-slate-100">{task.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-10 w-full xl:w-auto pt-6 xl:pt-0 border-t xl:border-t-0 border-slate-50">
                   <div className="min-w-[150px]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 underline decoration-indigo-200 underline-offset-2">Main Operator</p>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-black uppercase">
                            {getUserName(task.performedBy).substring(0, 2)}
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-700 leading-none">{getUserName(task.performedBy)}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{getUserRole(task.performedBy)}</p>
                         </div>
                      </div>
                   </div>

                   <div className="hidden sm:block">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Timeline</p>
                      <p className="text-xs font-black text-slate-700">{task.timestamp ? new Date(task.timestamp).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-[9px] font-black text-emerald-500 mt-1 uppercase tracking-tighter">{task.timestamp ? new Date(task.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Waiting...'}</p>
                   </div>

                   <div className="flex items-center gap-3 ml-auto">
                     {(task.status === 'COMPLETED' || task.status === 'REJECTED') && (
                       <button 
                         onClick={() => setSelectedTask(task)}
                         className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all text-[11px] font-black uppercase tracking-[0.1em] shadow-xl shadow-slate-200 group/btn"
                       >
                         <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                         Consult Work
                       </button>
                     )}
                     <button 
                       onClick={() => setReportingTask(task)}
                       className="p-3.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 shadow-sm"
                       title="Report problem"
                     >
                       <ShieldAlert size={20} />
                     </button>
                   </div>
                </div>
              </div>

              {/* Pool / Detailed Tracking Section */}
              {task.assignmentType !== 'SINGLE' && (
                <div className="px-8 pb-8 pt-6 bg-slate-50/40 border-t border-slate-50">
                  <div className="flex items-center gap-4 mb-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-indigo-500" /> Consensus Detail ({task.assignmentType})
                     </span>
                     <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {task.approvedBy?.length > 0 ? (
                      [...new Set(task.approvedBy.map(String))].map((uid: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200/60 shadow-sm group/user hover:border-indigo-200 transition-all cursor-default">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-700 leading-none">{getUserName(uid)}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{getUserRole(uid)}</span>
                           </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Gathering team input...</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-indigo-600 p-12 text-white relative overflow-hidden shrink-0">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
                
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="absolute right-10 top-10 p-4 hover:bg-white/10 rounded-[24px] transition-all group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>

                <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                          <Eye size={24} />
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Operational Evidence</p>
                          <h2 className="text-3xl font-black tracking-tighter uppercase leading-tight">{selectedTask.name}</h2>
                       </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                         <span className="px-4 py-1.5 bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/10">{selectedTask.workflowName}</span>
                         <span className="px-4 py-1.5 bg-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/10 text-emerald-100">{selectedTask.instanceTitle}</span>
                    </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-12 overflow-y-auto custom-scrollbar space-y-12 flex-grow bg-slate-50/30">
                <div className="grid grid-cols-2 gap-12">
                   <div className="space-y-2 group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Execution Lead <ChevronRight size={10} /></p>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-lg uppercase">
                            {getUserName(selectedTask.performedBy).substring(0, 2)}
                         </div>
                         <div>
                            <p className="text-lg font-black text-slate-800 tracking-tight leading-none">{getUserName(selectedTask.performedBy)}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">{getUserRole(selectedTask.performedBy)}</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2 text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporal Scan</p>
                      <p className="text-lg font-black text-slate-800 tracking-tight leading-none">{new Date(selectedTask.timestamp).toLocaleDateString()}</p>
                      <p className="text-xs font-bold text-indigo-500 mt-1 uppercase tracking-widest">{new Date(selectedTask.timestamp).toLocaleTimeString()}</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                         <Activity size={16} className="text-indigo-500" /> Submission Data
                      </span>
                      <div className="h-px flex-1 bg-slate-200"></div>
                   </div>

                   <div className="space-y-8">
                     {selectedTask.comments && (
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              <MessageSquare size={14} /> Narrative / Rationale
                           </p>
                           <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm text-base font-bold text-slate-600 italic leading-relaxed relative">
                              "{selectedTask.comments}"
                           </div>
                        </div>
                     )}

                     {selectedTask.outputData && Object.keys(selectedTask.outputData).length > 0 ? (
                        <div className="space-y-5">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural Payload Analysis</p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(selectedTask.outputData).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex flex-col gap-2 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-50 pb-2 mb-1">{key.replace(/_/g, ' ')}</span>
                                   <span className="text-sm font-black text-slate-800 break-words">
                                     {typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value)}
                                   </span>
                                </div>
                              ))}
                           </div>
                        </div>
                     ) : (
                        <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center opacity-60">
                           <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose">Automated verification successful.<br/>No manual data fields required for this step.</p>
                        </div>
                     )}
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                 <button 
                   onClick={() => {
                     setReportingTask(selectedTask);
                     setSelectedTask(null);
                   }}
                   className="flex-1 py-5 bg-slate-900 text-white rounded-[26px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-rose-600 transition-all active:scale-95 shadow-2xl shadow-slate-100"
                 >
                   <ShieldAlert size={20} />
                   Flag Incident
                 </button>
                 <button 
                   onClick={() => setSelectedTask(null)}
                   className="px-10 py-5 bg-slate-50 text-slate-500 rounded-[26px] font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-200"
                 >
                   Close
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reporting Modal */}
      <AnimatePresence>
        {reportingTask && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportingTask(null)}
              className="absolute inset-0 bg-rose-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-rose-100"
            >
              <div className="bg-rose-600 p-10 text-white flex items-center gap-4">
                 <ShieldAlert size={32} />
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Issue Reporting</h3>
                    <p className="text-rose-100 text-xs font-bold uppercase tracking-widest opacity-80">Reference: {reportingTask.name}</p>
                 </div>
              </div>
              <div className="p-10 space-y-6">
                <textarea 
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Detail the discrepancy, error or security concern..."
                  className="w-full h-40 p-6 bg-slate-50 border-none rounded-3xl focus:outline-none focus:ring-4 focus:ring-rose-50 transition-all font-bold text-slate-700 text-sm resize-none"
                />
                <div className="flex gap-4">
                   <button 
                     onClick={handleReport}
                     className="flex-1 py-4 bg-rose-600 text-white rounded-[22px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100"
                   >
                     Submit Issue
                   </button>
                   <button 
                     onClick={() => setReportingTask(null)}
                     className="px-8 py-4 bg-white border border-slate-200 text-slate-400 rounded-[22px] font-black text-[10px] uppercase tracking-widest"
                   >
                     Cancel
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
