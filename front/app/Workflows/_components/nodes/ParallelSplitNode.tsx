import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranchPlus } from 'lucide-react';

const ParallelSplitNode = ({ data }: any) => {
    return (
        <div className="px-4 py-4 shadow-2xl rounded-[24px] bg-slate-800 border-2 border-slate-700 min-w-[140px] hover:border-emerald-500 transition-all group overflow-visible relative">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-[22px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-4 !bg-emerald-500 !border-2 !border-slate-800 !rounded-full -left-1.5"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />

            <div className="flex flex-col items-center gap-3 relative z-10 px-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform shadow-lg">
                    <GitBranchPlus size={24} />
                </div>
                <div className="text-center">
                    <div className="text-[11px] font-black text-white uppercase tracking-widest leading-none">Parallel Split</div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-tight mt-1.5 px-2 bg-slate-900/80 py-1 rounded-md border border-slate-700">
                        Launch All Paths
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-16 !bg-emerald-500 hover:!bg-emerald-400 !border-2 !border-slate-800 !rounded-full -right-1.5"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
        </div>
    );
};

export default ParallelSplitNode;
