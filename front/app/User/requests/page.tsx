'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/service/api.service';
import { api } from '../../services/api';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ChevronRight, 
  Activity,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  FileText,
  Eye,
  X,
  Globe,
  LifeBuoy,
  History,
  Send,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

export default function UserRequestsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [activeTab, setActiveTab] = useState<'incoming' | 'submit' | 'history'>('incoming');
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'bug',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchMyReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiService.getTaskReports(false); // Only mine
      const supportRes = await api.get('/api/reports/my-reports');
      
      let combinedReports = [];
      if (res.success) {
        combinedReports = [...res.data.map((r: any) => ({ ...r, isTaskReport: true }))];
      }
      if (supportRes.data.success) {
        // Only include support reports that have a response (meaning admin replied)
        const respondedSupport = supportRes.data.data.filter((r: any) => r.response && r.status !== 'deleted');
        combinedReports = [...combinedReports, ...respondedSupport.map((r: any) => ({ ...r, isSupportReport: true }))];
      }
      
      // Sort by date
      combinedReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReports(combinedReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReports = async () => {
    try {
      setLoadingMyReports(true);
      const response = await api.get('/api/reports/my-reports');
      if (response.data.success) {
        setMyReports(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching my reports:', error);
    } finally {
      setLoadingMyReports(false);
    }
  };

  const handleTransmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Transmitting report to administration...");

    try {
      const response = await api.post('/api/reports', formData);
      if (response.data.success) {
        toast.success("Intelligence transmitted. Administrator notified.", { id: toastId });
        setFormData({ subject: '', description: '', type: 'bug', priority: 'medium' });
        fetchMyReports();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Transmission failed.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await apiService.updateTaskReportStatus(id, 'resolved', response);
      if (res.success) {
        toast.success('Response submitted to administration.');
        setSelectedReport(null);
        setResponse('');
        fetchReports();
      }
    } catch (err) {
       toast.error('Failed to submit response.');
    }
  };

  const handleDeleteReport = async (id: string) => {
    setReportToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      const res = await api.delete(`/api/reports/${reportToDelete}`);
      if (res.data.success) {
        toast.success('Report intel purged successfully.');
        setSelectedReport(null);
        setShowDeleteConfirm(false);
        setReportToDelete(null);
        fetchMyReports();
        fetchReports();
      }
    } catch (err: any) {
      console.error('❌ [ConfirmDelete] Critical Failure:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      toast.error(err.response?.data?.message || 'Failed to purge report intel.');
    }
  };

  if (loading && activeTab === 'incoming') return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><Activity className="animate-spin text-indigo-500" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Request Center...</p></div>;

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-20 -mt-20"></div>
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-3">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-rose-600 text-white rounded-3xl shadow-2xl shadow-rose-100">
                     <ShieldAlert size={32} />
                  </div>
                  <div>
                     <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Request Center</h1>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                        <Activity size={12} className="text-rose-500" /> Administrative Communication Hub
                     </p>
                  </div>
               </div>
            </div>
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setActiveTab('incoming')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'incoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <ShieldAlert size={16} />
                Action Requests ({reports.length})
              </button>
              <button 
                onClick={() => setActiveTab('submit')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'submit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <LifeBuoy size={16} />
                My Support Hub
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <History size={16} />
                History ({myReports.length})
              </button>
            </div>
         </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'incoming' ? (
          <motion.div
            key="incoming-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-6"
          >
            {reports.length === 0 ? (
              <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-slate-200">
                 <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Perfect Compliance</h3>
                 <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">No modification requests from the administration.</p>
              </div>
            ) : (
              reports.map((report, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={report._id}
                  className={`bg-white p-8 rounded-[32px] border transition-all hover:shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-l-8 ${
                     report.status === 'pending' ? 'border-rose-100 border-l-rose-500 shadow-rose-50/50' : 'border-slate-50 border-l-emerald-500'
                  }`}
                >
                   <div className="flex items-center gap-6 flex-1">
                      <div className={`p-4 rounded-2xl ${report.status === 'pending' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                         {report.status === 'pending' ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {report.isSupportReport ? 'Support Response' : `Instance: ${report.instanceId?.title || 'System Process'}`}
                         </p>
                         <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase max-w-[400px] truncate">
                           {report.isSupportReport ? report.subject : report.message}
                         </h3>
                         <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${report.status === 'pending' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                               {report.isSupportReport ? 'RESOLVED' : report.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                               <Clock size={10} /> {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 shrink-0">
                      {report.isSupportReport && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report._id);
                          }}
                          className="p-4 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-white rounded-2xl border border-transparent hover:border-rose-100 transition-all shadow-sm"
                          title="Purge Resolution"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                      <Link href={report.isSupportReport ? '#' : `/Workflows/instances/${report.instanceId?._id}`}>
                         <button 
                           onClick={(e) => {
                             if (report.isSupportReport) {
                               e.preventDefault();
                               setSelectedReport(report);
                             }
                           }}
                           className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 transition-all shadow-sm"
                         >
                            <ExternalLink size={20} />
                         </button>
                      </Link>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className={`h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                          report.status === 'pending' ? 'bg-rose-600 text-white shadow-xl shadow-rose-100' : 'bg-slate-900 text-white'
                        }`}
                      >
                         {report.isSupportReport ? <Eye size={18} /> : (report.status === 'pending' ? <MessageCircle size={18} /> : <Eye size={18} />)}
                         {report.isSupportReport ? 'View Support Resolution' : (report.status === 'pending' ? 'Respond to Feedback' : 'View Resolution')}
                      </button>
                   </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : activeTab === 'submit' ? (
          <motion.div
            key="submit-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-100/50">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Administrative Support</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Submit new intel or report system anomalies</p>
                </div>
              </div>

              <form onSubmit={handleTransmitReport} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Issue Subject</label>
                    <input 
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Briefly describe the theme"
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all font-black text-slate-700 cursor-pointer shadow-inner appearance-none uppercase text-[10px] tracking-widest"
                      >
                        <option value="bug">Report Bug</option>
                        <option value="error">Error</option>
                        <option value="help_request">Help Request</option>
                        <option value="improvement">Improvement</option>
                        <option value="question">Question</option>
                        <option value="comment">Comment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                      <select 
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all font-black text-slate-700 cursor-pointer shadow-inner appearance-none uppercase text-[10px] tracking-widest"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide as much detail as possible. If it's a bug, include steps to reproduce."
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-[32px] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-400 text-[9px] font-black uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
                    <ShieldAlert size={12} className="text-indigo-500" />
                    <span>Your ID will be transmitted automatically.</span>
                  </div>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Transmitting...' : 'Transmit Report'}
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 px-4">
              <History size={16} className="text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Support Submission History</h3>
              <div className="h-px bg-slate-100 flex-1 ml-4 opacity-50" />
            </div>

            {loadingMyReports ? (
              <div className="p-12 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">Accessing historical data...</div>
            ) : myReports.length === 0 ? (
              <div className="bg-white rounded-[32px] p-12 text-center border border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No previous submissions recorded.</p>
              </div>
            ) : (
              myReports.map((report) => (
                <div 
                  key={report._id}
                  onClick={() => setSelectedReport({...report, isUserReport: true})}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-xl ${report.status === 'resolved' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                      {report.status === 'resolved' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{report.subject}</h4>
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          report.priority === 'urgent' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>{report.priority}</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-tight">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReport(report._id);
                      }}
                      className="p-3 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                      title="Purge Intel"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <AnimatePresence>
      {selectedReport && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setSelectedReport(null)} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" 
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col"
          >
             <div className={`p-10 text-white relative ${selectedReport.status === 'pending' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                <div className="absolute top-8 right-8 flex items-center gap-2">
                  {selectedReport.isUserReport && (
                     <button 
                       onClick={() => handleDeleteReport(selectedReport._id)}
                       className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white"
                       title="Purge Intelligence"
                     >
                       <Trash2 size={20} />
                     </button>
                  )}
                  <button onClick={() => setSelectedReport(null)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">
                  {selectedReport.isUserReport ? 'Outgoing Support Intel' : 'Protocol Anomaly Investigation'}
                </p>
                <h2 className="text-3xl font-black uppercase tracking-tight">
                  {selectedReport.isUserReport ? 'Report Detail' : 'Modification Request'}
                </h2>
                {selectedReport.isUserReport && (
                   <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-white/10 w-fit rounded-lg border border-white/10">
                     <Users size={12} className="text-white/60" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Recipient: Tenant Administrator</span>
                   </div>
                )}
             </div>

             <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert size={16} /> {selectedReport.isUserReport ? 'Your Description' : 'Admin Message'}
                   </p>
                   <div className="p-8 bg-rose-50 text-rose-900 font-bold rounded-[32px] border border-rose-100 italic leading-relaxed text-lg">
                      "{selectedReport.isUserReport ? selectedReport.description : selectedReport.message}"
                   </div>
                </div>

                {selectedReport.submissionData && !selectedReport.isUserReport && (
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <FileText size={16} /> Referenced Data Payload
                       </p>
                       <div className="grid grid-cols-2 gap-3">
                          {Object.entries(selectedReport.submissionData).map(([k, v]: any) => (
                             <div key={k} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k}</p>
                                <p className="text-xs font-black text-slate-700">{String(v)}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                {selectedReport.status === 'pending' ? (
                   !selectedReport.isUserReport && (
                     <div className="space-y-4 pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                           <MessageCircle size={16} /> Resolution Logic
                        </p>
                        <textarea 
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Explain your corrective actions here..."
                          className="w-full h-32 p-6 bg-slate-50 border-none rounded-3xl focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-inner"
                        />
                        <button 
                          onClick={() => handleResolve(selectedReport._id)}
                          className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 flex items-center justify-center gap-4"
                        >
                           <CheckCircle2 size={18} /> Submit Fix
                        </button>
                     </div>
                   )
                 ) : (
                   <div className="space-y-4 pt-6 border-t border-slate-100">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle2 size={16} /> Provided Resolution
                      </p>
                      <div className="p-8 bg-emerald-50 text-emerald-900 font-bold rounded-[32px] border border-emerald-100 italic leading-relaxed">
                         "{selectedReport.response}"
                      </div>
                   </div>
                 )}
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setShowDeleteConfirm(false)} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" 
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[32px] p-10 max-w-md w-full relative z-10 shadow-2xl text-center border border-rose-100"
          >
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Confirm Purge</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Are you sure you want to permanently delete this report intelligence? This protocol is irreversible.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all"
              >
                Confirm Deletion
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
              >
                Abort Protocol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <Toaster position="top-right" richColors />
    </>
  );
}
