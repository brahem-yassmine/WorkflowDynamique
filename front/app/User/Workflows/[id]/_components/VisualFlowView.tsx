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
    if (data.type === 'start') return 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm';
    if (data.type === 'end') return 'bg-rose-50 border-rose-100 text-rose-700 shadow-sm';
    
    if (isWorking) return 'bg-amber-50 border-amber-200 text-amber-800 border-dashed shadow-md';
    if (isRejected) return 'bg-rose-100 border-rose-200 text-rose-800 shadow-sm';
    if (isCompleted) return 'bg-emerald-100 border-emerald-200 text-emerald-800 shadow-sm';
    
    return 'bg-slate-50 border-slate-200 text-slate-400 shadow-none opacity-60'; // Global pending node
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

      <div className={`px-3 py-1.5 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 min-w-[130px] transition-all ${getStyle()} ${selected ? 'border-indigo-400 z-50' : ''} ${isWorking ? 'animate-pulse' : ''}`}>
        <Handle type="target" position={Position.Top} className="w-1.5 h-1.5 bg-white !border-none shadow-sm" />
        
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-black/5 ${isWorking ? 'bg-white' : 'bg-black/5'}`}>
          {data.type === 'start' ? 'S' : data.type === 'end' ? 'E' : data.type === 'condition' ? '?' : <Layers size={12} />}
        </div>

        <div className="flex flex-col">
          <span className="truncate max-w-[80px] drop-shadow-none">{data.label || 'Node'}</span>
          {isWorking ? (
             <span className="text-[5px] text-amber-600 flex items-center gap-1 mt-0">
                <Clock size={5} /> Active
             </span>
          ) : (
             <span className={`text-[5px] flex items-center gap-1 mt-0 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isCompleted ? <CheckCircle2 size={6} /> : <div className="w-0.5 h-0.5 bg-slate-300 rounded-full" />}
                {isCompleted ? 'Done' : 'Wait'}
             </span>
          )}
        </div>
        
        {/* Active Mini Indicators */}
        <div className="ml-auto flex flex-col gap-1">
           {isWorking && <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping group-hover:animate-none" />}
           {!isWorking && stats.completed > 0 && <CheckCircle2 size={12} className="text-emerald-400" />}
        </div>

        <Handle type="source" position={Position.Bottom} className="w-1.5 h-1.5 bg-white !border-none shadow-sm" />
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
    if (workflowId === 'standard') {
      setInstances([]);
      setLoading(false);
      return;
    }
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

  const [isLocked, setIsLocked] = useState(false);

  // Update nodes when nodesWithStats changed
  useEffect(() => {
    setNodes(nodesWithStats);
  }, [nodesWithStats, setNodes]);

  useEffect(() => {
    setEdges(workflow?.edges || []);
  }, [workflow?.edges, setEdges]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 p-10">
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
              onClick={() => window.open(`/User/create?id=${workflowId}`, '_blank')}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Maximize2 size={16} />
              Open Architect
            </button>
         </div>
      </div>

      <div className="flex-1 bg-white border-t border-slate-100 overflow-hidden relative">
         <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            selectionMode={SelectionMode.Full}
            elementsSelectable={false}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll={!isLocked}
            panOnDrag={!isLocked}
            zoomOnScroll={!isLocked}
            zoomOnPinch={!isLocked}
         >
            <Background color="#f1f5f9" gap={25} size={2} />
            <Controls 
              onInteractiveChange={(interactive) => setIsLocked(!interactive)}
              className="!bg-white !border-slate-100 !shadow-2xl !rounded-2xl overflow-hidden !m-6" 
            />
            <MiniMap 
              className="!bg-white/80 !backdrop-blur-md !border-slate-100 !shadow-2xl !rounded-3xl !m-6" 
              nodeColor={(n) => {
                if (n.type === 'start') return '#10b981';
                if (n.type === 'end') return '#f43f5e';
                return '#6366f1';
              }} 
            />
         </ReactFlow>
      </div>
    </div>
  );
}
