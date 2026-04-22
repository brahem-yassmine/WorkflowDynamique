import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Settings2 } from 'lucide-react';

const AutoNode = ({ data }: any) => {
    return (
        <div className="px-2 py-1.5 shadow-sm rounded-md bg-white border border-fuchsia-200 min-w-[120px]">
            <Handle type="target" position={Position.Top} className="!bg-fuchsia-500 !w-2 !h-2 !border-2 !border-white" />

            <div className="flex items-center gap-2">
                <div className="rounded-md w-6 h-6 flex-none flex items-center justify-center bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100">
                    <Settings2 size={8} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-700 leading-tight truncate">{data.label || 'Auto Script'}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5 truncate uppercase font-medium">
                        SYSTEM
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-fuchsia-500 !w-2 !h-2 !border-2 !border-white" />
        </div>
    );
};

export default AutoNode;
