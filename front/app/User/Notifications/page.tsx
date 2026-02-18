"use client"
import React from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Clock, Zap, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const NotificationPage = () => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Bell className="text-indigo-600" /> Automated Notifications
            </h1>
            <p className="text-slate-500 mt-2">Manage how users receive updates via Email, SMS, and Push.</p>
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
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white"><Mail size={14} className="text-indigo-600"/></div>
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white"><Smartphone size={14} className="text-blue-600"/></div>
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
                 <Mail size={16} /> <span className="font-medium">Sent to:</span> Requestor & Manager
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail size={18} /> <span className="text-sm font-medium">Email API</span>
                </div>
                <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700">
                  <MessageSquare size={18} /> <span className="text-sm font-medium">SMS (Twilio)</span>
                </div>
                <div className="w-10 h-5 bg-slate-200 rounded-full flex items-center justify-start px-1 cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700">
                  <Smartphone size={18} /> <span className="text-sm font-medium">Push Notification</span>
                </div>
                <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
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
                  <span className="font-bold font-mono text-emerald-400">1,240</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed</span>
                  <span className="font-bold font-mono text-red-400">2</span>
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