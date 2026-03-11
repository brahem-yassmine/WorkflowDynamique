'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Layers, Maximize2, CheckCircle2, Clock, XCircle, Users, Activity } from 'lucide-react';
import { apiService } from '@/service/api.service';

const CustomNode = ({ data, selected }: any) => {
  const stats = data.stats || { completed: 0, pending: 0, rejected: 0, working: 0 };
  const isWorking = stats.working > 0;
  const isRejected = stats.rejected > 0 && stats.working === 0;
  const isCompleted = stats.completed > 0 && stats.working === 0 && stats.rejected === 0;

  const getStyle = () => {
    if (data.type === 'start') return 'bg-emerald-500 border-emerald-600 shadow-emerald-100';
    if (data.type === 'end') return 'bg-rose-500 border-rose-600 shadow-rose-100';
    
    if (isWorking) return 'bg-amber-500 border-amber-600 shadow-amber-200 border-dashed';
    if (isRejected) return 'bg-rose-600 border-rose-700 shadow-rose-200';
    if (isCompleted) return 'bg-emerald-600 border-emerald-700 shadow-emerald-200';
    
    return 'bg-slate-300 border-slate-400 text-slate-500 shadow-sm opacity-50'; // Global pending node
  };

  return (
    <div className="relative group">
      {/* Node Stats Badges - Hover state */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-slate-900 border border-white/20 p-2 rounded-2xl shadow-2xl z-[100] whitespace-nowrap">
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase">
            <CheckCircle2 size={12} /> {stats.completed} DONE
         </div>
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[9px] font-black uppercase">
            <Clock size={12} /> {stats.working} ACTIVE
         </div>
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase">
            <Layers size={12} /> {stats.pending} WAITING
         </div>
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-black uppercase">
            <XCircle size={12} /> {stats.rejected} REJ
         </div>
      </div>

      <div className={`px-5 py-3 rounded-2xl border-[3px] text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-4 min-w-[180px] shadow-xl transition-all ${getStyle()} ${selected ? 'ring-4 ring-indigo-200 z-50' : ''} ${isWorking ? 'animate-pulse text-white' : ''}`}>
        <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-white !border-none shadow-sm" />
        
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${isWorking ? 'bg-white/20' : 'bg-slate-500/20'}`}>
          {data.type === 'start' ? 'S' : data.type === 'end' ? 'E' : data.type === 'condition' ? '?' : <Layers size={14} />}
        </div>

        <div className="flex flex-col">
          <span className="truncate max-w-[110px] drop-shadow-sm">{data.label || 'Unnamed Node'}</span>
          {isWorking ? (
             <span className="text-[7px] text-white/80 flex items-center gap-1 mt-0.5">
                <Clock size={8} /> Process Active
             </span>
          ) : (
             <span className={`text-[7px] flex items-center gap-1 mt-0.5 ${isCompleted ? 'text-white/80' : 'text-slate-400'}`}>
                {isCompleted ? <CheckCircle2 size={10} /> : <div className="w-1 h-1 bg-slate-300 rounded-full" />}
                {isCompleted ? 'Finished Unit' : 'Awaiting Flow'}
             </span>
          )}
        </div>
        
        {/* Active Mini Indicators */}
        <div className="ml-auto flex flex-col gap-1">
           {isWorking && <div className="w-2 h-2 bg-white rounded-full animate-ping group-hover:animate-none" />}
           {!isWorking && stats.completed > 0 && <CheckCircle2 size={12} className="text-white/40" />}
        </div>

        <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-white !border-none shadow-sm" />
      </div>
    </div>
  );
};

export default function VisualFlowView({ workflowId, workflow }: { workflowId: string, workflow: any }) {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const nodeTypes = useMemo(() => ({
    start: CustomNode,
    end: CustomNode,
    action: CustomNode,
    condition: CustomNode,
    syncJoin: CustomNode
  }), []);

  useEffect(() => {
    fetchInstances();
  }, [workflowId]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const res = await apiService.getInstances({ workflowId });
      if (res.success) setInstances(res.data);
    } catch (err) {
      console.error("Error fetching instances for visual flow:", err);
    } finally {
      setLoading(false);
    }
  };

  const nodesWithStats = useMemo(() => {
    return (workflow?.nodes || []).map((node: any) => {
      let completedInInstances = new Set();
      let rejectedInInstances = new Set();
      let currentlyWorkingCount = 0;

      instances.forEach(inst => {
        // Count currently active logic
        if (inst.currentNodes?.some((cn: any) => cn.nodeId === node.id)) {
          currentlyWorkingCount++;
        }

        // Count which instances finished this node
        inst.executionPath?.forEach((path: any) => {
          if (path.nodeId === node.id) {
            if (path.action === 'rejected') {
              rejectedInInstances.add(inst._id);
            } else if (path.action === 'approved' || path.action === 'completed') {
              completedInInstances.add(inst._id);
            }
          }
        });
      });

      const completedCount = completedInInstances.size;
      const rejectedCount = rejectedInInstances.size;
      // Pending is anything that hasn't been completed or rejected in an instance
      const pendingCount = Math.max(0, instances.length - completedCount - rejectedCount);

      return {
        ...node,
        type: node.type || 'action',
        data: { 
          ...node.data, 
          type: node.type || 'action',
          stats: {
            completed: completedCount,
            pending: pendingCount,
            rejected: rejectedCount,
            working: currentlyWorkingCount
          }
        }
      };
    });
  }, [workflow, instances]);

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithStats);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);

  // Update nodes when nodesWithStats changed
  useEffect(() => {
    setNodes(nodesWithStats);
  }, [nodesWithStats, setNodes]);

  useEffect(() => {
    setEdges(workflow?.edges || []);
  }, [workflow?.edges, setEdges]);

  return (
    <div className="h-full flex flex-col space-y-8 min-h-[850px]">
      <div className="flex items-center justify-between shrink-0">
         <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Architectural Logic Graph</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">Real-time node execution status heatmap across all lattice units</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-8 px-8 py-3.5 bg-white border border-slate-100 rounded-3xl shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-100" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Completed</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse border-2 border-dashed border-amber-600 shadow-lg shadow-amber-100" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Pool</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-rose-500 rounded-full shadow-lg shadow-rose-100" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rejected</span>
               </div>
            </div>
            <button 
              onClick={() => window.open(`/create-workflow?id=${workflowId}`, '_blank')}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Maximize2 size={16} />
              Open Architect
            </button>
         </div>
      </div>

      <div className="flex-1 bg-white rounded-[50px] border border-slate-100 overflow-hidden relative shadow-2xl">
         <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            selectionMode={SelectionMode.Full}
            elementsSelectable={false}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll
         >
            <Background color="#f1f5f9" gap={25} size={2} />
            <Controls className="!bg-white !border-slate-100 !shadow-2xl !rounded-2xl overflow-hidden !m-6" />
            <MiniMap 
              className="!bg-white/80 !backdrop-blur-md !border-slate-100 !shadow-2xl !rounded-3xl !m-6" 
              nodeColor={(n) => {
                if (n.type === 'start') return '#10b981';
                if (n.type === 'end') return '#f43f5e';
                return '#6366f1';
              }} 
            />
         </ReactFlow>
         
         {/* Live Legend */}
         <div className="absolute top-8 right-8 p-8 bg-slate-900 text-white rounded-[40px] border border-white/10 shadow-2xl z-10 space-y-6 min-w-[240px]">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Activity size={20} className="text-indigo-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Heatmap Feed</span>
               </div>
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Instances</span>
                  <span className="text-xl font-black text-white">{instances.length}</span>
               </div>
               <div className="px-1 text-[9px] font-bold text-slate-500 italic leading-relaxed text-center">
                  Lattice view synchronized with real-time operations. Use hover for throughput metrics.
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
