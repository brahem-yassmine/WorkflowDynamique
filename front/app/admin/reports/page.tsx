'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  AlertCircle, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  History,
  LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { api } from '../../services/api';

interface Report {
  _id: string;
  subject: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'bug',
    priority: 'medium'
  });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/reports/my-reports');
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Establishing connection with support hub...");

    try {
      console.log('📤 Submitting report payload:', formData);
      const response = await api.post('/api/reports', formData);
      
      if (response.data.success) {
        toast.success("Intelligence transmitted. Super Admin has been notified.", { id: toastId });
        setFormData({ subject: '', description: '', type: 'bug', priority: 'medium' });
        fetchReports();
        setActiveTab('history');
      } else {
        toast.error(response.data.message || "Failed to transmit report.", { id: toastId });
      }
    } catch (error: any) {
      console.error('❌ Transmission error:', error);
      const errorMsg = error.response?.data?.message || "Transmission failed. Support node unreachable.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'in_review': return <MessageSquare size={16} className="text-blue-500" />;
      case 'resolved': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'closed': return <AlertCircle size={16} className="text-slate-500" />;
      default: return <LifeBuoy size={16} className="text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <LifeBuoy size={28} />
            </div>

            Support & Reports
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Communicate with our super administrators for any issues or feedback.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button 
            onClick={() => {
                setActiveTab('new');
                setFormData({ subject: '', description: '', type: 'bug', priority: 'medium' });
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <MessageSquare size={18} />
            Submit New
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <History size={18} />
            History ({reports.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'new' ? (
          <motion.div
            key="new-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Issue Subject</label>
                  <input 
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Briefly describe the theme"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="bug">Report Bug</option>
                      <option value="error">Error</option>
                      <option value="help_request">Help Request</option>
                      <option value="improvement">Feature Request</option>
                      <option value="question">General Inquiry</option>
                      <option value="comment">Add Comment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Detailed Description</label>
                <textarea 
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Provide as much detail as possible. If it's a bug, include steps to reproduce."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-slate-50 px-4 py-2 rounded-xl">
                  <AlertTriangle size={14} />
                  <span>Your tenant information will be sent automatically.</span>
                </div>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-300 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Transmit Report'}
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="history-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold">Loading your report history...</div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="text-slate-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No reports submitted yet</h3>
                <p className="text-slate-500 mt-2">When you submit issues, they will appear here for tracking.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div 
                  key={report._id} 
                  onClick={() => {
                    setSelectedReport(report);
                    setIsDetailModalOpen(true);
                  }}
                  className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold border border-slate-100 uppercase tracking-tight">
                        {report.type === 'bug' ? 'Bug' : 
                         report.type === 'error' ? 'Error' :
                         report.type === 'help_request' ? 'Help Request' :
                         report.type === 'improvement' ? 'Feature' :
                         report.type === 'question' ? 'Inquiry' :
                         report.type === 'comment' ? 'Comment' : report.type}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100 uppercase tracking-tight">
                        <Send size={10} />
                        Sent to: Super Admin
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-black text-slate-900">{report.subject}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{report.description}</p>
                    </div>

                    <div className="md:w-64 space-y-3">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</span>
                          {getStatusIcon(report.status)}
                        </div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{report.status.replace('_', ' ')}</p>
                      </div>

                      {report.response && (
                        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Reply from Admin</span>
                            {report.respondedAt && (
                                <span className="text-[9px] font-bold text-indigo-300">{new Date(report.respondedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-700 italic">"{report.response}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-right" richColors />

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(selectedReport.priority)}`}>
                      {selectedReport.priority} Priority
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(selectedReport.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedReport.subject}</h2>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <AlertCircle size={20} className="rotate-45" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 pt-4 overflow-y-auto custom-scrollbar space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} />
                    Issue Description
                  </h3>
                  <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 text-slate-700 leading-relaxed font-medium">
                    {selectedReport.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Status</span>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(selectedReport.status)}
                      <span className="font-black text-slate-800 uppercase tracking-tight">
                        {selectedReport.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issue Type</span>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-indigo-500" />
                      <span className="font-black text-slate-800 uppercase tracking-tight">
                        {selectedReport.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReport.response && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      Administrator Response
                    </h3>
                    <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100 text-slate-700 leading-relaxed font-medium italic relative">
                      <div className="absolute -top-3 right-6 bg-white px-4 py-1 rounded-full border border-indigo-100 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                        Reply from Super Admin
                      </div>
                      "{selectedReport.response}"
                      {selectedReport.respondedAt && (
                        <div className="mt-4 pt-4 border-t border-indigo-100 text-[10px] font-bold text-indigo-300">
                          Responded on {new Date(selectedReport.respondedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 pt-0 mt-auto">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
