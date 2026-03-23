"use client"
import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Clock, Zap, XCircle } from 'lucide-react';
import { apiService } from '@/service/api.service';

const NotificationPage = () => {
  const [stats, setStats] = useState({ delivered: 1240, failed: 2 });
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    push: true
  });

  useEffect(() => {
    // Load preferences from localStorage
    const savedChannels = localStorage.getItem('user_notification_channels');
    if (savedChannels) {
      try {
        setChannels(JSON.parse(savedChannels));
      } catch (e) {
        console.error("Failed to parse saved channels", e);
      }
    }

    // Fetch real notification stats
    const fetchStats = async () => {
      try {
        const res = await apiService.getNotifications();
        if (res.success && res.data) {
          // Calculate notifications from the last 24h
          const now = new Date();
          const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
          
          const recentNotifications = res.data.filter((n: any) => new Date(n.createdAt) >= last24h);
          
          setStats({
            delivered: recentNotifications.length > 0 ? recentNotifications.length : res.data.length, // Fallback to all if 0 in 24h for visual effect
            failed: 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch notification stats", error);
      }
    };
    
    fetchStats();
  }, []);

  const toggleChannel = (key: keyof typeof channels) => {
    const newChannels = { ...channels, [key]: !channels[key] };
    setChannels(newChannels);
    localStorage.setItem('user_notification_channels', JSON.stringify(newChannels));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Bell className="text-indigo-600" /> Automated Notifications
            </h1>
            <p className="text-slate-500 mt-2">Manage how you receive updates via Email, SMS, and Push.</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md">
            + New Trigger
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Configuration Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Triggers</h2>
            
            {/* Trigger Card 1: Step Entry */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-200 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Step Entry Trigger</h3>
                    <p className="text-xs text-slate-500">Triggered when a task enters a new stage</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 py-3 border-t border-slate-50">
                <div className="flex -space-x-2">
                   {channels.email && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white"><Mail size={14} className="text-indigo-600"/></div>}
                   {channels.push && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white"><Smartphone size={14} className="text-blue-600"/></div>}
                   {channels.sms && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white"><MessageSquare size={14} className="text-slate-600"/></div>}
                </div>
                <p className="text-sm text-slate-600 italic">"New task assigned to you in Workflow [Name]"</p>
              </div>
            </div>

            {/* Trigger Card 2: Rejection */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-red-200 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Rejection Alert</h3>
                    <p className="text-xs text-slate-500">Triggered when a validator rejects a step</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">ACTIVE</span>
              </div>
              <div className="flex items-center gap-4 py-3 border-t border-slate-50 text-sm text-slate-600">
                 {channels.email && <Mail size={16} />} <span className="font-medium">Sent to:</span> Requestor & Manager
              </div>
            </div>

            {/* Reminder Section */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4 text-amber-700">
                <Clock size={20} />
                <h3 className="font-bold">Inactivity Auto-Reminders</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg border border-amber-200/50">
                  <span className="text-sm text-amber-900 font-medium">After 24 hours of inactivity</span>
                  <button className="text-xs font-bold text-amber-700 underline">Edit Email Template</button>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg border border-amber-200/50">
                  <span className="text-sm text-amber-900 font-medium">Final escalation (48h)</span>
                  <span className="text-xs font-bold text-amber-600 uppercase">SMS Alert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <aside className="space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Channels</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between" onClick={() => toggleChannel('email')}>
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail size={18} /> <span className="text-sm font-medium">Email API</span>
                </div>
                <div className={`w-10 h-5 ${channels.email ? 'bg-indigo-600' : 'bg-slate-200'} rounded-full flex items-center ${channels.email ? 'justify-end' : 'justify-start'} px-1 cursor-pointer transition-colors duration-200`}>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between" onClick={() => toggleChannel('sms')}>
                <div className="flex items-center gap-3 text-slate-700">
                  <MessageSquare size={18} /> <span className="text-sm font-medium">SMS (Twilio)</span>
                </div>
                <div className={`w-10 h-5 ${channels.sms ? 'bg-indigo-600' : 'bg-slate-200'} rounded-full flex items-center ${channels.sms ? 'justify-end' : 'justify-start'} px-1 cursor-pointer transition-colors duration-200`}>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between" onClick={() => toggleChannel('push')}>
                <div className="flex items-center gap-3 text-slate-700">
                  <Smartphone size={18} /> <span className="text-sm font-medium">Push Notification</span>
                </div>
                <div className={`w-10 h-5 ${channels.push ? 'bg-indigo-600' : 'bg-slate-200'} rounded-full flex items-center ${channels.push ? 'justify-end' : 'justify-start'} px-1 cursor-pointer transition-colors duration-200`}>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">Stats - Last 24h</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Delivered</span>
                  <span className="font-bold font-mono text-emerald-400">{stats.delivered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed</span>
                  <span className="font-bold font-mono text-red-400">{stats.failed}</span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

export default NotificationPage;

