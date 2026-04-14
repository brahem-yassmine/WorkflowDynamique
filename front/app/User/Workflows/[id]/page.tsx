'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  CheckSquare, 
  GitBranch,
  ArrowLeft,
  ChevronRight,
  Briefcase,
  Layers,
  Clock,
  BarChart3,
  Search,
  LayoutGrid,
  ClipboardList,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast, Toaster } from 'sonner';

// Sub-components - Importing from admin components because they are identical
// Sub-components - Isolated user components
import MembersView from './_components/MembersView';
import KanbanView from './_components/KanbanView';
import ChecklistView from './_components/ChecklistView';
import VisualFlowView from './_components/VisualFlowView';
import DashboardView from './_components/DashboardView';
import TaskLogView from './_components/TaskLogView';

export default function WorkflowUserDetails() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black text-indigo-600 uppercase tracking-widest">Synchronizing Lattice...</div>}>
      <WorkflowUserDetailsContent />
    </Suspense>
  );
}

function WorkflowUserDetailsContent() {
  const params = useParams();
  const workflowId = params.id as string;
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'visual';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync activeTab with searchParams
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (workflowId) {
      fetchBaseData();
    }
  }, [workflowId]);

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const wfRes = await apiService.getWorkflowById(workflowId);
      if (wfRes.success) {
        setWorkflow(wfRes.data);
        if (wfRes.data.projectId) {
          if (typeof wfRes.data.projectId === 'object') {
            setProject(wfRes.data.projectId);
          } else {
            try {
              const projRes = await apiService.getProjectById(wfRes.data.projectId);
              if (projRes.success) setProject(projRes.data);
            } catch (e) {}
          }
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
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 rounded-[40px]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-8 border-indigo-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'visual', label: 'Visual Flow', description: 'Analyze the workflow structural lattice', icon: <GitBranch size={24} />, color: 'bg-indigo-500' },
    { id: 'dashboard', label: 'Progress Dashboard', description: 'Monitor task advancement and efficiency stats', icon: <BarChart3 size={24} />, color: 'bg-blue-500' },
    { id: 'kanban', label: 'Kanban Board', description: 'Operationalize task distribution and throughput', icon: <LayoutDashboard size={24} />, color: 'bg-emerald-500' },
    { id: 'task-log', label: 'Task Log', description: 'Audit historic logic node executions', icon: <ClipboardList size={24} />, color: 'bg-amber-500' },
    { id: 'members', label: 'Team Members', description: 'Manage personnel assigned to this unit', icon: <Users size={24} />, color: 'bg-fuchsia-500' },
    { id: 'checklist', label: 'Checklists', description: 'Verify standard operational procedures', icon: <CheckSquare size={24} />, color: 'bg-slate-500' },
    { id: 'architect', label: 'Architect', description: 'Modify structural lattice', icon: <GitBranch size={24} />, color: 'bg-indigo-600' },
  ];

  const handleGoBack = () => {
    const projectIdParam = searchParams.get('projectId');
    const pId = project?._id || projectIdParam || (workflow?.projectId?._id || (typeof workflow?.projectId === 'string' ? workflow.projectId : null));

    if (pId) {
      router.push(`/User/PRO/${pId}`);
    } else {
      router.push('/User/Workflows');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden relative">
      <Toaster position="top-right" richColors />
      
      {/* HEADER */}
      <header className="bg-white border-b border-indigo-100 shrink-0 z-40 shadow-sm relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 z-30 pointer-events-none" />
          
          <div className="h-20 px-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <button 
                  onClick={handleGoBack}
                  className="w-10 h-10 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm active:scale-95 group relative z-50 pointer-events-auto"
                >
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 relative group/icon">
                      <div className="absolute inset-0 bg-indigo-400 blur-lg opacity-0 group-hover/icon:opacity-40 transition-opacity" />
                      <Layers size={20} className="relative z-10" />
                  </div>
                  <div>
                      <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
                        {workflow?.name}
                      </h1>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <span className="text-indigo-500 font-black">{project?.name || 'GENERIC'}</span> 
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        Operational Unit Control
                      </div>
                  </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                  User Workspace
               </div>
            </div>
          </div>

          <div className="px-10 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-50 py-2 bg-slate-50/30 relative z-30">
             {tabs.map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => {
                   if (tab.id === 'architect') {
                     router.push(`/User/create?id=${workflowId}&projectId=${project?._id || ''}`);
                   } else {
                     setActiveTab(tab.id);
                   }
                 }}
                  className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer relative z-40 pointer-events-auto ${
                   activeTab === tab.id 
                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                     : 'text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
                 }`}
               >
                 <div className={`${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                    {React.cloneElement(tab.icon as any, { size: 16 })}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
               </button>
             ))}
          </div>
      </header>

      {/* CONTENT */}
      <main className={`flex-1 overflow-y-auto custom-scrollbar bg-[#F8FAFC] ${activeTab === 'visual' ? 'p-0 overflow-hidden' : 'p-10'}`}>
         <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className={`h-full ${activeTab === 'visual' ? 'max-w-none w-full' : 'max-w-7xl mx-auto'}`}
             >
                {activeTab === 'dashboard' && <DashboardView workflowId={workflowId} />}
                {activeTab === 'task-log' && <TaskLogView workflowId={workflowId} />}
                {activeTab === 'members' && <MembersView workflowId={workflowId} />}
                {activeTab === 'kanban' && <KanbanView workflowId={workflowId} />}
                {activeTab === 'checklist' && <ChecklistView workflowId={workflowId} />}
                {activeTab === 'visual' && <VisualFlowView workflowId={workflowId} workflow={workflow} />}
             </motion.div>
         </AnimatePresence>
      </main>
    </div>
  );
}
