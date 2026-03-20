'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Edit Modal States
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', role: '', domain: '' });
  const [roles, setRoles] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [savingUser, setSavingUser] = useState(false);

  // Add Member Modal States
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [workflowDoc, setWorkflowDoc] = useState<any>(null);
  const [addForm, setAddForm] = useState({ userId: '', nodeId: '' });
  const [savingAdd, setSavingAdd] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchSystemUsers();
    fetchMetadata();
    fetchWorkflowData();
  }, [workflowId]);

  const fetchMetadata = async () => {
    try {
      const [rolesRes, domainsRes] = await Promise.all([
        apiService.getRoles(),
        apiService.getDomains()
      ]);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (domainsRes.success) setDomains(domainsRes.data);
    } catch (e) {}
  };

  const fetchWorkflowData = async () => {
    try {
      const res = await apiService.getWorkflowById(workflowId);
      if (res.success && res.data) {
        setWorkflowDoc(res.data);
        setWorkflowNodes(res.data.nodes || []);
      }
    } catch(e) {}
  };

  const fetchMembers = async () => {
    if (workflowId === 'standard') {
      setMembers([]);
      setLoading(false);
      return;
    }
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
        confirmButtonText: 'Yes, Remove',
        danger: true
     });
     if (!confirmed) return;
     toast.success("Member removal simulated (needs template update)");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingMember) return;
      try {
          setSavingUser(true);
          await apiService.updateUser(editingMember._id, editForm);
          toast.success('Member profile updated');
          setEditingMember(null);
          fetchMembers();
      } catch (err: any) {
          toast.error(err.message || 'Error updating member');
      } finally {
          setSavingUser(false);
      }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.userId || !addForm.nodeId || !workflowDoc) {
      toast.error('Please select both a user and a task');
      return;
    }
    
    try {
      setSavingAdd(true);
      // Clone the nodes to modify
      const updatedNodes = workflowDoc.nodes.map((node: any) => {
        if (node.id === addForm.nodeId) {
          const currentAssignees = Array.isArray(node.data?.assigneeIds) ? [...node.data.assigneeIds] : [];
          if (!currentAssignees.includes(addForm.userId)) {
            currentAssignees.push(addForm.userId);
          }
          return {
            ...node,
            data: {
              ...node.data,
              assigneeIds: currentAssignees,
              assignedTo: addForm.userId, // Update assignedTo so it displays in NodeDetailsPanel
              assigneeSelectionType: 'user', // Also force the UI toggle in NodeDetailsPanel
              assigneeType: 'specific' 
            }
          };
        }
        return node;
      });

      const updatedWorkflow = { ...workflowDoc, nodes: updatedNodes };
      await apiService.updateWorkflow(workflowId, updatedWorkflow);
      
      toast.success('Member assigned to task successfully');
      setShowAddModal(false);
      setAddForm({ userId: '', nodeId: '' });
      fetchMembers();
      fetchWorkflowData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign member');
    } finally {
      setSavingAdd(false);
    }
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
           Assign to new member
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
            className="group bg-gradient-to-br from-white to-slate-50 rounded-[28px] border-2 border-slate-100/60 p-6 flex items-center justify-between hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
          >
            <div className="flex items-center gap-6">
               <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 text-xl font-black uppercase shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-indigo-200 overflow-hidden rotate-0 group-hover:rotate-3 transition-transform duration-300">
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
                     <div className="flex flex-col gap-1 items-start">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Assigned Tasks ({member.assignedTasks?.length || 0}):</span>
                        <div className="flex flex-wrap gap-1">
                          {member.assignedTasks?.length > 0 ? (
                            member.assignedTasks.map((taskName: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold">
                                {taskName}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-bold text-slate-400">None</span>
                          )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="flex flex-col items-end gap-1.5">
                  <div className="flex gap-1.5">
                     {member.isTemplateMember && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200/50">
                           <Shield size={10} /> Template Fixed
                        </div>
                     )}
                     {member.isActiveMember && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50">
                           <Activity size={10} /> In-Process
                        </div>
                     )}
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                        setEditingMember(member);
                        setEditForm({
                            firstName: member.firstName || member.name?.split(' ')[0] || '',
                            lastName: member.lastName || member.name?.split(' ').slice(1).join(' ') || '',
                            email: member.email || '',
                            role: member.role || '',
                            domain: member.domain || ''
                        });
                    }}
                    className="p-3 text-indigo-400 hover:text-white hover:bg-indigo-500 rounded-xl transition-all shadow-sm hover:shadow-indigo-200"
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

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMember(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{editingMember.name || 'Edit Member'}</h2>
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">Modify participant profile</p>
                  </div>
                  <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">First Name</label>
                    <input
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 border-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Last Name</label>
                    <input
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 border-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 border-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Assigned Tasks in Workflow</label>
                  <div className="w-full flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[48px] items-center">
                    {editingMember.assignedTasks?.length > 0 ? (
                      editingMember.assignedTasks.map((task: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-indigo-100/50 text-indigo-700 rounded-lg text-xs font-bold tracking-tight border border-indigo-200/50">
                          {task}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-slate-400 pl-2">No active assignments</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Access Tier (Role)</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 border-none appearance-none"
                    >
                      <option value="user">USER</option>
                      <option value="admin">ADMIN</option>
                      <option value="super_admin">SUPER ADMIN</option>
                      {roles.map(r => (
                        <option key={r._id} value={r.name}>{r.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Domain</label>
                    <select
                      value={editForm.domain}
                      onChange={(e) => setEditForm(prev => ({ ...prev, domain: e.target.value }))}
                      className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 border-none appearance-none"
                    >
                      {domains.map(d => (
                        <option key={d._id} value={d.name}>{d.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="flex-1 py-4 text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50"
                  >
                    {savingUser ? 'Committing...' : 'Commit Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Assign to Task</h2>
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">Add existing user to a workflow task</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddMember} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select User</label>
                  <select
                    required
                    value={addForm.userId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 border-none appearance-none"
                  >
                    <option value="">-- Choose User --</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Workflow Task</label>
                  <select
                    required
                    value={addForm.nodeId}
                    onChange={(e) => setAddForm(prev => ({ ...prev, nodeId: e.target.value }))}
                    className="w-full h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 border-none appearance-none"
                  >
                    <option value="">-- Choose Task --</option>
                    {workflowNodes.filter(n => n.type !== 'start' && n.type !== 'end').map(n => (
                      <option key={n.id} value={n.id}>{n.data?.label || 'Unnamed Task'}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 text-slate-400 font-black hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAdd || !addForm.userId || !addForm.nodeId}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50"
                  >
                    {savingAdd ? 'Assigning...' : 'Assign User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
