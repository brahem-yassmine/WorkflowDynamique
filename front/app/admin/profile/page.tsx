'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, Camera, History } from 'lucide-react';
import { api } from '../../services/api';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      setUser(JSON.parse(data));
    }
    setLoading(false);
  }, []);

  if (loading || !user) {
    return <div className="p-10 text-center">Loading User Data...</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-white rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 font-black text-2xl">
          {user.name?.slice(0,2).toUpperCase() || 'UM'}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">{user.name || 'User Member'}</h1>
          <p className="text-indigo-500 font-bold uppercase tracking-widest text-xs">{user.role}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connectivity (Email)</label>
          <div className="p-4 bg-slate-50 rounded-xl font-bold text-slate-700">{user.email}</div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity Node Status</label>
          <div className="p-4 bg-slate-50 rounded-xl font-bold text-emerald-600">Active / Synchronized</div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <History size={60} className="absolute top-4 right-4 opacity-10" />
        <h3 className="text-xs font-black opacity-40 uppercase tracking-widest mb-4">Lattice Forensics</h3>
        <p className="text-sm font-medium">Node IP: <span className="text-indigo-300">192.168.1.1</span></p>
        <p className="text-sm font-medium mt-1">Last Uplink: <span className="text-indigo-300">{new Date().toLocaleString()}</span></p>
      </div>
    </div>
  );
}
