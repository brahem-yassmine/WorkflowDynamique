'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/service/api.service';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PlayCircle,
  Users,
  Bell,
  ChevronDown,
  FileText,
  ClipboardList,
  AlertCircle,
  Mail,
  Eye,
  MessageSquare,
  X,
  Play,
  Flag,
  GitMerge,
  GitFork,
  Paperclip
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

  useEffect(() => {
    fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, instancesRes, usersRes] = await Promise.all([
        apiService.getWorkflowById(workflowId),
        apiService.getInstances({ workflowId }),
        apiService.getUsers()
      ]);

      if (wfRes.success) setWorkflow(wfRes.data);
      if (usersRes.success) setUsers(usersRes.data);

      if (instancesRes.success) {
        const aggregatedTasks: any[] = [];
        const instances = instancesRes.data;

        instances.forEach((inst: any) => {
          // Add Completed/Rejected tasks from executionPath
          inst.executionPath?.forEach((path: any) => {
            const nodeDef = wfRes.data.nodes?.find((n: any) => n.id === path.nodeId);
            if (nodeDef?.type === 'syncJoin' || nodeDef?.type === 'parallelStart') return;
            
            aggregatedTasks.push({
              id: `${inst._id}-${path.nodeId}-${path.timestamp}`,
              instanceId: inst._id,
              instanceTitle: inst.title,
              nodeId: path.nodeId,
              name: nodeDef?.data?.label || 'Unknown Task',
              status: path.action === 'rejected' ? 'REJECTED' : 'COMPLETED',
              performedBy: path.performedBy,
              timestamp: path.timestamp,
              type: nodeDef?.type === 'start' ? 'Début' : 
                    nodeDef?.type === 'end' ? 'Fin' :
                    nodeDef?.type === 'syncJoin' ? 'Sync Join' :
                    nodeDef?.type === 'parallelStart' ? 'Start Parallel' :
                    nodeDef?.data?.userAction === 'Fill Form' ? 'Formulaire' :
                    nodeDef?.data?.userAction === 'Write Report' ? 'Texte' :
                    nodeDef?.data?.userAction === 'Upload File' ? 'Fichier' :
                    (nodeDef?.data?.userAction || 'Tâche'),
              assignmentType: nodeDef?.data?.userAction === 'Approver' ? 'SINGLE' : (nodeDef?.data?.assignmentType || 'SINGLE'),
              responsibleDomain: nodeDef?.data?.responsibleDomain,
              approvedBy: [path.performedBy], 
              nodeData: nodeDef?.data,
              outputData: path.outputData,
              comments: path.comments
            });
          });

          // Add In Progress tasks from currentNodes
          inst.currentNodes?.forEach((curr: any) => {
            const nodeDef = wfRes.data.nodes?.find((n: any) => n.id === curr.nodeId);
            if (nodeDef?.type === 'syncJoin' || nodeDef?.type === 'parallelStart') return;

            aggregatedTasks.push({
              id: `${inst._id}-${curr.nodeId}`,
              instanceId: inst._id,
              instanceTitle: inst.title,
              nodeId: curr.nodeId,
              name: nodeDef?.data?.label || 'Unknown Task',
              status: 'IN_PROGRESS',
              performedBy: null,
              timestamp: curr.startedAt,
              type: nodeDef?.type === 'start' ? 'Début' : 
                    nodeDef?.type === 'end' ? 'Fin' :
                    nodeDef?.type === 'syncJoin' ? 'Sync Join' :
                    nodeDef?.type === 'parallelStart' ? 'Start Parallel' :
                    nodeDef?.data?.userAction === 'Fill Form' ? 'Formulaire' :
                    nodeDef?.data?.userAction === 'Write Report' ? 'Texte' :
                    nodeDef?.data?.userAction === 'Upload File' ? 'Fichier' :
                    (nodeDef?.data?.userAction || 'Tâche'),
              assignmentType: nodeDef?.data?.assignmentType || 'SINGLE',
              responsibleDomain: nodeDef?.data?.responsibleDomain,
              approvedBy: curr.approvedBy || [],
              nodeData: nodeDef?.data
            });
          });
          
          wfRes.data.nodes?.forEach((node: any) => {
             if (node.type === 'syncJoin' || node.type === 'parallelStart') return;
             
             const isDone = inst.executionPath?.some((p: any) => p.nodeId === node.id);
             const isInProgress = inst.currentNodes?.some((c: any) => c.nodeId === node.id);
             
             if (!isDone && !isInProgress) {
               aggregatedTasks.push({
                 id: `${inst._id}-${node.id}-not-started`,
                 instanceId: inst._id,
                 instanceTitle: inst.title,
                 nodeId: node.id,
                 name: node.data?.label || 'Unknown Task',
                 status: 'NOT_STARTED',
                 performedBy: null,
                 timestamp: null,
                 type: node.type === 'start' ? 'Début' : 
                       node.type === 'end' ? 'Fin' :
                       node.type === 'syncJoin' ? 'Sync Join' :
                       node.type === 'parallelStart' ? 'Start Parallel' :
                       node.data?.userAction === 'Fill Form' ? 'Formulaire' :
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

        setTasks(aggregatedTasks.sort((a, b) => {
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

  const handleNotify = (task: any) => {
    toast.success(`Notification sent to team members for task: ${task.name}`);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.instanceTitle.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'ALL') return matchesSearch;
    if (filter === 'REJECTED') return t.status === 'REJECTED' && matchesSearch;
    if (filter === 'COMPLETED') return t.status === 'COMPLETED' && matchesSearch;
    if (filter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' && matchesSearch;
    if (filter === 'NOT_STARTED') return t.status === 'NOT_STARTED' && matchesSearch;
    return matchesSearch;
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
    const user = users.find(u => u._id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'System / Unknown';
  };

  const getMissingAssignees = (task: any) => {
    if (!task.responsibleDomain) return [];
    const domainUsers = users.filter(u => u.domain === task.responsibleDomain);
    const approvedIds = task.approvedBy?.map((id: any) => id.toString()) || [];
    return domainUsers.filter(u => !approvedIds.includes(u._id.toString()));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by task or instance..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['ALL', 'COMPLETED', 'REJECTED', 'IN_PROGRESS', 'NOT_STARTED'].map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === opt 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {opt.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <AlertCircle size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight">No actions logged yet</h3>
             <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Lattice is currently silent</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 1) }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                    task.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                    task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {task.type === 'Formulaire' ? <ClipboardList size={28} /> : 
                     task.type === 'Texte' ? <FileText size={28} /> : 
                     task.type === 'Fichier' ? <Paperclip size={28} /> :
                     task.type === 'Début' ? <Play size={28} /> :
                     task.type === 'Fin' ? <Flag size={28} /> :
                     task.type === 'Sync Join' ? <GitMerge size={28} /> :
                     task.type === 'Start Parallel' ? <GitFork size={28} /> :
                     <CheckCircle2 size={28} />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">{task.name}</h4>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{task.instanceTitle}</p>
                    <div className="flex items-center gap-3 mt-2">
                       {getStatusBadge(task.status)}
                       <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                         <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                         {task.type}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Execution</p>
                      <p className="text-xs font-bold text-slate-700">{task.performedBy ? getUserName(task.performedBy) : 'Pending'}</p>
                      {task.timestamp && (
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">{new Date(task.timestamp).toLocaleString()}</p>
                      )}
                   </div>

                   {/* Action Buttons for Completed Tasks */}
                   {(task.status === 'COMPLETED' || task.status === 'REJECTED') && (
                      <div className="flex items-center gap-2 pl-6 border-l border-slate-100">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm group"
                        >
                          <Eye size={14} className="group-hover:scale-110 transition-transform" />
                          Consult Work
                        </button>
                        {task.performedBy && (
                          <a 
                            href={`mailto:${users.find(u => u._id === task.performedBy)?.email}?subject=Question about task: ${task.name}`}
                            className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-emerald-100"
                            title="Contact user"
                          >
                            <Mail size={16} />
                          </a>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* Pool Details */}
              {(task.assignmentType === 'ALL' || task.assignmentType === 'ANY') && (
                <div className="px-8 pb-6 pt-2 bg-slate-50/30 border-t border-slate-50 flex flex-wrap gap-4">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest w-full">Detailed Tracking</span>
                  {task.approvedBy?.map((uid: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-sm">
                       <CheckCircle2 size={10} className="text-emerald-500" />
                       <span className="text-[9px] font-bold text-slate-600">{getUserName(uid)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/20 flex flex-col max-h-[85vh]"
            >
              <div className="bg-indigo-600 p-10 text-white relative overflow-hidden shrink-0">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="absolute right-8 top-8 p-3 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4 mb-2">
                   <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <FileText size={20} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Task Analysis Report</p>
                </div>
                <h2 className="text-4xl font-black tracking-tight uppercase leading-tight mb-2">{selectedTask.name}</h2>
                <p className="text-indigo-100/70 font-bold text-sm tracking-wide lowercase">{selectedTask.instanceTitle}</p>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar space-y-10 flex-grow">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Performed By</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight">{getUserName(selectedTask.performedBy)}</p>
                    <p className="text-xs font-bold text-slate-400">{selectedTask.performedBy && users.find(u => u._id === selectedTask.performedBy)?.email}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Completion Date</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight">{new Date(selectedTask.timestamp).toLocaleDateString()}</p>
                    <p className="text-xs font-bold text-slate-400">{new Date(selectedTask.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Work Data */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-slate-100"></div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                         <ClipboardList size={12} /> Work Submission Details
                      </span>
                      <div className="h-[1px] flex-1 bg-slate-100"></div>
                   </div>

                   <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 space-y-6">
                      {selectedTask.comments && (
                         <div className="space-y-2">
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                               <MessageSquare size={10} /> User Comments
                            </p>
                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-medium text-slate-600 italic leading-relaxed">
                               "{selectedTask.comments}"
                            </div>
                         </div>
                      )}

                      {selectedTask.outputData && Object.keys(selectedTask.outputData).length > 0 ? (
                        <div className="space-y-4">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Form / Data Payload</p>
                           <div className="grid grid-cols-1 gap-3">
                              {Object.entries(selectedTask.outputData).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex flex-col gap-1 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{key.replace(/_/g, ' ')}</span>
                                   <span className="text-sm font-bold text-slate-700">
                                     {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                   </span>
                                </div>
                              ))}
                           </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                           <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3 opacity-30" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Task completed without additional data</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                 <a 
                   href={`mailto:${users.find(u => u._id === selectedTask.performedBy)?.email}?subject=Question about task: ${selectedTask.name}`}
                   className="flex-1 py-4 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
                 >
                   <Mail size={18} />
                   Send Clarification Email
                 </a>
                 <button 
                   onClick={() => setSelectedTask(null)}
                   className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-slate-50 transition-all"
                 >
                   Close
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
