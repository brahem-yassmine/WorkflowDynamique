'use client'

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  RefreshCw,
  Save,
  History,
  Camera,
  ArrowLeft,
  Fingerprint,
  Briefcase,
  Layers,
  Activity,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../services/api';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';

export default function UserProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Loading...',
    email: '',
    role: 'User'
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [forensics, setForensics] = useState({
    authLevel: 'L1 User',
    uptime: '99.9%',
    lastUplink: 'N/A',
    primaryIp: '192.168.x.x',
    nodeCreated: 'N/A'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserId(user._id || user.id);
        
        setFormData({
          name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || 'User')),
          email: user.email || '',
          role: user.role === 'admin' ? 'Administrator' : (user.role === 'super_admin' ? 'Super Admin' : 'Node User')
        });

        if (user.avatar) {
            setProfileImage(user.avatar);
        } else {
            const lsAvatar = localStorage.getItem('avatar_' + (user._id || user.id));
            if (lsAvatar) setProfileImage(lsAvatar);
        }

        const objectId = user._id || user.id;
        let createdAtDate = user.createdAt ? new Date(user.createdAt) : null;
        if (!createdAtDate && objectId && typeof objectId === 'string' && objectId.length === 24) {
            createdAtDate = new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
        }
        
        const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : new Date();

        const formatOptions: Intl.DateTimeFormatOptions = {
            dateStyle: 'medium',
            timeStyle: 'short'
        };

        setForensics({
            authLevel: user.role === 'admin' ? 'L2 Admin' : 'L1 User',
            uptime: '99.9%',
            lastUplink: lastLoginDate.toLocaleString(undefined, formatOptions),
            primaryIp: user.ip || '192.168.1.1',
            nodeCreated: createdAtDate ? createdAtDate.toLocaleString(undefined, formatOptions) : 'Joined Recently'
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
      const names = formData.name.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || '';

      const userPayload: any = {
        firstName,
        lastName,
        email: formData.email,
        name: formData.name
      };

      const userRes = await api.put(`/api/users/${userId}`, userPayload);

      if (userRes.data.success) {
        // Normalize the user object stored in localStorage for consistency
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userData = userRes.data.data;
        
        // Ensure all possible name fields are unified in localStorage
        const updatedUser = { 
            ...storedUser, 
            ...userData,
            name: formData.name, // Explicitly set the new name
            firstName,
            lastName
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (profileImage) {
            localStorage.setItem('avatar_' + userId, profileImage);
        }
        toast.success("Profile synchronized successfully!");
        setTimeout(() => {
            window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Sync error detected.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto py-10 px-6">
      <Toaster position="top-right" richColors />
      
      {/* Main Identity Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100/20 border border-slate-100 relative overflow-hidden group"
      >
        {/* Abstract background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full -mr-20 -mt-20 opacity-60 transition-transform group-hover:scale-110 duration-[2s]"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative">
            <div 
              className="w-32 h-32 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-indigo-200 overflow-hidden cursor-pointer group/avatar relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110 duration-500" />
              ) : (
                formData.name.charAt(0).toUpperCase()
              )}
              
              {/* Overlay for upload */}
              <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
               <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Node Identity</h1>
              <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-indigo-200">
                {formData.role}
              </div>
            </div>
            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2.5 text-lg">
              <Mail size={18} className="text-indigo-400" />
              {formData.email}
            </p>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          
          <div className="hidden lg:block h-20 w-px bg-slate-100 mx-6"></div>
          
          <div className="flex flex-col items-center md:items-end gap-2 text-right">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Matrix Sync</span>
             <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-tight">Verified Protocol</span>
          </div>
        </div>
      </motion.div>

      {/* Grid Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-800">
        
        {/* IDENTITY SIGNATURE */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 group hover:border-indigo-100 transition-colors"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-indigo-50">
              <Fingerprint size={24} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Identity Signature</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-end pb-4 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</span>
              <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-tight">Verified_Node</span>
            </div>
            <div className="flex justify-between items-end pb-4 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Lattice ID</span>
              <span className="text-xs font-black text-slate-700 font-mono truncate max-w-[150px]">{userId || "N/A"}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Since</span>
              <span className="text-xs font-black text-slate-700">{forensics.nodeCreated || "Active Session"}</span>
            </div>
          </div>
        </motion.div>

        {/* ORGANIZATIONAL DOMAIN */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 group hover:border-indigo-100 transition-colors"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-indigo-50">
              <Briefcase size={24} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Organizational Domain</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned Domain</p>
               <p className="text-xl font-black text-indigo-700 tracking-tight">Main Lattice</p>
            </div>
            <div className="p-5 bg-indigo-700 text-white rounded-[1.5rem] relative overflow-hidden group/domain">
               <Activity size={50} className="absolute -right-4 -bottom-4 opacity-10 group-hover/domain:scale-125 transition-transform duration-700" />
               <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 opacity-70">Sector Visibility</p>
               <p className="text-sm font-black leading-snug">Cross-Functional Operational Access</p>
            </div>
          </div>
        </motion.div>

        {/* STRUCTURAL AUTHORITY */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 group hover:border-indigo-100 transition-colors"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-indigo-50">
              <Layers size={24} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Structural Authority</h3>
          </div>
          
          <div className="flex items-center gap-5 mb-8">
             <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-2xl border border-indigo-100 shadow-inner">
                <ShieldCheck size={32} />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Access Role</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight uppercase">{formData.role}</p>
             </div>
          </div>
          <p className="text-[11px] text-slate-500 font-bold leading-relaxed italic border-t border-slate-50 pt-5">
            Authorized system persona with level-4 lattice clearance and cross-sector operational visibility.
          </p>
        </motion.div>
      </div>

      {/* Profile Configuration Area (Former edit form) */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Security Credentials</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your identity spec and authentication keys.</p>
          </div>
        </div>

        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <InputGroup label="Identity Name" icon={<User size={16} />}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all outline-none text-lg"
                placeholder="Full Name"
              />
            </InputGroup>
            <InputGroup label="Registered Email" icon={<Mail size={16} />}>
              <input
                type="email"
                name="email"
                value={formData.email}
                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 font-bold text-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all outline-none cursor-not-allowed text-lg"
                readOnly
              />
            </InputGroup>
          </div>

          <InputGroup label="Access Key (Password)" icon={<Lock size={16} />}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
              <div className="flex-1 h-16 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 flex items-center font-bold text-slate-300 text-lg tracking-[0.5em]">
                ••••••••••••••••
              </div>
              <Link 
                href="/forget?from=user"
                className="px-10 py-5 bg-slate-900 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap text-center"
              >
                Reset Access Key
              </Link>
            </div>
          </InputGroup>

          <div className="pt-8 flex flex-col sm:flex-row gap-6">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              {isSaving ? 'Synchronizing Node...' : 'Synchronize Identity'}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-5 bg-slate-50 text-slate-400 rounded-[1.25rem] font-black transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95 border border-slate-100"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function InputGroup({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-slate-400 pl-1">
        {icon}
        <label className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{label}</label>
      </div>
      {children}
    </div>
  );
}

function ForensicRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-indigo-300">{value}</span>
    </div>
  );
}
