"use client";

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Copy, 
  UserPlus, 
  MessageSquare, 
  Layers, 
  Variable, 
  Save, 
  Trash2,
  ChevronRight,
  Plus,
  CopyPlus,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';

interface MessageTemplate {
  _id: string;
  title: string;
  content: string;
  variables: string[];
  status: 'draft' | 'saved';
  updatedAt: string;
}

const InviteTeam = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<MessageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editor state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  // Modals state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalTitle, setSaveModalTitle] = useState('');
  const [saveModalStatus, setSaveModalStatus] = useState<'draft' | 'saved'>('draft');

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [selectedInviteUser, setSelectedInviteUser] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiService.getMessageTemplates();
      if (res.success) {
        setTemplates(res.data);
        if (res.data.length > 0 && !activeTemplate) {
          selectTemplate(res.data[0]);
        } else if (activeTemplate && activeTemplate._id !== 'new') {
          const updated = res.data.find((t: any) => t._id === activeTemplate._id);
          if (updated) selectTemplate(updated);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const selectTemplate = (t: MessageTemplate) => {
    setActiveTemplate(t);
    setDraftTitle(t.title);
    setDraftContent(t.content);
  };

  const handleCreateNew = () => {
    const newDraft: MessageTemplate = {
      _id: 'new',
      title: 'New Template',
      content: '',
      variables: ['user_name', 'team_name', 'sender_name', 'workflow_id', 'invite_link'],
      status: 'draft',
      updatedAt: new Date().toISOString()
    };
    setActiveTemplate(newDraft);
    setDraftTitle(newDraft.title);
    setDraftContent(newDraft.content);
  };

  const handleDuplicate = async () => {
    if (!activeTemplate || activeTemplate._id === 'new') return;
    try {
      const payload = {
        title: `${activeTemplate.title} (Copy)`,
        content: activeTemplate.content,
        status: activeTemplate.status,
        variables: activeTemplate.variables
      };
      const res = await apiService.createMessageTemplate(payload);
      if (res.success) {
        toast.success('Template duplicated successfully!');
        await fetchTemplates();
        selectTemplate(res.data);
      }
    } catch (error: any) {
      toast.error('Failed to duplicate template: ' + error.message);
    }
  };

  // ----- SAVE LOGIC -----
  const promptSave = () => {
    if (!draftContent.trim()) {
      toast.error('Message content cannot be empty.');
      return;
    }
    setSaveModalTitle(draftTitle || '');
    setSaveModalStatus(activeTemplate?.status || 'draft');
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!saveModalTitle.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    try {
      const payload = {
        title: saveModalTitle.trim(),
        content: draftContent,
        status: saveModalStatus,
        variables: activeTemplate?.variables || ['user_name', 'team_name', 'sender_name', 'workflow_id', 'invite_link']
      };
      if (activeTemplate?._id === 'new') {
        const res = await apiService.createMessageTemplate(payload);
        if (res.success) {
          toast.success('Template created successfully!');
          setDraftTitle(saveModalTitle.trim());
          await fetchTemplates();
          selectTemplate(res.data);
          setShowSaveModal(false);
        }
      } else if (activeTemplate) {
        const res = await apiService.updateMessageTemplate(activeTemplate._id, payload);
        if (res.success) {
          toast.success('Template updated successfully!');
          setDraftTitle(saveModalTitle.trim());
          fetchTemplates();
          setShowSaveModal(false);
        }
      }
    } catch (error: any) {
      toast.error('Failed to save template: ' + error.message);
    }
  };

  // ----- DELETE LOGIC -----
  const promptDelete = () => {
    if (!activeTemplate || activeTemplate._id === 'new') return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeTemplate || activeTemplate._id === 'new') return;
    try {
      const res = await apiService.deleteMessageTemplate(activeTemplate._id);
      if (res.success) {
        toast.success('Template deleted.');
        setActiveTemplate(null);
        fetchTemplates();
        setShowDeleteModal(false);
      }
    } catch (error: any) {
      toast.error('Failed to delete template: ' + error.message);
    }
  };

  // ----- INVITE LOGIC -----
  const promptInvite = async () => {
    const messageContent = draftContent.trim() ? draftContent : activeTemplate?.content || "";
    if (!messageContent) {
      toast.error('You need a message content to send an invite.');
      return;
    }

    if (usersList.length === 0) {
      setFetchingUsers(true);
      try {
        const usersRes = await apiService.getUsers();
        if (usersRes.success && usersRes.data) {
          setUsersList(usersRes.data);
        }
      } catch (err) {
        toast.error("Failed to fetch users");
      } finally {
        setFetchingUsers(false);
      }
    }
    setSelectedInviteUser('');
    setShowInviteModal(true);
  };

  const handleConfirmInvite = async () => {
    if (!selectedInviteUser) {
      toast.error('Please select a user to invite.');
      return;
    }
    const messageContent = draftContent.trim() ? draftContent : activeTemplate?.content || "";
    try {
      const payload = {
        recipientId: selectedInviteUser,
        message: messageContent,
        submissionData: { 
          type: 'Team Invite',
          templateName: draftTitle || activeTemplate?.title || 'Direct Message',
          sentAt: new Date().toISOString()
        }
      };

      const res = await apiService.createTaskReport(payload);
      if (res.success) {
        toast.success('Invite deployed! The user will be notified in Critical Requests.');
        setShowInviteModal(false);
      } else {
        throw new Error('Server returned failure on send invite');
      }
    } catch (error: any) {
      toast.error('Error sending invite: ' + error.message);
    }
  };

  const handleCopy = () => {
    if (draftContent) {
      navigator.clipboard.writeText(draftContent);
      toast.success('Content copied to clipboard');
    }
  };

  const insertVariable = (variable: string) => {
    setDraftContent(prev => prev + ` {{${variable}}}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <Toaster position="top-right" richColors />
      
      {/* Top Header Section */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={28} /> Team Collaboration & Messaging
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage customizable message templates for team invitations and workflow updates.</p>
          </div>
          <button 
            onClick={promptInvite}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Send size={18} /> Send New Invite
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-12 gap-8">
        
        {/* Left Column: Template List */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> Organization Templates
            </h2>
            <button onClick={handleCreateNew} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              <Plus size={14} /> Create New
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {loading ? (
              <div className="p-4 border border-slate-200 rounded-2xl animate-pulse bg-slate-100/50 h-20"></div>
            ) : templates.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">No templates found. Create one to get started.</div>
            ) : (
              templates.map((template) => {
                const isActive = activeTemplate?._id === template._id;
                return (
                  <div 
                    key={template._id}
                    onClick={() => selectTemplate(template)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isActive 
                      ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{template.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${template.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {template.status}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className={isActive ? 'text-indigo-400' : 'text-slate-300'} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Template Editor */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          {activeTemplate ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
              {/* Editor Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Template Document: </span>
                  <div className="flex-1 bg-transparent px-3 text-sm font-black text-slate-800 truncate">
                    {draftTitle || "Untitled Document"}
                  </div>
                  {activeTemplate._id === 'new' ? (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">Draft</span>
                  ) : (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${activeTemplate.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {activeTemplate.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {activeTemplate._id !== 'new' && (
                    <>
                      <button onClick={handleDuplicate} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Duplicate Template">
                        <CopyPlus size={18} />
                      </button>
                      <button onClick={promptDelete} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete Template">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Copy Content to Clipboard">
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              {/* Editor Body */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Message Content</label>
                  <textarea 
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Type your message content here..."
                    className="w-full h-64 p-6 bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50 outline-none transition-all text-slate-700 font-serif leading-relaxed"
                  />
                </div>

                {/* Dynamic Variables Section */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-2 mb-3">
                    <Variable size={14} /> Available Variables (Click to insert)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['user_name', 'team_name', 'sender_name', 'workflow_id', 'invite_link'].map((v) => (
                      <code 
                        key={v} 
                        onClick={() => insertVariable(v)}
                        className="px-2 py-1 bg-white border border-indigo-100 text-indigo-600 text-[11px] rounded-md font-mono cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors title='Insert Variable'"
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor Footer */}
              <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => selectTemplate(activeTemplate)} 
                  className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={promptSave}
                  className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                  <Save size={16} /> Save Config
                </button>
              </div>
            </div>
          ) : !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl p-12">
              <MessageSquare size={48} className="text-slate-200 mb-4" />
              <p className="text-center font-medium">Select a template from the list<br/>or create a new one.</p>
            </div>
          )}
        </section>

      </main>

      {/* --- MODALS --- */}

      {/* 1. SAVE MODAL */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div 
            key="save-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSaveModal(false);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden relative"
            >
              <button 
                onClick={() => setShowSaveModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-40"
              >
                <X size={20} />
              </button>
              <div className="p-8 border-b border-slate-50 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50">
                <div className="flex gap-5 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center shadow-lg shadow-indigo-200 text-white">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Save Template</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Configure your message template's fundamental attributes.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Template Name</label>
                  <input 
                    type="text"
                    value={saveModalTitle}
                    onChange={(e) => setSaveModalTitle(e.target.value)}
                    placeholder="Enter template name..."
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Template Status</label>
                  <select 
                    value={saveModalStatus}
                    onChange={(e) => setSaveModalStatus(e.target.value as 'draft' | 'saved')}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  >
                    <option value="draft">Save as Draft (Private/WIP)</option>
                    <option value="saved">Publish as Saved Template (Ready to Use)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3 sticky bottom-0">
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="px-8 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmSave}
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  <Save size={18} /> Confirm 
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SEND INVITE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div 
            key="invite-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInviteModal(false);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden relative"
            >
              <button 
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-40"
              >
                <X size={20} />
              </button>
              <div className="p-8 border-b border-slate-50 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50">
                <div className="flex gap-5 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center shadow-lg shadow-indigo-200 text-white">
                    <Send size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Deploy Invite</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Select a recipient from the lattice to send this communication.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Recipient User</label>
                  {fetchingUsers ? (
                    <div className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-sm font-bold text-slate-400">Loading users...</div>
                  ) : (
                    <select 
                      value={selectedInviteUser}
                      onChange={(e) => setSelectedInviteUser(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                    >
                      <option value="">-- Choose a user --</option>
                      {usersList.map((u: any) => (
                        <option key={u._id} value={u._id}>{u.firstName || u.email} {u.lastName || ''} ({u.role})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3 sticky bottom-0">
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="px-8 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmInvite}
                  disabled={!selectedInviteUser}
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  <Send size={18} /> Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDeleteModal(false);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden relative"
            >
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-40"
              >
                <X size={20} />
              </button>
              
              <div className="p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-rose-500 flex flex-col items-center justify-center shadow-lg shadow-rose-100 mt-2">
                  <AlertTriangle size={36} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Delete Template?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                  Are you sure you want to permanently remove <strong className="text-slate-800">"{draftTitle || activeTemplate?.title}"</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex justify-center gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-8 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-200 transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} /> Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default InviteTeam;
