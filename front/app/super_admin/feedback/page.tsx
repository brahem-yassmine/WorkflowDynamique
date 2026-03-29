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
    LayoutDashboard,
    Trash2,
    Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showAlert, showConfirm } from '@/lib/alerts';

type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'closed' | 'deleted';

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
    const [groupingMode, setGroupingMode] = useState<'user' | 'company' | 'all' | 'workflow' | 'task' | 'type'>('all');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [decision, setDecision] = useState<'ACCEPT' | 'REJECT' | null>(null);
    const [isResponding, setIsResponding] = useState(false);
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
        { id: "ALL", name: "All Global Reports", count: reports.filter(r => r.status !== 'deleted').length, icon: <Layers size={14} /> },
        { id: "BY_TYPE", name: "Reports by Type", count: reports.filter(r => r.status !== 'deleted').length, icon: <Filter size={14} /> },
        { id: "WORKFLOW", name: "Workflow Reports", count: reports.filter(r => r.type?.toLowerCase() === 'workflow' && r.status !== 'deleted').length, icon: <Workflow size={14} /> },
        { id: "COMPANIES", name: "Companies Reports", count: reports.filter(r => r.type?.toLowerCase() !== 'workflow' && r.status !== 'deleted').length, icon: <Building2 size={14} /> },
        { id: "HISTORY", name: "Action History", count: reports.filter(r => r.status === 'resolved' || r.status === 'closed' || r.status === 'deleted').length, icon: <Clock size={14} /> }
    ];

    // Multi-mode filtering and grouping
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const isHistory = selectedCompanyId === "HISTORY";
            if (isHistory && (report.status === 'pending' || report.status === 'in_review')) return false;
            if (!isHistory && report.status === 'deleted') return false;

            const isWorkflow = report.type?.toLowerCase() === 'workflow';
            const matchesHub = selectedCompanyId === "ALL" || 
                               selectedCompanyId === "BY_TYPE" || 
                               isHistory ||
                               (selectedCompanyId === "WORKFLOW" && isWorkflow) ||
                               (selectedCompanyId === "COMPANIES" && !isWorkflow);
            
            const matchesType = selectedTypeFilter === 'all' || report.type?.toLowerCase() === selectedTypeFilter.toLowerCase();

            const matchesSearch = report.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  report.subject?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesHub && matchesType && matchesSearch;
        });
    }, [reports, selectedCompanyId, searchTerm, selectedTypeFilter]);

    const groupedData = useMemo(() => {
        // Sort all filtered reports by date descending (Newest first)
        const sortedReports = [...filteredReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        let grouped: Record<string, SystemReport[]> = {};

        // Auto-switch grouping mode if BY_TYPE hub is selected but mode is all
        const effectiveMode = (selectedCompanyId === 'BY_TYPE' && groupingMode === 'all') ? 'type' : groupingMode;

        // If 'all' mode (and not in BY_TYPE specific hub), return flat list
        if (effectiveMode === 'all' || selectedCompanyId === 'ALL' || selectedCompanyId === 'HISTORY') {
            if (sortedReports.length > 0) {
                grouped['RECENT REPORTS'] = sortedReports;
            }
            return grouped;
        }

        // Apply specific grouping modes
        if (effectiveMode === 'company') {
            sortedReports.forEach(report => {
                const key = report.tenantId?.name || 'Unknown Company';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(report);
            });
        } 
        else if (effectiveMode === 'user') {
            sortedReports.forEach(report => {
                const key = report.adminEmail || 'Unknown User';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(report);
            });
        }
        else if (effectiveMode === 'type') {
            sortedReports.forEach(report => {
                const typeMap: Record<string, string> = {
                    'bug': 'Reported Bugs',
                    'error': 'System Errors',
                    'help_request': 'Help Requests',
                    'improvement': 'Feature Requests',
                    'question': 'General Inquiries',
                    'comment': 'User Comments',
                    'other': 'Miscellaneous'
                };
                const key = typeMap[report.type?.toLowerCase()] || report.type || 'Other';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(report);
            });
        }
        else if (effectiveMode === 'workflow') {
            sortedReports.forEach(report => {
                const key = 'Unknown Workflow'; // Backend schema lacks explicit field
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(report);
            });
        }
        else if (effectiveMode === 'task') {
            sortedReports.forEach(report => {
                const key = 'Unknown Task'; // Backend schema lacks explicit field
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(report);
            });
        }

        return grouped;
    }, [filteredReports, groupingMode, selectedCompanyId]);

    const timelineActions = useMemo(() => {
        if (selectedCompanyId !== "HISTORY") return [];
        
        const actions: { id: string; type: string; date: number; report: SystemReport; title: string; description: React.ReactNode; icon: any; colorClass: string; }[] = [];
        
        reports.forEach(report => {
            // 1. Submit Action 
            actions.push({
                id: `${report._id}-submit`,
                type: 'SUBMITTED',
                date: new Date(report.createdAt).getTime(),
                report: report,
                title: 'Report Received',
                description: (
                    <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                            Submitted by <span className="text-indigo-600">{report.adminEmail.split('@')[0]}</span>
                        </span>
                        <span className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">
                            "{report.description}"
                        </span>
                    </div>
                ),
                icon: <MessageSquare size={14} strokeWidth={3} />,
                colorClass: 'text-indigo-500 border-indigo-200 bg-indigo-50'
            });

            // 2. Evaluation Action
            if (report.status !== 'pending') {
                let title = 'In Review';
                let icon = <Clock size={14} strokeWidth={3} />;
                let colorClass = 'text-amber-500 border-amber-200 bg-amber-50';

                if (report.status === 'resolved') {
                    title = 'ACCEPTED';
                    icon = <CheckCircle2 size={14} strokeWidth={3} />;
                    colorClass = 'text-emerald-500 border-emerald-200 bg-emerald-50';
                } else if (report.status === 'closed') {
                    title = 'REJECTED';
                    icon = <X size={14} strokeWidth={3} />;
                    colorClass = 'text-rose-500 border-rose-200 bg-rose-50';
                } else if (report.status === 'deleted') {
                    title = 'DELETED';
                    icon = <Trash2 size={14} strokeWidth={3} />;
                    colorClass = 'text-slate-500 border-slate-200 bg-slate-50';
                }

                actions.push({
                    id: `${report._id}-eval`,
                    type: report.status.toUpperCase(),
                    date: report.respondedAt ? new Date(report.respondedAt).getTime() : new Date(report.createdAt).getTime() + 1000,
                    report: report,
                    title: title,
                    description: (
                        <div className="flex flex-col gap-1.5 mt-1">
                            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                Evaluated by <span className="text-emerald-600">Super Admin</span> • Report from <span className="text-indigo-600">{report.adminEmail.split('@')[0]}</span>
                            </span>
                            <span className={`text-sm font-medium text-slate-600 italic leading-relaxed ${!report.response && 'opacity-60'}`}>
                                {report.response ? `"${report.response}"` : 'No resolution narrative provided.'}
                            </span>
                        </div>
                    ),
                    icon: icon,
                    colorClass: colorClass
                });
            }
        });

        const filtered = actions.filter(a => 
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            a.report.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.report.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => b.date - a.date);
    }, [reports, selectedCompanyId, searchTerm]);

    const handleDecision = (type: 'ACCEPT' | 'REJECT' | 'RESPOND') => {
        if (type === 'RESPOND') {
            setIsResponding(prev => {
                if (prev) setResponse("");
                return !prev;
            });
        } else {
            setDecision(prev => prev === type ? null : type);
        }
    };

    const handleDelete = async () => {
        if (!selectedReport) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/reports/${selectedReport._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setReports(prev => prev.map(r => r._id === selectedReport._id ? { ...r, status: 'deleted', respondedAt: new Date().toISOString() } : r));
                setSelectedReport(null);
                setDecision(null);
                setIsResponding(false);
                setResponse("");
                await showAlert('Archived', 'The report has been moved to History.', 'success');
            } else {
                await showAlert('Deletion Error', 'Failed to delete report: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            await showAlert('Connection Error', 'Failed to connect to the server.', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!selectedReport) return;
        if (!decision && (!isResponding || response.trim().length === 0)) return;
        
        // Map decision to status
        let newStatus: ReportStatus = selectedReport.status;
        if (decision === 'ACCEPT') newStatus = 'resolved';
        if (decision === 'REJECT') newStatus = 'closed';
        if (!decision && isResponding) newStatus = 'in_review';
        
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
                    response: isResponding ? response.trim() : undefined
                })
            });

            const data = await res.json();
            if (data.success) {
                // Update local state and show alert
                setReports(prev => prev.map(r => 
                    r._id === selectedReport._id ? { ...r, status: newStatus, response: isResponding ? response.trim() : r.response } : r
                ));
                setSelectedReport(prev => prev ? { ...prev, status: newStatus, response: isResponding ? response.trim() : prev.response } : null);

                await showAlert('Transmission Complete', `Status: ${newStatus}\n${isResponding ? 'Response Sent' : 'Protocol Only'}`, 'success');
                
                setDecision(null);
                setIsResponding(false);
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
        <div className="flex h-full w-full flex-col bg-slate-50 overflow-y-auto overflow-x-hidden custom-scrollbar">
            
            <div className="w-full max-w-7xl mx-auto p-8 relative flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-8 mt-2 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Layers className="text-indigo-600" size={32} />
                            Feedback Center <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mt-2">GLOBAL</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-sm ml-1">Real-time feedback monitoring across all platforms.</p>
                    </div>
                </div>

                {/* Stat Cards / Hubs - Centered Layout */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    {hubs.map(hub => {
                        const isSelected = selectedCompanyId === hub.id;
                        return (
                            <div 
                                key={hub.id} 
                                onClick={() => {
                                    setSelectedCompanyId(hub.id);
                                    setSelectedReport(null);
                                    setSelectedTypeFilter('all');
                                    // Set default grouping based on hub
                                    if (hub.id === "BY_TYPE") setGroupingMode("type");
                                    else setGroupingMode("all"); 
                                }}
                                className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer shadow-sm hover:shadow-md flex-1 min-w-[280px] max-w-[320px] ${
                                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-indigo-100 -translate-y-1' : 'border-slate-100 hover:border-indigo-200 hover:-translate-y-0.5'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 shadow-md shadow-indigo-200' : 'bg-slate-50'}`}>
                                        {React.cloneElement(hub.icon as React.ReactElement<any>, { 
                                            size: 18, 
                                            className: isSelected ? 'text-white' : 'text-slate-400' 
                                        })}
                                    </div>
                                    {isSelected && <div className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-2 py-1 rounded">ACTIVE VIEW</div>}
                                </div>
                                <h3 className={`text-3xl font-black tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{hub.count}</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{hub.name}</p>
                            </div>
                        );
                    })}
                </div>

                {/* 2. REPORT FEED (Card container) */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col relative overflow-hidden min-h-[500px]">
                <div className="p-4 border-b border-slate-50 bg-white sticky top-0 z-10 space-y-4">
                    {selectedCompanyId === "BY_TYPE" && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl w-fit">
                                {(['all', 'type'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => {
                                            setGroupingMode(mode);
                                            if (mode === 'all') setSelectedTypeFilter('all');
                                        }}
                                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                            groupingMode === mode 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {mode === 'type' ? 'Category' : mode === 'all' ? 'Show All' : mode}
                                    </button>
                                ))}
                            </div>

                            {/* Specific Type Selector - Only show if in Category mode */}
                            {groupingMode === 'type' && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar animate-in slide-in-from-left duration-300">
                                    {['all', 'bug', 'error', 'help_request', 'improvement', 'question', 'comment', 'other'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedTypeFilter(type)}
                                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                                                selectedTypeFilter === type
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'
                                            }`}
                                        >
                                            {type === 'all' ? 'All Types' :
                                             type === 'bug' ? 'Report Bug' :
                                             type === 'error' ? 'Error' :
                                             type === 'help_request' ? 'Help Request' :
                                             type === 'improvement' ? 'Feature Request' :
                                             type === 'question' ? 'General Inquiry' :
                                             type === 'comment' ? 'Add Comment' : 'Other'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {selectedCompanyId === "WORKFLOW" && (
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl w-full max-w-sm">
                            {(['all', 'workflow', 'user', 'task'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setGroupingMode(mode)}
                                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
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
                    {selectedCompanyId === "COMPANIES" && (
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl w-full max-w-sm">
                            {(['all', 'company', 'user'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setGroupingMode(mode)}
                                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
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
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all text-base font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
                    {selectedCompanyId === "HISTORY" ? (
                        <div className="max-w-4xl mx-auto space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent px-4 py-8">
                            {timelineActions.length === 0 ? (
                                <div className="text-center text-slate-400 font-bold p-12">No activity history matches your search.</div>
                            ) : (
                                timelineActions.map((action) => (
                                    <div key={action.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${action.colorClass} relative z-10 transition-transform duration-300 group-hover:scale-110`}>
                                            {action.icon}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer hover:border-indigo-100 group-hover:-translate-y-1" onClick={() => setSelectedReport(action.report)}>
                                            <div className="flex flex-col gap-1 mb-2 border-b border-slate-50 pb-3">
                                                <div className="flex items-center justify-between">
                                                    <span className={`font-black text-sm uppercase tracking-wider ${action.colorClass.replace('bg-', 'text-').split(' ')[0]}`}>{action.title}</span>
                                                    <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                        {new Date(action.date).toLocaleDateString()} {new Date(action.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{action.report.subject}</h4>
                                            <div className="mt-1">{action.description}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        Object.entries(groupedData).map(([groupName, reports]) => (
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
                                        onClick={() => { setSelectedReport(report); setDecision(null); setIsResponding(false); setResponse(""); }}
                                        className={`p-5 mx-4 mb-3 border rounded-2xl transition-all duration-300 cursor-pointer relative group flex flex-col gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 ${
                                            selectedReport?._id === report._id ? 'bg-indigo-50/20 border-indigo-200 ring-2 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className={`text-lg font-black tracking-tight transition-colors ${selectedReport?._id === report._id ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-500'}`}>
                                                    {report.adminEmail.split('@')[0]}
                                                </span>
                                                {selectedCompanyId === "ALL" && (
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest -mt-0.5">
                                                        {report.tenantId?.name || 'Unknown'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 tabular-nums bg-slate-50 px-2 py-1 rounded border border-slate-100 min-w-[4rem] text-center">
                                                {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-base font-bold text-slate-700 leading-tight">{report.subject}</p>
                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic opacity-80 font-medium">"{report.description}"</p>
                                        <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border shadow-sm ${
                                                report.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                                report.status === 'closed' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                                                report.status === 'deleted' ? 'bg-slate-100 border-slate-300 text-slate-500 line-through opacity-80' :
                                                report.status === 'in_review' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                                'bg-white border-slate-200 text-slate-500'
                                            }`}>
                                                {report.status === 'resolved' ? <CheckCircle2 size={12} strokeWidth={3} /> : report.status === 'closed' ? <X size={12} strokeWidth={3} /> : report.status === 'deleted' ? <Trash2 size={12} strokeWidth={3} /> : <Clock size={12} />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {report.status === 'resolved' ? 'ACCEPTED' : 
                                                     report.status === 'closed' ? 'REJECTED' : 
                                                     report.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <ChevronRight size={18} className={`transition-transform duration-300 ${selectedReport?._id === report._id ? 'translate-x-1 text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. DETAILED ACTION VIEW (MODAL) */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div 
                        key={selectedReport._id + '-modal'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedReport(null);
                        }}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
                        >
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-40"
                            >
                                <X size={20} />
                            </button>
                            <div className="p-10 border-b border-slate-50 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center shadow-2xl shadow-indigo-200 text-white">
                                            <User size={40} />
                                            <span className="text-xs font-black mt-1 uppercase tracking-tighter">SENDER</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                                                    {selectedReport.adminEmail.split('@')[0]}
                                                    <span className="text-base font-medium text-slate-400">({selectedReport.adminEmail})</span>
                                                </h3>
                                            </div>
                                            <div className="flex gap-2 mb-2 items-center flex-wrap">
                                                <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-100 text-sm font-black uppercase tracking-wider text-slate-600">
                                                    <Building2 size={14} className="text-indigo-500" /> {selectedReport.tenantId?.name || 'Unknown'}
                                                </span>
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl shadow-sm border text-sm font-black uppercase tracking-wider ${
                                                    selectedReport.priority?.toLowerCase() === 'high' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                                    selectedReport.priority?.toLowerCase() === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                    selectedReport.priority?.toLowerCase() === 'low' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                    'bg-white border-slate-100 text-slate-600'
                                                }`}>
                                                    <AlertCircle size={14} className={
                                                        selectedReport.priority?.toLowerCase() === 'high' ? 'text-rose-500' :
                                                        selectedReport.priority?.toLowerCase() === 'medium' ? 'text-amber-500' :
                                                        selectedReport.priority?.toLowerCase() === 'low' ? 'text-emerald-500' :
                                                        'text-violet-500'
                                                    } /> Priority: <span>{selectedReport.priority}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1 items-center justify-end gap-1.5 flex">
                                            <Clock size={14} /> Received
                                        </p>
                                        <p className="text-sm font-bold text-slate-800 tabular-nums">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-10 overflow-y-auto space-y-12">
                                <section>
                                    <h4 className="text-base font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-3 mb-8">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                        Inbound Intel Payload
                                    </h4>
                                    <div className="bg-slate-50 p-10 rounded-2xl shadow-inner relative group overflow-hidden border border-slate-200">
                                        <div className="absolute top-0 right-0 p-8 text-slate-200 opacity-40 pointer-events-none">
                                            <MessageSquare size={160} />
                                        </div>
                                        <div className="relative z-10">
                                            <CornerDownRight size={24} className="text-indigo-500 mb-6" />
                                            <p className="text-lg text-slate-700 leading-relaxed font-black font-mono italic">
                                                "{selectedReport.description}"
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-8">
                                    <h4 className="text-base font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-3">
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
                                                <Check size={20} strokeWidth={3} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest leading-none text-center">Accept</span>
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
                                                <X size={20} strokeWidth={3} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest leading-none text-center">Reject</span>
                                        </button>

                                        <button 
                                            onClick={() => handleDecision('RESPOND')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500 gap-1.5 group scale-active shadow-hover ${
                                                isResponding
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg shadow-indigo-100' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-500 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all ${isResponding ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                                <Send size={20} strokeWidth={3} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest leading-none text-center">Respond</span>
                                        </button>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-base font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        Resolution Narrative
                                    </h4>
                                    <div className="bg-slate-50 p-0.5 rounded-xl border border-slate-100 shadow-inner">
                                        <textarea 
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        disabled={!isResponding}
                                        placeholder={isResponding ? "Document final analytical resolution..." : "Select RESPOND to unlock narrative..."}
                                        className={`w-full h-32 p-5 rounded-2xl resize-none transition-all text-sm font-medium ${
                                            isResponding 
                                                ? 'bg-white border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 text-slate-700 placeholder:text-slate-400 shadow-sm' 
                                                : 'bg-slate-50/50 border-transparent text-slate-400 cursor-not-allowed placeholder:text-slate-300/50'
                                        }`}
                                    />
                                    </div>
                                </section>
                            </div>

                            <div className="p-4 border-t border-slate-50 bg-white sticky bottom-0 z-30 flex justify-center gap-4">
                                <button 
                                    onClick={() => showConfirm({ 
                                        title: 'Delete Report', 
                                        text: 'Are you sure you want to permanently archive this report?', 
                                        icon: 'warning' 
                                    }).then((isConfirmed: any) => isConfirmed && handleDelete())}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-100 transition-all active:scale-95 flex-1"
                                >
                                    <Trash2 size={18} /> Delete
                                </button>
                                <button 
                                    onClick={() => showAlert('Edit Report', 'Edit functionality placeholder.', 'info')}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-50 text-sky-600 rounded-xl font-bold shadow-lg shadow-sky-100 hover:bg-sky-100 transition-all active:scale-95 flex-1"
                                >
                                    <Edit size={18} /> Edit
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!decision && (!isResponding || response.trim().length === 0)}
                                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex-1 ${
                                        decision || (isResponding && response.trim().length > 0)
                                        ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    <Send size={18} />
                                    Submit
                                </button>
                            </div>
                            <p className="pb-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-50 bg-white">Authorized Personnel Only</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                .scale-active:active { transform: scale(0.96); }
                .shadow-hover:hover { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.1); }
            `}</style>
            </div>
        </div>
    );
}
