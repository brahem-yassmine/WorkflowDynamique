"use client"
import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Clock, Zap, XCircle, Trash2 } from 'lucide-react';
import { apiService } from '@/service/api.service';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const NotificationPage = () => {
  const [stats, setStats] = useState({ delivered: 1240, failed: 2 });
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    push: true
  });

  const [triggers, setTriggers] = useState([
    {
      id: 1,
      title: 'Step Entry Trigger',
      desc: 'Triggered when a task enters a new stage',
      type: 'Zap',
      colorName: 'blue',
      status: 'ACTIVE',
      msgChannels: ['email', 'push'],
      preview: '"New task assigned to you in Workflow [Name]"'
    },
    {
      id: 2,
      title: 'Rejection Alert',
      desc: 'Triggered when a validator rejects a step',
      type: 'XCircle',
      colorName: 'red',
      status: 'ACTIVE',
      msgChannels: ['email'],
      preview: 'Sent to: Requestor & Manager'
    }
  ]);

  const [reminders, setReminders] = useState({
    emailReminder: 'After 24 hours of inactivity',
    smsEscalation: 'Final escalation (48h)'
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

    const savedTriggers = localStorage.getItem('user_notification_triggers');
    if (savedTriggers) {
      try {
        setTriggers(JSON.parse(savedTriggers));
      } catch (e) { }
    }

    const savedReminders = localStorage.getItem('user_notification_reminders');
    if (savedReminders) {
      try {
        setReminders(JSON.parse(savedReminders));
      } catch (e) { }
    }

    // Fetch real notification stats
    const fetchStats = async () => {
      try {
        const res = await apiService.getNotifications();
        if (res.success && res.data) {
          const now = new Date();
          const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
          const recentNotifications = res.data.filter((n: any) => new Date(n.createdAt) >= last24h);
          setStats({
            delivered: recentNotifications.length > 0 ? recentNotifications.length : res.data.length,
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

  const handleAddTrigger = () => {
    MySwal.fire({
      title: 'Create New Trigger',
      input: 'text',
      inputLabel: 'Trigger Event Name',
      inputPlaceholder: 'e.g. Task Overdue',
      showCancelButton: true,
      confirmButtonText: 'Create',
      confirmButtonColor: '#4f46e5',
      inputValidator: (value) => {
        if (!value) return 'You need to write something!';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newTriggers = [
          ...triggers,
          {
            id: Date.now(),
            title: result.value,
            desc: 'Custom user-defined trigger event',
            type: 'Bell',
            colorName: 'indigo',
            status: 'ACTIVE',
            msgChannels: ['email'],
            preview: 'Custom notification message template'
          }
        ];
        setTriggers(newTriggers);
        localStorage.setItem('user_notification_triggers', JSON.stringify(newTriggers));
        MySwal.fire('Created!', 'Your new trigger has been added.', 'success');
      }
    });
  };

  const handleDeleteTrigger = (id: number) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const newTriggers = triggers.filter(t => t.id !== id);
        setTriggers(newTriggers);
        localStorage.setItem('user_notification_triggers', JSON.stringify(newTriggers));
        MySwal.fire('Deleted!', 'Trigger has been removed.', 'success');
      }
    });
  };

  const handleEditReminder = (type: 'emailReminder' | 'smsEscalation', title: string) => {
    MySwal.fire({
      title: `Edit ${title}`,
      input: 'textarea',
      inputValue: reminders[type],
      showCancelButton: true,
      confirmButtonText: 'Save',
      confirmButtonColor: '#4f46e5'
    }).then((result) => {
      if (result.isConfirmed) {
        const newReminders = { ...reminders, [type]: result.value };
        setReminders(newReminders);
        localStorage.setItem('user_notification_reminders', JSON.stringify(newReminders));
        MySwal.fire('Saved!', 'Reminder template has been updated.', 'success');
      }
    });
  };

  const renderIcon = (type: string, size = 20) => {
    switch (type) {
      case 'Zap': return <Zap size={size} />;
      case 'XCircle': return <XCircle size={size} />;
      case 'Bell': return <Bell size={size} />;
      default: return <Bell size={size} />;
    }
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
          <button 
            onClick={handleAddTrigger}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md"
          >
            + New Trigger
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Configuration Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Triggers</h2>
            
            {triggers.length === 0 && (
               <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 text-center text-slate-500">
                  No active triggers configured. Click "+ New Trigger" to create one.
               </div>
            )}

            {triggers.map((trigger) => (
              <div key={trigger.id} className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-${trigger.colorName}-200 transition-all relative group`}>
                <button 
                  onClick={() => handleDeleteTrigger(trigger.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Trigger"
                >
                  <Trash2 size={18} />
                </button>

                <div className="flex items-start justify-between mb-4 pr-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${trigger.colorName}-50 text-${trigger.colorName}-600 rounded-lg`}>
                      {renderIcon(trigger.type, 20)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{trigger.title}</h3>
                      <p className="text-xs text-slate-500">{trigger.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">{trigger.status}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 py-3 border-t border-slate-50">
                  <div className="flex -space-x-2">
                     {(channels.email && trigger.msgChannels.includes('email')) && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white" title="Email"><Mail size={14} className="text-indigo-600"/></div>}
                     {(channels.push && trigger.msgChannels.includes('push')) && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white" title="Push"><Smartphone size={14} className="text-blue-600"/></div>}
                     {(channels.sms && trigger.msgChannels.includes('sms')) && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white" title="SMS"><MessageSquare size={14} className="text-slate-600"/></div>}
                     
                     {/* Fallback if all disabled but email is default fallback */}
                     {(!channels.email && !channels.push && trigger.msgChannels.includes('email')) && <Mail size={16} className="text-slate-400" />}
                  </div>
                  <p className="text-sm text-slate-600 italic">"{(trigger.title === 'Rejection Alert' && channels.email) ? trigger.preview : trigger.preview}"</p>
                </div>
              </div>
            ))}

            {/* Reminder Section */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4 text-amber-700">
                <Clock size={20} />
                <h3 className="font-bold">Inactivity Auto-Reminders</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg border border-amber-200/50">
                  <span className="text-sm text-amber-900 font-medium">{reminders.emailReminder}</span>
                  <button onClick={() => handleEditReminder('emailReminder', 'Email Reminder')} className="text-xs font-bold text-amber-700 underline hover:text-amber-900">Edit Email Template</button>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-lg border border-amber-200/50">
                  <span className="text-sm text-amber-900 font-medium">{reminders.smsEscalation}</span>
                  <button onClick={() => handleEditReminder('smsEscalation', 'SMS Alert')} className="text-xs font-bold text-amber-600 uppercase hover:text-amber-900 underline">Edit SMS Alert</button>
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

