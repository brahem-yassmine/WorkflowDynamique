'use client'

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Bell,
  Globe,
  History,
  Camera,
  Building
} from 'lucide-react';
import { api } from '../../services/api';
import { apiService } from '@/service/api.service';
import { toast, Toaster } from 'sonner';

export default function ProfilePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Loading...',
    email: '',
    password: '',
    role: 'User',
    companyName: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserId(user._id || user.id);
        const syncPass = localStorage.getItem('user_pass_sync') || '';
        const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
        setFormData({
          name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || 'Admin')),
          email: user.email || '',
          password: syncPass,
          role: user.role === 'super_admin' ? 'Master Administrator' : (user.role === 'admin' ? 'Infrastructure Admin' : 'Agent Node'),
          companyName: tenant.name || ''
        });
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!userId) return toast.error("User identity unidentified.");
    if (!formData.name.trim()) return toast.error("Identity name required.");
    
    setIsSaving(true);
    try {
      // 1. Update User Profile
      const names = formData.name.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || '';

      const userPayload: any = {
        firstName,
        lastName,
        email: formData.email,
        name: formData.name
      };

      if (formData.password) {
        userPayload.password = formData.password;
      }

      const userRes = await api.put(`/api/users/${userId}`, userPayload);

      if (userRes.data.success) {
        // Update localStorage user
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...storedUser, ...userRes.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (formData.password) {
          localStorage.setItem('user_pass_sync', formData.password);
        }
      }

      // 2. Update Company Profile if Admin
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.role === 'admin' && formData.companyName.trim()) {
        const tenantRes = await api.put('/api/tenants/info', {
          name: formData.companyName
        });

        if (tenantRes.data.success) {
          localStorage.setItem('tenant', JSON.stringify(tenantRes.data.data));
        }
      }

      toast.success("Profile synchronized successfully!");
      // Reload to reflect changes in Header
      window.location.reload();

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Sync error detected.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" richColors />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
            <div className="relative mt-8">
              <div className="w-24 h-24 bg-white rounded-3xl mx-auto p-1 shadow-xl relative">
                <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl">
                  {formData.name.slice(0, 2).toUpperCase()}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                  <Camera size={14} />
                </button>
              </div>
              <h2 className="text-xl font-black text-slate-800 mt-4 tracking-tight">{formData.name}</h2>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-1">{formData.role}</p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Level</p>
                <p className="text-sm font-bold text-slate-700 mt-1">L4 Master</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattice Uptime</p>
                <p className="text-sm font-bold text-slate-700 mt-1">99.8%</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <History size={80} className="text-white" />
            </div>
            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-6 relative z-10">Access Forensics</h3>
            <div className="space-y-4 relative z-10">
              <ForensicRow label="Last Uplink" value="Today, 10:30 AM" />
              <ForensicRow label="Primary IP" value="192.168.1.1" />
              <ForensicRow label="Node Created" value="Jan 15, 2025" />
            </div>
          </div>
        </div>

        {/* Configuration Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Credentials section */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Security Credentials</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Identity Spec (Name)" icon={<User size={16} />}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                  />
                </InputGroup>
                <InputGroup label="Connectivity (Email)" icon={<Mail size={16} />}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                  />
                </InputGroup>
              </div>

              <InputGroup label="Access Key (Password)" icon={<Lock size={16} />}>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={showPassword ? "Type new password..." : "•••••••• "}
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 transition-all outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </InputGroup>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Synchronizing...' : 'Synchronize Credentials'}
                </button>
                <button className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* Company section (Admin only) */}
          {formData.role.includes('Admin') && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Building size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Company Blueprint</h3>
              </div>

              <div className="space-y-6">
                <InputGroup label="Enterprise Identity (Company Name)" icon={<Globe size={16} />}>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    placeholder="Enter your company name..."
                  />
                </InputGroup>
                <p className="text-[10px] text-slate-400 font-medium px-2 leading-relaxed">
                  Note: Updating the enterprise identity affects the lattice headers and protocol assets for all associated nodes.
                </p>
              </div>
            </div>
          )}

          {/* Preference sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PreferenceCard
              title="Lattice Alerts"
              desc="Configure your notification protocol and audit frequency."
              icon={<Bell size={18} className="text-amber-500" />}
              action="Configure →"
            />
            <PreferenceCard
              title="System Flux"
              desc="Manage timezone localization and visual display nodes."
              icon={<Globe size={18} className="text-blue-500" />}
              action="Customize →"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400 pl-1">
        {icon}
        <label className="text-[10px] font-black uppercase tracking-widest">{label}</label>
      </div>
      {children}
    </div>
  );
}

function ForensicRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-indigo-200">{value}</span>
    </div>
  );
}

function PreferenceCard({ title, desc, icon, action }: { title: string; desc: string; icon: React.ReactNode; action: string }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">{title}</h4>
      </div>
      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{desc}</p>
      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
        {action}
      </button>
    </div>
  );
}
