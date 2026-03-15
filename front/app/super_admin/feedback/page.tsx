"use client";

import React, { useState, useMemo } from "react";
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

type ReportStatus = 'NEW' | 'ACCEPTED' | 'REJECTED' | 'PENDING';

interface WorkflowReport {
    id: string;
    companyId: string;
    companyName: string;
    workflowId: string;
    workflowName: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    content: string;
    timestamp: string;
    status: ReportStatus;
}

const MOCK_REPORTS: WorkflowReport[] = [
    {
        id: "rep_1",
        companyId: "c_1",
        companyName: "Workflow Reports",
        workflowId: "w_101",
        workflowName: "Invoice Processing",
        senderId: "u_50",
        senderName: "Alex Rivera",
        senderEmail: "alex@techflow.com",
        content: "The OCR module failed to extract the total amount from the last 3 invoices. Need manual validation of the vision-node configuration.",
        timestamp: "2026-03-11T10:30:00Z",
        status: "NEW"
    },
    {
        id: "rep_2",
        companyId: "c_1",
        companyName: "Workflow Reports",
        workflowId: "w_101",
        workflowName: "Invoice Processing",
        senderId: "u_51",
        senderName: "Sarah Jenkins",
        senderEmail: "sarah@techflow.com",
        content: "Duplicate detection triggered for legitimate recurring payments. We need to relax the similarity threshold.",
        timestamp: "2026-03-11T11:15:00Z",
        status: "NEW"
    },
    {
        id: "rep_3",
        companyId: "c_1",
        companyName: "Workflow Reports",
        workflowId: "w_102",
        workflowName: "Customer Onboarding",
        senderId: "u_50",
        senderName: "Alex Rivera",
        senderEmail: "alex@techflow.com",
        content: "Welcome email sequence not firing for enterprise-tier signups. Investigation required in the SMTP node.",
        timestamp: "2026-03-11T09:45:00Z",
        status: "PENDING"
    },
    {
        id: "rep_4",
        companyId: "c_2",
        companyName: "Companies Reports",
        workflowId: "w_201",
        workflowName: "Route Optimization",
        senderId: "u_88",
        senderName: "Marc Dupont",
        senderEmail: "marc@globallog.co",
        content: "Real-time traffic data node intermittent latency. Causing timeouts in the delivery estimation calculations.",
        timestamp: "2026-03-10T16:00:00Z",
        status: "NEW"
    },
    {
        id: "rep_5",
        companyId: "c_2",
        companyName: "Companies Reports",
        workflowId: "w_202",
        workflowName: "Inventory Sync",
        senderId: "u_88",
        senderName: "Marc Dupont",
        senderEmail: "marc@globallog.co",
        content: "Warehouse B API returned 503 during the nightly reconciliation loop. Data integrity check requested.",
        timestamp: "2026-03-11T08:20:00Z",
        status: "NEW"
    },
    {
        id: "rep_6",
        companyId: "c_1",
        companyName: "Workflow Reports",
        workflowId: "w_102",
        workflowName: "Customer Onboarding",
        senderId: "u_51",
        senderName: "Sarah Jenkins",
        senderEmail: "sarah@techflow.com",
        content: "KYC verification node is timing out for international passports. Might be a regional CDN failure.",
        timestamp: "2026-03-11T12:10:00Z",
        status: "NEW"
    }
];

export default function FeedbackPage() {
    const [reports, setReports] = useState<WorkflowReport[]>(MOCK_REPORTS);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");
    const [selectedReport, setSelectedReport] = useState<WorkflowReport | null>(null);
    const [groupingMode, setGroupingMode] = useState<'workflow' | 'user' | 'all'>('workflow');
    const [searchTerm, setSearchTerm] = useState("");
    const [decision, setDecision] = useState<'ACCEPT' | 'REJECT' | 'RESPOND' | null>(null);
    const [response, setResponse] = useState("");

    // Calculate dynamic stats
    const totalGlobalReports = reports.length;
    const companies = [
        { id: "ALL", name: "All Global Reports", count: totalGlobalReports, icon: <Layers size={14} /> },
        { id: "c_1", name: "Workflow Reports", count: reports.filter(r => r.companyId === "c_1").length, icon: <LayoutDashboard size={14} /> },
        { id: "c_2", name: "Companies Reports", count: reports.filter(r => r.companyId === "c_2").length, icon: <Building2 size={14} /> }
    ];

    // Multi-mode filtering and grouping
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const matchesCompany = selectedCompanyId === "ALL" || report.companyId === selectedCompanyId;
            const matchesSearch = report.senderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  report.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCompany && matchesSearch;
        });
    }, [reports, selectedCompanyId, searchTerm]);

    const groupedData = useMemo(() => {
        if (groupingMode === 'workflow') {
            return filteredReports.reduce((acc, report) => {
                if (!acc[report.workflowName]) acc[report.workflowName] = [];
                acc[report.workflowName].push(report);
                return acc;
            }, {} as Record<string, WorkflowReport[]>);
        } else if (groupingMode === 'user') {
            return filteredReports.reduce((acc, report) => {
                const key = `${report.senderName} (${report.companyName})`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(report);
                return acc;
            }, {} as Record<string, WorkflowReport[]>);
        }
        return { "All Incoming Signals": filteredReports };
    }, [filteredReports, groupingMode]);

    const handleDecision = (type: 'ACCEPT' | 'REJECT' | 'RESPOND') => {
        setDecision(type);
    };

    const handleSubmit = async () => {
        if (!selectedReport) return;
        
        const newStatus: ReportStatus = decision === 'ACCEPT' ? 'ACCEPTED' : decision === 'REJECT' ? 'REJECTED' : 'PENDING';
        
        // Update the report in our state
        setReports(prev => prev.map(r => 
            r.id === selectedReport.id ? { ...r, status: newStatus } : r
        ));

        // Update the selected report reference
        setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);

        const isResponding = response.trim().length > 0;
        await showAlert('Transmission Complete', `Target: ${selectedReport.senderName}\nStatus: ${newStatus}\n${isResponding ? 'Response Sent' : 'Protocol Only'}`, 'success');
        
        setDecision(null);
        setResponse("");
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-0 bg-slate-50/50 overflow-hidden -m-8">
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
                        {companies.map(c => (
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
                    {selectedCompanyId === "c_2" && (
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl">
                            {(['workflow', 'user', 'all'] as const).map((mode) => (
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
                                    {groupingMode === 'user' ? <User size={14} /> : <Workflow size={14} />}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{groupName}</span>
                                <span className="text-[10px] font-black text-indigo-300 ml-1">({reports.length})</span>
                                <div className="h-[2px] bg-indigo-100 flex-1 ml-2 rounded-full opacity-50" />
                            </div>
                            {reports.map(report => (
                                <motion.div
                                    key={report.id}
                                    layout
                                    onClick={() => setSelectedReport(report)}
                                    className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer relative group ${
                                        selectedReport?.id === report.id 
                                        ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-50 scale-[1.02]' 
                                        : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-100'
                                    }`}
                                >
                                    {report.status === 'NEW' && (
                                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-bounce" />
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className={`text-base font-black tracking-tight transition-colors ${selectedReport?.id === report.id ? 'text-indigo-600' : 'text-slate-800'}`}>
                                                {report.senderName}
                                            </span>
                                            {selectedCompanyId === "ALL" && (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter -mt-0.5">
                                                    {report.companyName}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                            {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic opacity-80 font-medium">"{report.content}"</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
                                            report.status === 'NEW' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 
                                            report.status === 'PENDING' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                                            'bg-slate-50 border-slate-100 text-slate-400'
                                        }`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{report.status}</span>
                                        </div>
                                        <ChevronRight size={18} className={`transition-transform duration-300 ${selectedReport?.id === report.id ? 'translate-x-1 text-indigo-600' : 'text-slate-200 group-hover:text-slate-400'}`} />
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
                            key={selectedReport.id}
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
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{selectedReport.senderName}</h3>
                                                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full uppercase flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} />
                                                    VERIFIED HUB
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-slate-500 text-sm font-bold">
                                                <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-100">
                                                    <Building2 size={14} className="text-indigo-500" /> {selectedReport.companyName}
                                                </span>
                                                <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-100">
                                                    <Workflow size={14} className="text-violet-500" /> {selectedReport.workflowName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-1.5">
                                            <Clock size={14} /> Transmission Date
                                        </p>
                                        <p className="text-base font-black text-slate-800 tabular-nums">{new Date(selectedReport.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-10 overflow-y-auto space-y-12">
                                <section>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                        Inbound Intel Payload
                                    </h4>
                                    <div className="bg-slate-900 p-10 rounded-2xl shadow-xl relative group overflow-hidden border-4 border-slate-800">
                                        <div className="absolute top-0 right-0 p-8 text-slate-800 opacity-20 pointer-events-none">
                                            <MessageSquare size={160} />
                                        </div>
                                        <div className="relative z-10">
                                            <CornerDownRight size={20} className="text-indigo-400 mb-6" />
                                            <p className="text-sm text-slate-100 leading-relaxed font-black font-mono italic">
                                                "{selectedReport.content}"
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
                                                decision === 'ACCEPT' 
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-500 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all ${decision === 'ACCEPT' ? 'bg-emerald-500 text-white rotate-6' : 'bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
                                                <Check size={16} strokeWidth={3} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">Accept Protocol</span>
                                        </button>

                                        <button 
                                            onClick={() => handleDecision('REJECT')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500 gap-1.5 group scale-active shadow-hover ${
                                                decision === 'REJECT' 
                                                ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-100' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-500 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all ${decision === 'REJECT' ? 'bg-rose-500 text-white -rotate-6' : 'bg-slate-50 text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-500'}`}>
                                                <X size={16} strokeWidth={3} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">Reject Intel</span>
                                        </button>

                                        <button 
                                            onClick={() => handleDecision('RESPOND')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500 gap-1.5 group scale-active shadow-hover ${
                                                decision === 'RESPOND' 
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg shadow-indigo-100' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-500 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all ${decision === 'RESPOND' ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                                <Send size={16} strokeWidth={3} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">Respond Sync</span>
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
                                            placeholder="Document final analytical resolution..."
                                            className="w-full h-28 p-4 bg-transparent focus:bg-white border-none rounded-xl outline-none text-sm font-bold text-slate-700 transition-all placeholder:text-slate-200"
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
