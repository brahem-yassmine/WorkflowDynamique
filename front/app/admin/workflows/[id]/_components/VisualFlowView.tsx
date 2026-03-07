'use client';

import React, { useMemo } from 'react';
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
import { GitBranch, Layers, Maximize2 } from 'lucide-react';

const CustomNode = ({ data, selected }: any) => {
  const getStyle = (type: string) => {
    switch (type) {
      case 'start': return 'bg-emerald-500 border-emerald-600 shadow-emerald-200';
      case 'end': return 'bg-rose-500 border-rose-600 shadow-rose-200';
      case 'action': return 'bg-indigo-600 border-indigo-700 shadow-indigo-200';
      case 'condition': return 'bg-amber-500 border-amber-600 shadow-amber-200';
      default: return 'bg-slate-700 border-slate-800 shadow-slate-200';
    }
  };

  return (
    <div className={`px-4 py-2 rounded-xl border-2 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 min-w-[140px] shadow-lg transition-all ${getStyle(data.type)} ${selected ? 'ring-4 ring-indigo-200 animate-pulse' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-white !border-none" />
      <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
        {data.type === 'start' ? 'S' : data.type === 'end' ? 'E' : data.type === 'condition' ? '?' : 'A'}
      </div>
      <span className="truncate">{data.label || 'Unnamed Node'}</span>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-white !border-none" />
    </div>
  );
};

export default function VisualFlowView({ workflowId, workflow }: { workflowId: string, workflow: any }) {
  const nodeTypes = useMemo(() => ({
    start: CustomNode,
    end: CustomNode,
    action: CustomNode,
    condition: CustomNode,
    syncJoin: CustomNode
  }), []);

  const initialNodes = useMemo(() => {
    return (workflow?.nodes || []).map((node: any) => ({
      ...node,
      type: node.type || 'action',
      data: { ...node.data, type: node.type || 'action' }
    }));
  }, [workflow]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(workflow?.edges || []);

  return (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex items-center justify-between shrink-0">
         <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Architectural Logic Graph</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Read-only visualization of the operational protocol structure</p>
         </div>
         <button 
           onClick={() => window.open(`/create-workflow?id=${workflowId}`, '_blank')}
           className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
         >
           <Maximize2 size={16} />
           Open Advanced Architect
         </button>
      </div>

      <div className="flex-1 bg-white rounded-[40px] border border-slate-100 overflow-hidden relative shadow-inner">
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
            <Background color="#f1f5f9" gap={20} />
            <Controls className="!bg-white !border-slate-100 !shadow-lg !rounded-2xl overflow-hidden" />
            <MiniMap 
              className="!bg-white !border-slate-100 !shadow-lg !rounded-2xl" 
              nodeColor={(n) => {
                if (n.type === 'start') return '#10b981';
                if (n.type === 'end') return '#f43f5e';
                return '#6366f1';
              }} 
            />
         </ReactFlow>
         
         <div className="absolute bottom-10 left-10 p-4 bg-white/80 backdrop-blur rounded-2xl border border-white shadow-xl flex gap-6 z-10">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-emerald-500 rounded-full" />
               <span className="text-[9px] font-black uppercase text-slate-500">Kick-off</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-indigo-600 rounded-full" />
               <span className="text-[9px] font-black uppercase text-slate-500">Operation</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-amber-500 rounded-full" />
               <span className="text-[9px] font-black uppercase text-slate-500">Validation</span>
            </div>
         </div>
      </div>
    </div>
  );
}
