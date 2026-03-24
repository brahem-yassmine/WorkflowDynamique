'use client'

import React, { useState, useEffect, useRef } from 'react';
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
import Link from 'next/link';
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
    role: 'User',
    companyName: ''
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [regionSettings, setRegionSettings] = useState({
    timezone: 'UTC',
    locale: 'en-US'
  });
  const [rawForensicsData, setRawForensicsData] = useState<{createdAt: Date | null, lastLogin: Date | null, ip: string, tenantCreatedAt: Date | null}>({
    createdAt: null, lastLogin: null, ip: '192.168.1.1', tenantCreatedAt: null
  });

  const [forensics, setForensics] = useState({
    authLevel: 'L4 Master',
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
        const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
        setFormData({
          name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || 'Admin')),
          email: user.email || '',
          role: user.role === 'super_admin' ? 'Master Administrator' : (user.role === 'admin' ? 'admin' : 'Agent Node'),
          companyName: tenant.name || ''
        });

        // Initialize region settings from localStorage if exists
        const savedRegion = localStorage.getItem('regionSettings');
        if (savedRegion) {
            try {
                setRegionSettings(JSON.parse(savedRegion));
            } catch (e) {}
        }

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
        const tenantCreatedAtDate = tenant.createdAt ? new Date(tenant.createdAt) : null;

        setRawForensicsData({
            createdAt: createdAtDate,
            lastLogin: lastLoginDate,
            ip: user.ip || '192.168.1.1',
            tenantCreatedAt: tenantCreatedAtDate
        });
        
        let authLevel = 'L1 User';
        if (user.role === 'super_admin') authLevel = 'L3 Super Admin';
        else if (user.role === 'admin') authLevel = 'L2 Admin';
        
        setForensics(prev => ({ ...prev, authLevel }));
      }
    }
  }, []);

  // Update dates whenever region settings or raw data changes
  useEffect(() => {
      const { createdAt, lastLogin, ip, tenantCreatedAt } = rawForensicsData;
      if (!lastLogin) return; // not initialized yet

      const formatOptions: Intl.DateTimeFormatOptions = {
          timeZone: regionSettings.timezone,
          dateStyle: 'medium',
          timeStyle: 'short'
      };

      const formatSafe = (dateObj: Date | null) => {
          if (!dateObj) return 'Unknown';
          try {
              return new Intl.DateTimeFormat(regionSettings.locale, formatOptions).format(dateObj);
          } catch(e) {
              return dateObj.toLocaleString(); // fallback if timezone is bad
          }
      };

      const uptimeStr = tenantCreatedAt 
          ? `${Math.max(1, Math.floor((new Date().getTime() - tenantCreatedAt.getTime()) / (1000 * 3600 * 24)))} Days Active`
          : '99.9%';

      setForensics(prev => ({
          ...prev,
          uptime: uptimeStr,
          lastUplink: formatSafe(lastLogin),
          primaryIp: ip,
          nodeCreated: formatSafe(createdAt)
      }));
  }, [regionSettings, rawForensicsData]);

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

      const userRes = await api.put(`/api/users/${userId}`, userPayload);

      if (userRes.data.success) {
        // Update localStorage user
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...storedUser, ...userRes.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (profileImage) {
            localStorage.setItem('avatar_' + userId, profileImage);
        }
      }

      // 2. Update Company Profile if Admin
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.role === 'admin' && formData.companyName?.trim()) {
        const tenantRes = await api.put('/api/tenants/info', {
          name: formData.companyName
        });

        if (tenantRes.data.success) {
          localStorage.setItem('tenant', JSON.stringify(tenantRes.data.data));
        }
      }

      toast.success("Profile synchronized successfully!");
      // Refetch logic or reload
      setTimeout(() => window.location.reload(), 1500);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" richColors />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
            <div className="relative mt-8">
              <div className="w-24 h-24 bg-white rounded-3xl mx-auto p-1 shadow-xl relative">
                <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      formData.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95 z-10"
                >
                  <Camera size={14} />
                </button>
              </div>
              <h2 className="text-xl font-black text-slate-800 mt-4 tracking-tight">{formData.name}</h2>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-1">{formData.role}</p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Level</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{forensics.authLevel}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattice Uptime</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{forensics.uptime}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <History size={80} className="text-white" />
            </div>
            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-6 relative z-10">Access Forensics</h3>
            <div className="space-y-4 relative z-10">
              <ForensicRow label="Last Uplink" value={forensics.lastUplink} />
              <ForensicRow label="Primary IP" value={forensics.primaryIp} />
              <ForensicRow label="Node Created" value={forensics.nodeCreated} />
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
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-12 bg-slate-50 border-none rounded-xl px-4 flex items-center font-bold text-slate-400">
                    ••••••••
                  </div>
                  <Link 
                    href="/forget"
                    className="px-6 py-3 bg-slate-100 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    Forget Password?
                  </Link>
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
              title="Notification Settings"
              desc="Manage your notification channels and alert preferences."
              icon={<Bell size={18} className="text-amber-500" />}
              action="Configure →"
              href="/admin/Log"
            />
            <PreferenceCard
              title="Display & Region"
              desc="Configure your timezone, regional settings, and global display options."
              icon={<Globe size={18} className="text-blue-500" />}
              action="Customize →"
              onClick={() => setShowRegionModal(true)}
            />
          </div>
        </div>
      </div>

      {showRegionModal && (
        <RegionSettingsModal 
          initialTimezone={regionSettings.timezone}
          initialLocale={regionSettings.locale}
          onClose={() => setShowRegionModal(false)}
          onSave={(tz, loc) => {
              const newSettings = { timezone: tz, locale: loc };
              setRegionSettings(newSettings);
              localStorage.setItem('regionSettings', JSON.stringify(newSettings));
              toast.success("Region settings synchronized.");
              setShowRegionModal(false);
          }}
        />
      )}
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

function PreferenceCard({ title, desc, icon, action, href, onClick }: { title: string; desc: string; icon: React.ReactNode; action: string; href?: string; onClick?: () => void }) {
  const content = (
    <>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
          <h4 className="text-sm font-black text-slate-800 tracking-tight">{title}</h4>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{desc}</p>
      </div>
      <div className="text-[10px] w-fit font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
        {action}
      </div>
    </>
  );

  return (
    <div 
      className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {href ? (
        <Link href={href} className="flex flex-col justify-between h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function RegionSettingsModal({ onClose, onSave, initialTimezone, initialLocale }: { onClose: () => void; onSave: (tz: string, loc: string) => void; initialTimezone: string; initialLocale: string }) {
  const [tz, setTz] = useState(initialTimezone);
  const [loc, setLoc] = useState(initialLocale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
             <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Display & Region</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Configure global localization nodes.</p>
          </div>
        </div>

        <div className="space-y-6">
           <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Primary Timezone</label>
             <select value={tz} onChange={(e) => setTz(e.target.value)} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all outline-none appearance-none cursor-pointer">
               <option value="UTC">UTC (Coordinated Universal Time)</option>
               <option value="Europe/Paris">CET (Central European Time)</option>
               <option value="America/New_York">EST (Eastern Standard Time)</option>
               <option value="America/Los_Angeles">PST (Pacific Standard Time)</option>
             </select>
           </div>

           <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Regional Format</label>
             <select value={loc} onChange={(e) => setLoc(e.target.value)} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all outline-none appearance-none cursor-pointer">
               <option value="en-US">English (United States)</option>
               <option value="en-GB">English (United Kingdom)</option>
               <option value="fr-FR">French (France)</option>
               <option value="es-ES">Spanish (Spain)</option>
             </select>
           </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-50 flex gap-4">
          <button onClick={() => onSave(tz, loc)} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">Synchronize Settings</button>
          <button onClick={onClose} className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-slate-700 transition-all">Discard</button>
        </div>
      </div>
    </div>
  );
}
