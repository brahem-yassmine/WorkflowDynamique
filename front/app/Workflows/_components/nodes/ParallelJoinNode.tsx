import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Merge } from 'lucide-react';

const ParallelJoinNode = ({ data }: any) => {
    return (
        <div className="px-4 py-3 shadow-sm rounded-md bg-white border border-slate-200 min-w-[130px]">
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-slate-400"
            />

            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 border border-violet-200">
                    <Merge size={16} />
                </div>
                <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-700 uppercase">{data.label || 'Sync'}</div>
                    <div className="text-[8px] text-slate-400 uppercase font-medium mt-1">
                        Join
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!bg-slate-400"
            />
        </div>
    );
};

export default ParallelJoinNode;
