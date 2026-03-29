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
  ArrowLeft
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto py-6 px-4">
      <Toaster position="top-right" richColors />
      
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <div className="text-slate-500 font-bold transition-all text-sm">
          Account Profile Management
        </div>
        <div className="bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
          User Identity Node
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-700 to-indigo-500 opacity-90"></div>
            <div className="relative mt-8">
              <div className="w-24 h-24 bg-white rounded-3xl mx-auto p-1 shadow-xl relative">
                <div 
                  className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl overflow-hidden cursor-pointer" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      formData.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white hover:bg-indigo-700 transition-all active:scale-95 z-10"
                >
                  <Camera size={14} />
                </button>
              </div>
              <h2 className="text-xl font-black text-slate-800 mt-4 tracking-tight">{formData.name}</h2>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-1.5">{formData.role}</p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{forensics.authLevel}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uptime</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{forensics.uptime}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <History size={80} className="text-white" />
            </div>
            <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-6 relative z-10">Access Forensics</h3>
            <div className="space-y-4 relative z-10">
              <ForensicRow label="Last Uplink" value={forensics.lastUplink} />
              <ForensicRow label="Primary IP" value={forensics.primaryIp} />
              <ForensicRow label="Node Created" value={forensics.nodeCreated} />
            </div>
          </motion.div>
        </div>

        {/* Configuration Area */}
        <div className="lg:col-span-2 space-y-8">
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Security Credentials</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Manage your identity spec and authentication keys.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup label="Identity Name" icon={<User size={16} />}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all outline-none"
                    placeholder="Full Name"
                  />
                </InputGroup>
                <InputGroup label="Registered Email" icon={<Mail size={16} />}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-bold text-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all outline-none cursor-not-allowed"
                    readOnly
                  />
                </InputGroup>
              </div>

              <InputGroup label="Access Key (Password)" icon={<Lock size={16} />}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex-1 h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 flex items-center font-bold text-slate-300">
                    ••••••••••••••••
                  </div>
                  <Link 
                    href="/forget?from=user"
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap text-center"
                  >
                    Forget Password?
                  </Link>
                </div>
              </InputGroup>

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Synchronizing...' : 'Synchronize Identity'}
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95 border border-slate-100"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </motion.section>

          {/* User Specific Status/Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 bg-indigo-100/50 rounded-3xl border border-indigo-100"
          >
            <div className="flex gap-4">
               <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 shrink-0">
                  <ShieldCheck size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-2">Protocol Verified</h4>
                  <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                    Your node is currently active and verified. All operations performed on the lattice are logged for security and forensic compliance. Stay vigilant of system alerts in your Command Center.
                  </p>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
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
