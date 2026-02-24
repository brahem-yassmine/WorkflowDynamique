'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Mail,
  Briefcase,
  ShieldCheck,
  Activity,
  Layers,
  Calendar,
  Fingerprint
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '@/service/api.service';

interface UserProfile {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  domain?: string;
  isActive: boolean;
  createdAt?: string;
}

interface RoleDetails {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roleDetails, setRoleDetails] = useState<RoleDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setProfile(parsedUser);

          // Try to fetch role details (permissions) without blocking the page
          try {
            const rolesRes = await apiService.getRoles();
            if (rolesRes && rolesRes.success && rolesRes.data) {
              const currentRole = rolesRes.data.find((r: any) =>
                r.name.toLowerCase() === parsedUser.role.toLowerCase()
              );
              if (currentRole) {
                setRoleDetails(currentRole);
              }
            }
          } catch (roleErr) {
            console.warn("Could not fetch role permissions matrix:", roleErr);
          }
        }
      } catch (err) {
        console.error("Critical error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, duration: 0.5 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (profile && (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Header Profile Section - Compactified */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>

        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-xl shadow-indigo-100">
            {(profile.firstName || profile.email).charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full shadow-lg shadow-emerald-100 flex items-center justify-center">
            <Activity size={10} className="text-white" />
          </div>
        </div>

        <div className="text-center md:text-left relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">System Node Identity</h2>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100 self-center md:self-auto">
              {profile.role}
            </span>
          </div>
          <p className="text-slate-500 font-medium mt-1 flex items-center justify-center md:justify-start gap-2 text-sm">
            <Mail size={14} className="text-slate-400" />
            {profile.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800">
        {/* Left Column: Role & Permissions */}
        <div className="lg:col-span-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Identity Card */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Fingerprint size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Identity Signature</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Status</span>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">VERIFIED_NODE</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Lattice ID</span>
                  <span className="text-xs font-black text-slate-700 font-mono truncate max-w-[120px]">{profile._id}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Active Since</span>
                  <span className="text-xs font-black text-slate-700">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active Session'}</span>
                </div>
              </div>
            </motion.div>

            {/* Organizational Context Card */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Organizational Domain</h3>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Domain</p>
                  <p className="text-lg font-black text-indigo-700 tracking-tight">{profile.domain || 'Main Lattice'}</p>
                </div>
                <div className="p-4 bg-indigo-700 text-white rounded-2xl relative overflow-hidden group">
                  <Activity size={40} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Sector Visibility</p>
                  <p className="text-sm font-black">Cross-Functional Operational Access</p>
                </div>
              </div>
            </motion.div>

            {/* Access Lattice Card */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Layers size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Structural Authority</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-indigo-100">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Access Role</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight uppercase">{profile.role}</p>
                  </div>
                </div>
                {roleDetails && (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-t border-slate-50 pt-3">
                    {roleDetails.description || "Authorized system persona with standard lattice access."}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Permissions Grid */}
          <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <Shield className="text-indigo-600" /> System Access Matrix
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Verified Authority Permissions</p>
              </div>
              <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                Level 4 Cryptographic Clearance
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roleDetails && roleDetails.permissions && roleDetails.permissions.length > 0 ? (
                roleDetails.permissions.map((perm, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02, backgroundColor: '#f5f7ff' }}
                    className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex items-center gap-3 transition-colors cursor-default"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    <span className="text-xs font-black text-slate-600 tracking-tight uppercase">{perm.replace(/_/g, ' ')}</span>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Standard Operational Access - No Specific Lattice Restrictions Found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )) || null;
}
