// front/app/Workflows/_components/nodes/ConditionNode.tsx

"use client"
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ConditionNodeProps {
  data: {
    label?: string;
    condition?: string;
  };
}

const ConditionNode = ({ data }: ConditionNodeProps) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-xl bg-white border-2 border-amber-400 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="bg-amber-400"
        style={{ width: '11px', height: '11px' }}
      />

      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Question / Condition</div>
        <div className="text-sm font-bold text-slate-800">
          {data.label || 'New Condition'}
        </div>

        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100/50">
          <div className="text-[10px] font-bold text-amber-500 uppercase">Rule</div>
          <div className="text-xs text-amber-900 font-medium">
            {data.condition || 'No rule defined'}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-3 pl-2 border-l-2 border-slate-100 py-1">
        <div className="flex items-center justify-between relative h-4">
          <span className="text-[10px] font-black text-emerald-500 uppercase">Yes</span>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            style={{ top: '50%', background: '#10b981', width: '13px', height: '13px', border: '3px solid white', right: '-22px' }}
          />
        </div>
        <div className="flex items-center justify-between relative h-4">
          <span className="text-[10px] font-black text-rose-500 uppercase">No</span>
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            style={{ top: '50%', background: '#ef4444', width: '13px', height: '13px', border: '3px solid white', right: '-22px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionNode;
