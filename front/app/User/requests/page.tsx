'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/service/api.service';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

export default function UserRequestsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiService.getTaskReports(false); // Only mine
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
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

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><Activity className="animate-spin text-indigo-500" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Request Center...</p></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-3">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-rose-500 text-white rounded-3xl shadow-2xl shadow-rose-100">
                     <ShieldAlert size={32} />
                  </div>
                  <div>
                     <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Action Requests</h1>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                        <Activity size={12} className="text-rose-500" /> Administrative Feedback Loop
                     </p>
                  </div>
               </div>
            </div>
            
            <div className="px-6 py-4 bg-rose-50 rounded-2xl border border-rose-100">
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1 text-center">Protocol Incidents</p>
               <p className="text-2xl font-black text-rose-700 text-center">{reports.filter(r => r.status === 'pending').length} Unresolved</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
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
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">Instance: {report.instanceId?.title || 'System Process'}</p>
                     <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase max-w-[400px] truncate">{report.message}</h3>
                     <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${report.status === 'pending' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {report.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                           <Clock size={10} /> {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 shrink-0">
                  <Link href={`/Workflows/instances/${report.instanceId?._id}`}>
                     <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl border border-transparent hover:border-slate-100 transition-all shadow-sm">
                        <ExternalLink size={20} />
                     </button>
                  </Link>
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className={`h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                      report.status === 'pending' ? 'bg-rose-600 text-white shadow-xl shadow-rose-100' : 'bg-slate-900 text-white'
                    }`}
                  >
                     {report.status === 'pending' ? <MessageCircle size={18} /> : <Eye size={18} />}
                     {report.status === 'pending' ? 'Respond to Feedback' : 'View Resolution'}
                  </button>
               </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedReport(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col"
            >
               <div className={`p-10 text-white relative ${selectedReport.status === 'pending' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                  <button onClick={() => setSelectedReport(null)} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mb-2">Protocol Anomaly Investigation</p>
                  <h2 className="text-3xl font-black uppercase tracking-tight">Modification Request</h2>
               </div>

               <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldAlert size={16} /> Admin Message
                     </p>
                     <div className="p-8 bg-rose-50 text-rose-900 font-bold rounded-[32px] border border-rose-100 italic leading-relaxed text-lg">
                        "{selectedReport.message}"
                     </div>
                  </div>

                  {selectedReport.submissionData && (
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
    </div>
  );
}
