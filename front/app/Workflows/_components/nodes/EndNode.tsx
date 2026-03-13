import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

const EndNode = ({ data }: any) => {
    return (
        <div className="px-3 py-2 shadow-lg rounded-xl bg-rose-50 border-2 border-rose-100 min-w-[100px] group transition-all hover:border-rose-200">
            <Handle type="target" position={Position.Left} className="!bg-rose-300 !border-none !w-1.5 !h-1.5" />
            <div className="flex items-center gap-2">
                <div className="rounded-lg w-6 h-6 flex items-center justify-center bg-white text-rose-500 shadow-sm border border-rose-100 group-hover:scale-90 transition-transform">
                    <Square size={8} fill="currentColor" />
                </div>
                <div>
                    <div className="text-[9px] font-black text-rose-800 uppercase tracking-widest leading-none">{data.label || 'End'}</div>
                    <div className="text-[6px] text-rose-600/50 font-bold uppercase tracking-tighter mt-0.5">Exit</div>
                </div>
            </div>
        </div>
    );
};

export default EndNode;
