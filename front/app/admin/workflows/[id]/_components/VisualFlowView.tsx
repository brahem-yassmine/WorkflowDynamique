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
import { usePathname } from 'next/navigation';

const CustomNode = ({ data, selected }: any) => {
  const stats = data.stats || { completed: 0, pending: 0, rejected: 0, working: 0 };
  const isWorking = stats.working > 0;
  const isRejected = stats.rejected > 0 && stats.working === 0;
  const isCompleted = stats.completed > 0 && stats.working === 0 && stats.rejected === 0;

  const getStyle = () => {
    if (data.type === 'start') return 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-md';
    if (data.type === 'end') return 'bg-rose-50 border-rose-200 text-rose-700 shadow-md';
    
    if (isWorking) return 'bg-amber-50 border-amber-500 text-amber-700 border-dashed shadow-xl ring-4 ring-amber-50 z-50';
    if (isRejected) return 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm';
    if (isCompleted) return 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm';
    
    return 'bg-white border-slate-200 text-slate-400 shadow-none'; // Global pending node
  };

  return (
    <div className="relative group">
      {/* Node Stats Badges - Hover state */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-slate-900 border border-white/20 p-2 rounded-2xl shadow-2xl z-[100] whitespace-nowrap">
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase">
            <CheckCircle2 size={12} /> {stats.completed} DONE
         </div>
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[9px] font-black uppercase">
            <Clock size={12} /> {stats.working} ACTIVE
         </div>
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase">
            <Layers size={12} /> {stats.pending} WAITING
         </div>
         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-black uppercase">
            <XCircle size={12} /> {stats.rejected} REJ
         </div>
      </div>

      <div className={`px-4 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 min-w-[160px] transition-all ${getStyle()} ${selected ? 'border-indigo-600 scale-105 shadow-2xl z-50' : ''} ${isWorking ? 'animate-pulse' : ''}`}>
        {data.type !== 'start' && (
          <Handle type="target" position={Position.Top} className={`!w-2 !h-2 ${isWorking ? '!bg-amber-500' : '!bg-indigo-600'} !border-2 !border-white shadow-md transition-transform hover:scale-125`} />
        )}
        
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-black/5 ${isWorking ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
          {data.type === 'start' ? 'S' : data.type === 'end' ? 'E' : data.type === 'condition' ? '?' : <Layers size={14} />}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <span className="truncate drop-shadow-none text-slate-800">{data.label || 'Node'}</span>
          {isWorking ? (
             <span className="text-[6px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                <Activity size={6} className="animate-spin" /> Live Processing
             </span>
          ) : (
             <span className={`text-[6px] font-bold flex items-center gap-1 mt-0.5 ${isCompleted ? 'text-emerald-500' : 'text-slate-300'}`}>
                {isCompleted ? <CheckCircle2 size={6} /> : <Clock size={6} />}
                {isCompleted ? 'Verified' : 'Pending'}
             </span>
          )}
        </div>
        
        {/* Active Mini Indicators */}
        <div className="ml-auto flex flex-col gap-1">
           {isWorking && <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
           {!isWorking && stats.completed > 0 && <CheckCircle2 size={14} className="text-emerald-500" />}
        </div>

        {/* Dynamic Handles based on type */}
        {data.type === 'condition' ? (
          <>
            <Handle type="source" position={Position.Bottom} id="yes" className="!w-2 !h-2 !bg-emerald-500 !border-2 !border-white shadow-md transition-transform hover:scale-125" style={{ left: '35%' }} />
            <Handle type="source" position={Position.Bottom} id="no" className="!w-2 !h-2 !bg-rose-500 !border-2 !border-white shadow-md transition-transform hover:scale-125" style={{ left: '65%' }} />
          </>
        ) : data.type !== 'end' ? (
          <Handle type="source" position={Position.Bottom} className={`!w-2 !h-2 ${isWorking ? '!bg-amber-500' : '!bg-indigo-600'} !border-2 !border-white shadow-md transition-transform hover:scale-125`} />
        ) : null}
      </div>
    </div>
  );
};

export default function VisualFlowView({ workflowId, workflow }: { workflowId: string, workflow: any }) {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isUserSpace = pathname.startsWith('/User');

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
  
  const edgesWithStyle = useMemo(() => {
    return (workflow?.edges || []).map((edge: any) => {
      const isActive = instances.some(inst => 
        inst.currentNodes?.some((cn: any) => cn.nodeId === edge.source) ||
        inst.executionPath?.slice(-1)[0]?.nodeId === edge.target
      );

      const sourceNode = workflow?.nodes?.find((n: any) => n.id === edge.source);
      const isCondition = sourceNode?.type === 'condition';

      const isYes = edge.sourceHandle === 'yes' || edge.label === 'Yes';
      const isNo = edge.sourceHandle === 'no' || edge.label === 'No';

      return {
        ...edge,
        // CRITICAL: If source is NOT a condition, we MUST remove sourceHandle 
        // because the node only has one default handle.
        sourceHandle: isCondition ? (edge.sourceHandle || (isYes ? 'yes' : isNo ? 'no' : undefined)) : undefined,
        type: 'smoothstep',
        animated: isActive,
        label: edge.label || (isYes ? 'Yes' : isNo ? 'No' : ''),
        labelStyle: { fill: isYes ? '#10b981' : isNo ? '#ef4444' : '#64748b', fontWeight: 900, fontSize: 8 },
        style: { 
          stroke: isActive ? '#f59e0b' : (isYes ? '#10b981' : isNo ? '#ef4444' : '#cbd5e1'), 
          strokeWidth: isActive ? 3 : 2,
          opacity: isActive ? 1 : 0.6
        },
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: isActive ? '#f59e0b' : (isYes ? '#10b981' : isNo ? '#ef4444' : '#cbd5e1'),
        },
      };
    });
  }, [workflow, instances]);

  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesWithStyle);

  const [isLocked, setIsLocked] = useState(false);

  // Update nodes when nodesWithStats changed
  useEffect(() => {
    setNodes(nodesWithStats);
  }, [nodesWithStats, setNodes]);

  useEffect(() => {
    setEdges(edgesWithStyle);
  }, [edgesWithStyle, setEdges]);

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
              onClick={() => window.open(`/create-workflow?id=${workflowId}`, '_blank')}
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
