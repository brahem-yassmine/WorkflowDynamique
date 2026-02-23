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
    <div className="px-4 py-2.5 shadow-md rounded-xl bg-white border-2 border-amber-400 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="bg-amber-400"
        style={{ width: '9px', height: '9px' }}
      />

      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Question / Condition</div>
        <div className="text-sm font-bold text-slate-800">
          {data.label || 'Nouvelle condition'}
        </div>

        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100/50">
          <div className="text-[10px] font-bold text-amber-500 uppercase">Règle</div>
          <div className="text-xs text-amber-900 font-medium">
            {data.condition || 'Aucune règle définie'}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-3.5 px-1.5">
        <span className="text-[10px] font-black text-emerald-500 uppercase">Oui</span>
        <span className="text-[10px] font-black text-rose-500 uppercase">Non</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="oui"
        style={{ left: '25%', background: '#10b981', width: '11px', height: '11px', border: '2px solid white' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="non"
        style={{ left: '75%', background: '#ef4444', width: '11px', height: '11px', border: '2px solid white' }}
      />
    </div>
  );
};

export default ConditionNode;