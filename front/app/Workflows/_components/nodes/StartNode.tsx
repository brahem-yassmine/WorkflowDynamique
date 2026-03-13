import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

const StartNode = ({ data }: any) => {
    return (
        <div className="px-3 py-2 shadow-lg rounded-xl bg-emerald-50 border-2 border-emerald-100 min-w-[100px] group transition-all hover:border-emerald-200">
            <div className="flex items-center gap-2">
                <div className="rounded-lg w-6 h-6 flex items-center justify-center bg-white text-emerald-500 shadow-sm border border-emerald-100 group-hover:rotate-12 transition-transform">
                    <Play size={8} fill="currentColor" />
                </div>
                <div>
                    <div className="text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-none">{data.label || 'Start'}</div>
                    <div className="text-[6px] text-emerald-600/50 font-bold uppercase tracking-tighter mt-0.5">Entry</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-emerald-300 !border-none !w-1.5 !h-1.5" />
        </div>
    );
};

export default StartNode;
