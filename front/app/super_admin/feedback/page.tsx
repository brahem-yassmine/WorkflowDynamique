"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
    MessageSquare, 
    Search, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ChevronRight, 
    Building2,
    Workflow,
    User,
    Send,
    Check,
    X,
    Filter,
    ArrowRight,
    CornerDownRight,
    Zap,
    Shield,
    Layers,
    LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showAlert, showConfirm } from '@/lib/alerts';

type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'closed';

interface SystemReport {
    _id: string;
    tenantId: { _id: string; name: string; email: string };
    adminId: string;
    adminEmail: string;
    subject: string;
    description: string;
    type: string;
    priority: string;
    status: ReportStatus;
    response?: string;
    createdAt: string;
    respondedAt?: string;
}

export default function FeedbackPage() {
    const [reports, setReports] = useState<SystemReport[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");
    const [selectedReport, setSelectedReport] = useState<SystemReport | null>(null);
    const [groupingMode, setGroupingMode] = useState<'user' | 'company' | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [decision, setDecision] = useState<'ACCEPT' | 'REJECT' | 'RESPOND' | null>(null);
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/reports/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setReports(data.data);
            }
        } catch (error) {
            console.error("Error fetching reports", error);
        } finally {
            setLoading(false);
        }
    };

    // Define the hubs
    const totalGlobalReports = reports.length;
    const hubs = [
        { id: "ALL", name: "All Global Reports", count: totalGlobalReports, icon: <Layers size={14} /> },
        { id: "WORKFLOW", name: "Workflow Reports", count: reports.filter(r => r.type?.toLowerCase() === 'workflow').length, icon: <Workflow size={14} /> },
        { id: "COMPANIES", name: "Companies Reports", count: reports.filter(r => r.type?.toLowerCase() !== 'workflow').length, icon: <Building2 size={14} /> }
    ];

    // Multi-mode filtering and grouping
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const isWorkflow = report.type?.toLowerCase() === 'workflow';
            const matchesHub = selectedCompanyId === "ALL" || 
                               (selectedCompanyId === "WORKFLOW" && isWorkflow) ||
                               (selectedCompanyId === "COMPANIES" && !isWorkflow);
            const matchesSearch = report.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  report.subject?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesHub && matchesSearch;
        });
    }, [reports, selectedCompanyId, searchTerm]);

    const groupedData = useMemo(() => {
        // First group by the selected mode if it's user or company
        let grouped: Record<string, SystemReport[]> = {};

        // Always group into NEW and OLD as primary or secondary? The user screenshot shows "NEW" as the main header.
        // Let's group all by NEW / OLD. The tabs at the top (user/company/all) can be used for secondary filtering later,
        // or we just group by NEW/OLD first. Let's group by "NEW" and "OLD".
        const newReports = filteredReports.filter(r => r.status === 'pending');
        const oldReports = filteredReports.filter(r => r.status !== 'pending');

        if (groupingMode === 'all') {
            grouped = {};
            if (newReports.length > 0) grouped['NEW'] = newReports;
            if (oldReports.length > 0) grouped['OLD'] = oldReports;
            return grouped;
        }

        // If grouped by user or company, we can group them then prefix with NEW/OLD or just group by user/company.
        // Given the request, "group by user/company/all", maybe the user wants the header to be the user/company name.
        if (groupingMode === 'user' || groupingMode === 'company') {
            return filteredReports.reduce((acc, report) => {
                const key = groupingMode === 'company' ? (report.tenantId?.name || 'Unknown') : (report.adminEmail || 'Unknown');
                const finalKey = report.status === 'pending' ? `NEW - ${key}` : `OLD - ${key}`;
                if (!acc[finalKey]) acc[finalKey] = [];
                acc[finalKey].push(report);
                return acc;
            }, {} as Record<string, SystemReport[]>);
        }

        return grouped;
    }, [filteredReports, groupingMode]);

    const handleDecision = (type: 'ACCEPT' | 'REJECT' | 'RESPOND') => {
        setDecision(type);
    };

    const handleSubmit = async () => {
        if (!selectedReport) return;
        
        // Map decision to status
        let newStatus: ReportStatus = 'in_review';
        if (decision === 'ACCEPT') newStatus = 'resolved';
        if (decision === 'REJECT') newStatus = 'closed';
        if (decision === 'RESPOND') newStatus = 'in_review';
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/reports/${selectedReport._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    response: response.trim() || undefined
                })
            });

            const data = await res.json();
            if (data.success) {
                // Update local state and show alert
                setReports(prev => prev.map(r => 
                    r._id === selectedReport._id ? { ...r, status: newStatus, response: response.trim() } : r
                ));
                setSelectedReport(prev => prev ? { ...prev, status: newStatus, response: response.trim() } : null);

                const isResponding = response.trim().length > 0;
                await showAlert('Transmission Complete', `Status: ${newStatus}\n${isResponding ? 'Response Sent' : 'Protocol Only'}`, 'success');
                
                setDecision(null);
                setResponse("");
            } else {
                await showAlert('Update Error', 'Error updating report: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error submitting response:', error);
            await showAlert('Connection Error', 'Failed to connect to the server.', 'error');
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-0 bg-slate-50/50 overflow-hidden border border-slate-100 rounded-3xl m-2 shadow-sm">
            {/* 1. COMPANY SIDEBAR */}
            <div className="w-64 bg-white border-r border-slate-100 flex flex-col pt-8 shadow-sm relative z-10">
                <div className="px-6 mb-10">
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <Shield size={14} />
                            </div>
                            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">Intelligence Hub</h2>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        {hubs.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setSelectedCompanyId(c.id);
                                    setSelectedReport(null);
                                }}
                                className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ${
                                    selectedCompanyId === c.id 
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-200 -translate-y-0.5' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-lg transition-all ${selectedCompanyId === c.id ? 'bg-white/20' : 'bg-slate-50'}`}>
                                        {React.cloneElement(c.icon as React.ReactElement<any>, { 
                                            size: 14, 
                                            className: selectedCompanyId === c.id ? 'text-white' : 'text-slate-400' 
                                        })}
                                    </div>
                                    <span className="text-sm font-black tracking-tight">{c.name}</span>
                                </div>
                                <div className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${selectedCompanyId === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {c.count}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Network Active</p>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium tracking-tight">Monitoring {reports.length} secure nodes.</p>
                </div>
            </div>

            {/* 2. REPORT FEED */}
            <div className="w-[380px] bg-white border-r border-slate-100 flex flex-col shadow-sm relative z-0">
                <div className="p-4 border-b border-slate-50 bg-white sticky top-0 z-10 space-y-4">
                    {selectedCompanyId !== "ALL" && (
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl">
                            {(['user', 'company', 'all'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setGroupingMode(mode)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                        groupingMode === mode 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Decrypt report stream..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-50/20">
                    {Object.entries(groupedData).map(([groupName, reports]) => (
                        <div key={groupName} className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                                    {groupName.includes('NEW') ? <User size={14} /> : <CheckCircle2 size={14} />}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{groupName}</span>
                                <span className="text-[10px] font-black text-indigo-300 ml-1">({reports.length})</span>
                                <div className="h-[2px] bg-indigo-100 flex-1 ml-2 rounded-full opacity-50" />
                            </div>
                            {reports.map(report => (
                                <motion.div
                                    key={report._id}
                                    layout
                                    onClick={() => setSelectedReport(report)}
                                    className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer relative group flex flex-col gap-2 ${
                                        selectedReport?._id === report._id 
                                        ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-50 scale-[1.02]' 
                                        : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-100'
                                    }`}
                                >
                                    {report.status === 'pending' && (
                                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-bounce" />
                                    )}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className={`text-base font-black tracking-tight transition-colors ${selectedReport?._id === report._id ? 'text-indigo-600' : 'text-slate-800'}`}>
                                                {report.adminEmail.split('@')[0]}
                                            </span>
                                            {selectedCompanyId === "ALL" && (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter -mt-0.5">
                                                    {report.tenantId?.name || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                            {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{report.subject}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic opacity-80 font-medium">"{report.description}"</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
                                            report.status === 'pending' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                                            report.status === 'in_review' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                                            report.status === 'resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                                            'bg-slate-50 border-slate-100 text-slate-400'
                                        }`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{report.status.replace('_', ' ')}</span>
                                        </div>
                                        <ChevronRight size={18} className={`transition-transform duration-300 ${selectedReport?._id === report._id ? 'translate-x-1 text-indigo-600' : 'text-slate-200 group-hover:text-slate-400'}`} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. DETAILED ACTION VIEW */}
            <div className="flex-1 bg-white flex flex-col relative overflow-hidden shadow-2xl z-20">
                <AnimatePresence mode="wait">
                    {selectedReport ? (
                        <motion.div 
                            key={selectedReport._id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="flex flex-col h-full"
                        >
                            <div className="p-10 border-b border-slate-50 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center shadow-2xl shadow-indigo-200 text-white">
                                            <User size={40} />
                                            <span className="text-xs font-black mt-1 uppercase tracking-tighter">SENDER</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                                                    {selectedReport.adminEmail.split('@')[0]}
                                                    <span className="text-sm font-medium text-slate-400">({selectedReport.adminEmail})</span>
                                                </h3>
                                            </div>
                                            <div className="flex gap-2 mb-2 items-center flex-wrap">
                                                <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-600">
                                                    <Building2 size={12} className="text-indigo-500" /> {selectedReport.tenantId?.name || 'Unknown'}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-600">
                                                    <AlertCircle size={12} className="text-violet-500" /> Priority: <span className="uppercase">{selectedReport.priority}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 items-center justify-end gap-1.5 flex">
                                            <Clock size={12} /> Received
                                        </p>
                                        <p className="text-xs font-bold text-slate-800 tabular-nums">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-10 overflow-y-auto space-y-12">
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                        Inbound Intel Payload
                                    </h4>
                                    <div className="bg-slate-50 p-10 rounded-2xl shadow-inner relative group overflow-hidden border border-slate-200">
                                        <div className="absolute top-0 right-0 p-8 text-slate-200 opacity-40 pointer-events-none">
                                            <MessageSquare size={160} />
                                        </div>
                                        <div className="relative z-10">
                                            <CornerDownRight size={20} className="text-indigo-500 mb-6" />
                                            <p className="text-sm text-slate-700 leading-relaxed font-black font-mono italic">
                                                "{selectedReport.description}"
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-8">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-2 h-2 bg-violet-500 rounded-full" />
                                        Executive Protocols
                                    </h4>
                                    <div className="grid grid-cols-3 gap-6">
                                        <button 
                                            onClick={() => handleDecision('ACCEPT')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500 gap-1.5 group scale-active shadow-hover ${
                                                decision === 'ACCEPT' || selectedReport.status === 'resolved'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-500 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all ${decision === 'ACCEPT' || selectedReport.status === 'resolved' ? 'bg-emerald-500 text-white rotate-6' : 'bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
                                                <Check size={16} strokeWidth={3} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">Accept</span>
                                        </button>

                                        <button 
                                            onClick={() => handleDecision('REJECT')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500 gap-1.5 group scale-active shadow-hover ${
                                                decision === 'REJECT' || selectedReport.status === 'closed'
                                                ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-100' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-500 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all ${decision === 'REJECT' || selectedReport.status === 'closed' ? 'bg-rose-500 text-white -rotate-6' : 'bg-slate-50 text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-500'}`}>
                                                <X size={16} strokeWidth={3} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">Reject</span>
                                        </button>

                                        <button 
                                            onClick={() => handleDecision('RESPOND')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500 gap-1.5 group scale-active shadow-hover ${
                                                decision === 'RESPOND' || selectedReport.status === 'in_review'
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg shadow-indigo-100' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-500 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all ${decision === 'RESPOND' || selectedReport.status === 'in_review' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                                <Send size={16} strokeWidth={3} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">Respond</span>
                                        </button>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        Resolution Narrative
                                    </h4>
                                    <div className="bg-slate-50 p-0.5 rounded-xl border border-slate-100 shadow-inner">
                                        <textarea 
                                            value={response}
                                            onChange={(e) => setResponse(e.target.value)}
                                            placeholder={selectedReport.response || "Document final analytical resolution..."}
                                            className="w-full h-28 p-4 bg-transparent focus:bg-white border-none rounded-xl outline-none text-sm font-bold text-slate-700 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </section>
                            </div>

                            <div className="p-4 border-t border-slate-50 bg-white sticky bottom-0 z-30 flex justify-center">
                                <button 
                                    onClick={handleSubmit}
                                    className={`w-1/2 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-500 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg ${
                                        decision || response.trim().length > 0 
                                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-indigo-200 hover:scale-[1.01] hover:shadow-indigo-300 active:scale-[0.98]' 
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                     {response.trim().length > 0 
                                        ? 'Submit Response'
                                        : (decision ? `Submit ${decision}` : 'Submit')
                                    }
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                            <p className="pb-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-50 bg-white">Authorized Personnel Only</p>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 overflow-hidden relative">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                                className="w-40 h-40 rounded-[50px] bg-white shadow-2xl flex items-center justify-center border border-slate-100 relative z-10"
                            >
                                <Workflow size={64} className="text-slate-200" />
                            </motion.div>
                            <div className="mt-12 text-center relative z-10">
                                <h3 className="font-black uppercase tracking-[0.5em] text-slate-300 text-lg mb-4">Command Center</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                    <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Awaiting Signal Decryption</p>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                .scale-active:active { transform: scale(0.96); }
                .shadow-hover:hover { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.1); }
            `}</style>
        </div>
    );
}
