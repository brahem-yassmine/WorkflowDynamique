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
        position={Position.Top}
        className="!bg-slate-400 !w-2 !h-2 !border-2 !border-white"
      />

      <div className="flex flex-col text-center">
        <div className="text-[10px] font-bold text-slate-700">
          {data.label || 'Condition'}
        </div>
        <div className="text-[8px] text-slate-400 mt-0.5 truncate uppercase">
          {data.condition || 'Logic'}
        </div>
      </div>

      <div className="flex justify-between mt-3 pt-2 border-t border-slate-100 px-1">
        <div className="flex flex-col items-center relative">
          <span className="text-[7px] font-black text-emerald-600 uppercase">Yes</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className="!bg-emerald-500 !w-2 !h-2 !border-2 !border-white"
            style={{ left: '0%', transform: 'none' }}
          />
        </div>
        <div className="flex flex-col items-center relative">
          <span className="text-[7px] font-black text-rose-600 uppercase">No</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="!bg-rose-500 !w-2 !h-2 !border-2 !border-white"
            style={{ right: '0%', left: 'auto', transform: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionNode;
