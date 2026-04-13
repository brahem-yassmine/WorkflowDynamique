import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

const StartNode = ({ data }: any) => {
    return (
        <div className="px-3 py-2 shadow-sm rounded-md bg-white border border-slate-200 min-w-[100px]">
            <div className="flex items-center gap-2">
                <div className="rounded-full w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-600">
                    <Play size={10} fill="currentColor" />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-700">{data.label || 'Start'}</div>
                    <div className="text-[8px] text-slate-400">Entry</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
        </div>
    );
};

export default StartNode;
