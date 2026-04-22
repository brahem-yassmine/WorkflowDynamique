import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

const EndNode = ({ data }: any) => {
    return (
        <div className="px-3 py-2 shadow-sm rounded-md bg-white border border-slate-200 min-w-[100px]">
            <Handle type="target" position={Position.Top} className="!bg-rose-500 !w-2 !h-2 !border-2 !border-white" />
            <div className="flex items-center gap-2">
                <div className="rounded-md w-6 h-6 flex items-center justify-center bg-rose-100 text-rose-600">
                    <Square size={10} fill="currentColor" />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-700">{data.label || 'End'}</div>
                    <div className="text-[8px] text-slate-400">Exit</div>
                </div>
            </div>
        </div>
    );
};

export default EndNode;
