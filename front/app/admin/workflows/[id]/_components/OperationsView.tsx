'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  MapPin, 
  ExternalLink, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Users,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OperationsView({ workflowId }: { workflowId: string }) {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstances();
  }, [workflowId]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const res = await apiService.getInstances({ workflowId });
      if (res.success) setInstances(res.data);
    } catch (error) {
      console.error('Fetch instances error:', error);
      toast.error('Could not load live operations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-500 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) return <div className="text-center p-10 font-bold text-slate-300 uppercase tracking-widest text-[10px]">Accessing live protocol stream...</div>;

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Live Operations Protocol</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking active instances and real-time execution flows</p>
         </div>
         <button 
           onClick={() => {
              toast.promise(apiService.request(`/workflows/${workflowId}/execute`, { 
                method: 'POST', 
                body: JSON.stringify({ title: `Operational Manual Boot: ${new Date().toLocaleTimeString()}` }) 
              }), {
                loading: 'Initializing protocol instance...',
                success: (res) => { fetchInstances(); return 'Protocol booted successfully'; },
                error: 'Boot failure'
              });
           }}
           className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
         >
           <Play size={16} fill="white" />
           Boot Protocol Instance
         </button>
      </div>

      <div className="flex-1 space-y-4 pr-2 overflow-y-auto custom-scrollbar">
        {instances.length === 0 ? (
          <div className="p-16 bg-white rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-200">
                <Activity size={32} />
             </div>
             <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No active instances reported</p>
          </div>
        ) : instances.map((inst) => (
          <motion.div
            key={inst._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group bg-white rounded-[28px] border border-slate-100 p-8 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none`}>
              <Briefcase size={60} />
            </div>

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
               <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-xl font-black ${getStatusStyle(inst.status)}`}>
                     {inst.status === 'in_progress' ? <Activity className="animate-pulse" /> : inst.status === 'completed' ? <CheckCircle2 /> : <AlertCircle />}
                  </div>
                  <div>
                     <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">{inst.title}</h4>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(inst.status)}`}>
                           {inst.status}
                        </span>
                     </div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} />
                        Started: {new Date(inst.createdAt).toLocaleString()}
                     </p>
                  </div>
               </div>
               
               <Link href={`/Workflows/instances/${inst._id}`}>
                  <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 flex items-center gap-2 text-xs font-black uppercase tracking-tight">
                     Inspect Process
                     <ExternalLink size={14} />
                  </button>
               </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
               <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-3 font-black text-[9px] uppercase tracking-widest">
                     <MapPin size={12} /> Current Vector Position
                  </div>
                  <div className="space-y-3">
                     {inst.currentNodes.map((cn: any) => (
                        <div key={cn.nodeId} className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                           <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Node: {cn.nodeId}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-3 font-black text-[9px] uppercase tracking-widest">
                     <Users size={12} /> Active Responders
                  </div>
                  <div className="flex -space-x-3 overflow-hidden">
                     {[1,2,3].map(i => (
                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          U{i}
                        </div>
                     ))}
                     <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                        +{inst.currentNodes.length}
                     </div>
                  </div>
               </div>

               <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-3 font-black text-[9px] uppercase tracking-widest">
                     <Activity size={12} /> Process Health
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className="bg-indigo-600 h-full transition-all" style={{ width: inst.status === 'completed' ? '100%' : '45%' }} />
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
