"use client"

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronRight, 
  Eye, 
  ArrowRight,
  Filter,
  Calendar,
  AlertOctagon
} from 'lucide-react';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AlertsCenterPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'deadline' | 'incident'>('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Trigger check-deadlines first
            await apiService.request('/workflow-instances/check-deadlines', { method: 'POST' });

            const [notifsRes, reportsRes] = await Promise.all([
                apiService.getNotifications(),
                apiService.request('/task-reports/all')
            ]);

            if (notifsRes.success) {
                // Filter only specialized alerts
                const alerts = notifsRes.data.filter((n: any) => 
                    n.type === 'deadline_exceeded' || n.type === 'incident_report' || n.type === 'warning'
                );
                setNotifications(alerts);
            }

            if (reportsRes.success) {
                setReports(reportsRes.data);
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
            toast.error('Failed to load alerts data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredAlerts = () => {
        const deadlineAlerts = notifications.filter(n => n.type === 'deadline_exceeded');
        const incidentAlerts = reports;

        if (filter === 'deadline') return deadlineAlerts.map(a => ({ ...a, category: 'deadline' }));
        if (filter === 'incident') return incidentAlerts.map(a => ({ ...a, category: 'incident' }));

        return [
            ...deadlineAlerts.map(a => ({ ...a, category: 'deadline' })),
            ...incidentAlerts.map(a => ({ ...a, category: 'incident' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const alerts = filteredAlerts();

    return (
        <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
            <div className="max-w-7xl mx-auto space-y-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <ShieldAlert size={20} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Operational Security</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Alerts Center</h1>
                        <p className="text-slate-400 font-medium text-lg">Monitor critical deadlines and incident reports across the organization.</p>
                    </div>

                    <div className="flex bg-white p-1.5 rounded-[22px] shadow-sm border border-slate-100 gap-1">
                        {(['all', 'deadline', 'incident'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                {t} Alerts
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                            <Clock size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Deadlines</p>
                            <p className="text-3xl font-black text-slate-900">{notifications.filter(n => n.type === 'deadline_exceeded').length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                            <AlertOctagon size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Incidents</p>
                            <p className="text-3xl font-black text-slate-900">{reports.filter(r => r.status === 'pending').length}</p>
                        </div>
                    </div>
                    <div className="bg-[#1e293b] p-8 rounded-[32px] border border-white/5 shadow-xl flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300/50 uppercase tracking-widest">Resolved Today</p>
                            <p className="text-3xl font-black text-white">{reports.filter(r => r.status === 'resolved').length}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="grid gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[32px]" />
                            ))}
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                <Bell className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-600">All systems clear</h3>
                            <p className="text-slate-400 font-medium mt-2">No critical alerts or incidents require your attention.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            <AnimatePresence>
                                {alerts.map((alert, idx) => (
                                    <motion.div
                                        key={alert._id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`group relative bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all ${alert.category === 'deadline' ? 'border-l-[6px] border-l-amber-500' : 'border-l-[6px] border-l-rose-500'}`}
                                    >
                                        <div className="flex items-center justify-between gap-8">
                                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${alert.category === 'deadline' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {alert.category === 'deadline' ? <Clock size={24} /> : <AlertOctagon size={24} />}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${alert.category === 'deadline' ? 'text-amber-600' : 'text-rose-600'}`}>
                                                            {alert.category === 'deadline' ? 'Deadline Breach' : `Incident Report: ${alert.status}`}
                                                        </span>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {new Date(alert.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-800 tracking-tight truncate">
                                                        {alert.title || alert.instanceId?.title || 'System Alert'}
                                                    </h3>
                                                    <p className="text-slate-500 font-medium text-sm mt-1 line-clamp-2 leading-relaxed opacity-80">
                                                        {alert.message}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0">
                                                {alert.link && (
                                                    <Link 
                                                        href={alert.link}
                                                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg"
                                                    >
                                                        Investigate <ArrowRight size={16} />
                                                    </Link>
                                                )}
                                                {!alert.link && alert.category === 'incident' && (
                                                    <Link 
                                                        href={`/admin/tasks`}
                                                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg"
                                                    >
                                                        View Task <ArrowRight size={16} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {/* Meta Footer */}
                                        {(alert.recipientId || alert.adminId) && (
                                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Target:</span>
                                                    <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-slate-100">
                                                        {alert.recipientId?.email || alert.recipientId || 'N/A'}
                                                    </span>
                                                </div>
                                                {alert.adminId && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Reported By:</span>
                                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-indigo-100">
                                                            Admin
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
