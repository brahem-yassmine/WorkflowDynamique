'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Users, 
  Activity, 
  LayoutDashboard, 
  CheckSquare, 
  GitBranch,
  ArrowLeft,
  Search,
  Plus,
  Edit3,
  Trash2,
  ChevronRight,
  MoreVertical,
  Calendar,
  Clock,
  Briefcase,
  Layers,
  Shield,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast, Toaster } from 'sonner';

// Sub-components (could be separate files, but and keeping here for cohesion as requested)
import MembersView from './_components/MembersView';
import OperationsView from './_components/OperationsView';
import KanbanView from './_components/KanbanView';
import ChecklistView from './_components/ChecklistView';
import VisualFlowView from './_components/VisualFlowView';

export default function WorkflowAdminDetails() {
  const { id: workflowId } = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    if (workflowId) {
      fetchBaseData();
    }
  }, [workflowId]);

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const wfRes = await apiService.getWorkflowById(workflowId as string);
      if (wfRes.success) {
        setWorkflow(wfRes.data);
        if (wfRes.data.projectId) {
          const projRes = await apiService.getProjectById(wfRes.data.projectId);
          if (projRes.success) setProject(projRes.data);
        }
      }
    } catch (error) {
      console.error('Error fetching base data:', error);
      toast.error('Failed to load workflow details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-8 border-indigo-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'members', label: 'Members', icon: <Users size={20} /> },
    { id: 'operations', label: 'Live Operations', icon: <Activity size={20} /> },
    { id: 'kanban', label: 'Kanban Boards', icon: <LayoutDashboard size={20} /> },
    { id: 'checklist', label: 'Checklists', icon: <CheckSquare size={20} /> },
    { id: 'visual', label: 'Visual Flow', icon: <GitBranch size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* NEW SIDEBAR (Specific to this Workflow) */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col shadow-xl z-20">
        <div className="p-8 border-b border-slate-50">
          <button 
            onClick={() => {
              if (project?._id) {
                router.push(`/admin/projects/${project._id}`);
              } else if (workflow?.projectId) {
                router.push(`/admin/projects/${workflow.projectId}`);
              } else {
                router.push('/admin/workflows');
              }
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <ArrowLeft size={14} />
            Back to Project
          </button>
          
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Administrative Panel</span>
             </div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight line-clamp-2">
               {workflow?.name}
             </h2>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3 text-slate-400 mb-1">
                <Briefcase size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Linked Project</span>
             </div>
             <p className="text-xs font-bold text-slate-700 truncate">{project?.name || 'Unassigned Project'}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           <div className="px-4 py-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management Suite</span>
           </div>
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all group ${
                 activeTab === tab.id 
                   ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1' 
                   : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
               }`}
             >
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-xl transition-colors ${
                   activeTab === tab.id ? 'bg-indigo-500' : 'bg-slate-50 group-hover:bg-indigo-50'
                 }`}>
                   {tab.icon}
                 </div>
                 <span className="text-sm font-black tracking-tight">{tab.label}</span>
               </div>
               {activeTab === tab.id && <ChevronRight size={16} />}
             </button>
           ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-50">
           <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
              <div className="flex items-center gap-2">
                 <Shield size={14} className="text-indigo-600" />
                 <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Protocol Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Nodes</p>
                    <p className="text-sm font-black text-slate-800">{workflow?.nodes?.length || 0}</p>
                 </div>
                 <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Status</p>
                    <p className="text-sm font-black text-indigo-600 uppercase">{workflow?.status}</p>
                 </div>
              </div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
         {/* Top Header */}
         <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 z-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                  <Layers size={24} />
               </div>
               <div>
                  <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Internal Administration Interface
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                  <Clock size={16} />
                  <span className="text-xs font-black uppercase tracking-tight">Last Sync: Just Now</span>
               </div>
               <button 
                 onClick={() => router.push(`/create-workflow?id=${workflowId}`)}
                 className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
               >
                 Open Architect
               </button>
            </div>
         </header>

         {/* Dynamic Content */}
         <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#F8FAFC]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'members' && <MembersView workflowId={workflowId as string} />}
                {activeTab === 'operations' && <OperationsView workflowId={workflowId as string} />}
                {activeTab === 'kanban' && <KanbanView workflowId={workflowId as string} />}
                {activeTab === 'checklist' && <ChecklistView workflowId={workflowId as string} />}
                {activeTab === 'visual' && <VisualFlowView workflowId={workflowId as string} workflow={workflow} />}
              </motion.div>
            </AnimatePresence>
         </div>
      </main>
    </div>
  );
}
