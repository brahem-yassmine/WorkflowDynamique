import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

const EndNode = ({ data }: any) => {
    return (
        <div className="px-1.5 py-1 shadow-sm rounded bg-white border border-red-500 min-w-[70px] max-w-[90px]">
            <Handle type="target" position={Position.Left} className="bg-red-500" style={{ width: '5px', height: '5px' }} />
            <div className="flex items-center">
                <div className="rounded-sm w-4 h-4 flex-center flex items-center justify-center bg-red-50 text-red-600 mr-1.5">
                    <Square size={8} />
                </div>
                <div>
                    <div className="text-[8px] font-bold text-slate-800 uppercase tracking-tighter">{data.label || 'End'}</div>
                </div>
            </div>
        </div>
    );
};

export default EndNode;
