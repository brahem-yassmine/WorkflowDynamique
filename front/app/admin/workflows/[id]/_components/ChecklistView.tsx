'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  ArrowRight,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  MoreVertical,
  Layers,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ChecklistView({ workflowId }: { workflowId: string }) {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchChecklists();
  }, [workflowId]);

  const fetchChecklists = async () => {
    if (workflowId === 'standard') {
      setChecklists([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiService.request(`/checklists?workflowId=${workflowId}`);
      if (res.success) setChecklists(res.data);
    } catch (error) {
      console.error('Fetch checklists error:', error);
      toast.error('Could not load checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = async () => {
     try {
       const name = prompt("Enter Checklist Name:");
       if (!name) return;
       const res = await apiService.request('/checklists', { 
         method: 'POST',
         body: JSON.stringify({ 
           name, 
           description: `Organizational validation list for workflow protocol.`,
           workflowId 
         }) 
       });
       if (res.success) {
         toast.success("Checklist provisioned");
         fetchChecklists();
       }
     } catch (err) {
       toast.error("Checklist creation failed");
     }
  };

  if (loading) return <div className="text-center p-10 font-bold text-slate-300">Synchronizing validation checklists...</div>;

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Operational Validation Checklists</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Managing step-by-step verification protocols for this flow</p>
         </div>
         <button 
           onClick={handleCreateChecklist}
           className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
         >
           <Plus size={16} />
           Provision Checklist
         </button>
      </div>

      <div className="flex-1 pr-2 overflow-y-auto custom-scrollbar">
        {checklists.length === 0 ? (
          <div className="p-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200">
                <CheckSquare size={40} />
             </div>
             <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No validation protocols found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {checklists.map((list) => (
              <motion.div
                key={list._id}
                whileHover={{ y: -5 }}
                onClick={() => router.push(`/checklist/designer?id=${list._id}&source=workflow_details&workflowDetailsId=${workflowId}`)}
                className="group bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <CheckCircle2 size={20} />
                   </div>
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} />
                      Provisioned: {new Date(list.createdAt).toLocaleDateString()}
                   </span>
                </div>

                <h4 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase truncate mb-2">
                   {list.name}
                </h4>
                <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed h-10 mb-8">
                   {list.description || "Standard verification sequence for logic protocol completion."}
                </p>

                <div className="mt-auto flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <ClipboardList size={14} className="text-slate-300" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Items: {list.tasks?.length || 0}</span>
                   </div>
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <ArrowRight size={18} />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
