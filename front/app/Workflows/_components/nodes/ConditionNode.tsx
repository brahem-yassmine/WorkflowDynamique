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
    <div className="px-3 py-2 shadow-lg rounded-xl bg-amber-50 border-2 border-amber-100 min-w-[120px] group transition-all hover:border-amber-200">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-amber-300 !border-none !w-1.5 !h-1.5"
      />

      <div className="flex flex-col">
        <div className="text-[9px] font-black text-amber-900 uppercase tracking-widest leading-none">
          {data.label || 'Condition'}
        </div>
        <div className="text-[6px] text-amber-600/60 font-black uppercase tracking-widest mt-0.5 opacity-70">
          ? {data.condition || 'Logic'}
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-2 pt-1.5 border-t border-amber-100/50">
        <div className="flex items-center justify-between relative h-2.5">
          <span className="text-[7px] font-black text-emerald-500 uppercase">Yes</span>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className="!bg-emerald-400 !border-none !w-1.5 !h-1.5"
            style={{ top: '50%', right: '-3px' }}
          />
        </div>
        <div className="flex items-center justify-between relative h-2.5">
          <span className="text-[7px] font-black text-rose-500 uppercase">No</span>
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className="!bg-rose-400 !border-none !w-1.5 !h-1.5"
            style={{ top: '50%', right: '-3px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionNode;
