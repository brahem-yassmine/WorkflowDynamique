'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, ExternalLink, ShieldAlert, GitBranch, Briefcase } from 'lucide-react';
import { apiService } from '@/service/api.service';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'workflow_created' | 'task_assigned' | 'workflow_completed' | 'system';
    link?: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = async () => {
        const token = apiService.getToken();
        if (!token) return; // Silent guard
        
        try {
            const res = await apiService.getNotifications();
            if (res.success) setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        const token = apiService.getToken();
        if (!token) return;

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                setUserRole(parsed.role?.toLowerCase() || '');
            } catch (e) {}
        }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = async () => {
        try {
            await apiService.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await apiService.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'workflow_created': return <GitBranch size={16} className="text-indigo-500" />;
            case 'task_assigned': return <Briefcase size={16} className="text-amber-500" />;
            case 'workflow_completed': return <Check size={16} className="text-emerald-500" />;
            case 'warning':
            case 'security': return <ShieldAlert size={16} className="text-rose-500" />;
            case 'system': return <ShieldAlert size={16} className="text-indigo-500" />;
            default: return <ShieldAlert size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-all relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden"
                    >
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 tracking-tight">System Alerts</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Pulse</p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto bg-slate-50/30 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <Bell size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Alerts</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((n) => (
                                        <div
                                            key={n._id}
                                            className={`p-4 hover:bg-white transition-colors cursor-pointer group relative ${!n.read ? 'bg-indigo-50/40' : ''}`}
                                            onClick={() => markAsRead(n._id)}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`p-2.5 rounded-xl h-fit ${!n.read ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-xs font-black tracking-tight ${!n.read ? 'text-slate-900' : 'text-slate-500'}`}>
                                                            {n.title}
                                                        </p>
                                                        {!n.read && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed font-sans">
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                            <Clock size={10} />
                                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        {(userRole === 'user' || n.link) && (
                                                            <Link href={userRole === 'user' ? '/User/ALL' : (n.link || '#')} className="flex items-center gap-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                                View <ExternalLink size={8} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-50 text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                Encrypted Lattice Communication Channel
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
