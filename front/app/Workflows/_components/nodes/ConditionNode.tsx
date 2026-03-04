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
    <div className="px-1 py-1 shadow-sm rounded bg-white border border-amber-400 min-w-[80px] max-w-[100px]">
      <Handle
        type="target"
        position={Position.Left}
        className="bg-amber-400"
        style={{ width: '4px', height: '4px' }}
      />

      <div className="flex flex-col">
        <div className="text-[8px] font-bold text-slate-800 truncate">
          {data.label || 'Condition'}
        </div>
        <div className="text-[6px] text-amber-600 font-medium truncate opacity-70">
          ? {data.condition || 'No rule'}
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-1 pl-1 border-l border-slate-100">
        <div className="flex items-center justify-between relative h-2">
          <span className="text-[6px] font-bold text-emerald-500">Y</span>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            style={{ top: '50%', background: '#10b981', width: '5px', height: '5px', border: '1px solid white', right: '-10px' }}
          />
        </div>
        <div className="flex items-center justify-between relative h-2">
          <span className="text-[6px] font-bold text-rose-500">N</span>
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            style={{ top: '50%', background: '#ef4444', width: '5px', height: '5px', border: '1px solid white', right: '-10px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionNode;
