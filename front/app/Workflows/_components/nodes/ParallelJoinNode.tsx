import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Merge } from 'lucide-react';

const ParallelJoinNode = ({ data }: any) => {
    return (
        <div className="px-4 py-4 shadow-2xl rounded-[24px] bg-slate-900 border-2 border-slate-700 min-w-[140px] hover:border-indigo-500 transition-all group overflow-visible relative">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-indigo-500/10 rounded-[22px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* 🎯 TARGET HANDLE (LEFT): Optimized for multiple incoming connections */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-16 !bg-indigo-500 hover:!bg-indigo-400 !border-2 !border-slate-900 !rounded-full -left-1.5"
                style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 1000 }}
                isConnectable={true}
            />

            <div className="flex flex-col items-center gap-3 relative z-10 px-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform shadow-lg">
                    <Merge size={24} />
                </div>
                <div className="text-center">
                    <div className="text-[11px] font-black text-white uppercase tracking-widest leading-none">{data.label || 'Sync Join'}</div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-tight mt-1.5 px-2 bg-slate-800/80 py-1 rounded-md border border-slate-700">
                        Wait for all paths
                    </div>
                </div>
            </div>

            {/* 🚀 SOURCE HANDLE (RIGHT): To continue the workflow */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !bg-indigo-500 !border-2 !border-slate-900 !rounded-full -right-2 hover:scale-125 transition-transform"
                style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 1000 }}
                isConnectable={true}
            />
        </div>
    );
};

export default ParallelJoinNode;
