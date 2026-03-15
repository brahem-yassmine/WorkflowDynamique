'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Activity, 
  Trash2, 
  Edit,
  Mail,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  MoreVertical,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { showAlert, showConfirm } from '@/lib/alerts';

export default function MembersView({ workflowId }: { workflowId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchMembers();
    fetchSystemUsers();
  }, [workflowId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await apiService.getWorkflowMembers(workflowId);
      if (res.success) setMembers(res.data);
    } catch (error) {
      console.error('Fetch members error:', error);
      toast.error('Could not load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemUsers = async () => {
     try {
       const res = await apiService.getUsers();
       if (res.success) setUsers(res.data);
     } catch (err) {}
  };

  const handleDelete = async (userId: string) => {
     const confirmed = await showConfirm({
        title: 'Remove Member',
        text: 'Are you sure you want to remove this member? Note: This only removes them from the template if assigned directly.',
        confirmButtonText: 'Yes, Remove'
     });
     if (!confirmed) return;
     toast.success("Member removal simulated (needs template update)");
  };

  if (loading) return <div className="text-center p-10 font-bold text-slate-300">Synchronizing user data...</div>;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Assigned Logic Operators</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocol participants and active instance responders</p>
         </div>
         <button 
           onClick={() => setShowAddModal(true)}
           className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
         >
           <Plus size={16} />
           Provision Operator
         </button>
      </div>

      <div className="flex-1 space-y-4 pr-2 overflow-y-auto custom-scrollbar">
        {members.length === 0 ? (
          <div className="p-12 bg-white rounded-[32px] border border-dashed border-slate-200 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
                <Users size={32} />
             </div>
             <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No active operators found</p>
          </div>
        ) : members.map((member) => (
          <motion.div
            key={member._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[28px] border border-slate-100 p-6 flex items-center justify-between hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
          >
            <div className="flex items-center gap-6">
               <div className="relative">
                  <div className="w-16 h-16 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-500 text-xl font-black uppercase shadow-inner border border-indigo-100 overflow-hidden">
                     {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : (member.name?.charAt(0) || '?')}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white rounded-lg flex items-center justify-center ${
                    member.isActiveMember ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}>
                    <Activity size={10} className="text-white" />
                  </div>
               </div>
               
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <h4 className="text-lg font-black text-slate-800 tracking-tight">{member.name}</h4>
                     <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                       member.role === 'admin' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-blue-50 text-blue-500 border-blue-100'
                     }`}>
                        {member.role}
                     </span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Mail size={12} />
                        <span className="text-xs font-medium">{member.email}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Current Tasks:</span>
                        <span className="text-xs font-black text-indigo-500">{member.tasks.length} Active Nodes</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="flex flex-col items-end gap-1.5">
                  <div className="flex gap-1.5">
                     {member.isTemplateMember && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                           <Shield size={10} /> Template Fixed
                        </div>
                     )}
                     {member.isActiveMember && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                           <Activity size={10} /> In-Process
                        </div>
                     )}
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toast.info("Profile analytics coming soon")}
                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                     <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(member._id)}
                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                     <Trash2 size={18} />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
