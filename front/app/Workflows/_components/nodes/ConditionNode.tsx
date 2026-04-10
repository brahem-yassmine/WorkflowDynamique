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
    <div className="px-3 py-2 shadow-sm rounded-md bg-white border border-slate-200 min-w-[120px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400"
      />

      <div className="flex flex-col">
        <div className="text-[10px] font-bold text-slate-700">
          {data.label || 'Condition'}
        </div>
        <div className="text-[8px] text-slate-400 mt-0.5 truncate uppercase">
          {data.condition || 'Logic'}
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between relative h-3">
          <span className="text-[8px] font-bold text-emerald-600 uppercase">Oui</span>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className="!bg-emerald-500"
            style={{ top: '50%' }}
          />
        </div>
        <div className="flex items-center justify-between relative h-3">
          <span className="text-[8px] font-bold text-rose-600 uppercase">Non</span>
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className="!bg-rose-500"
            style={{ top: '50%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionNode;
