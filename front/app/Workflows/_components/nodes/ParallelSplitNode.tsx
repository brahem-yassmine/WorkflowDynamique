import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranchPlus } from 'lucide-react';

const ParallelSplitNode = ({ data }: any) => {
    return (
        <div className="px-4 py-3 shadow-lg rounded-[24px] bg-emerald-50 border-2 border-emerald-100 min-w-[130px] hover:border-emerald-300 transition-all group overflow-visible relative">
            <Handle
                type="target"
                position={Position.Left}
                className="!w-1.5 !h-1.5 !bg-emerald-300 !border-none !rounded-full -left-0.5"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />

            <div className="flex flex-col items-center gap-2 relative z-10 px-1">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 border border-emerald-100 group-hover:scale-110 transition-transform shadow-sm">
                    <GitBranchPlus size={16} />
                </div>
                <div className="text-center">
                    <div className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-none">{data.label || 'Parallel'}</div>
                    <div className="text-[6px] text-emerald-500/60 font-bold uppercase tracking-tight mt-1 px-2 py-0.5 bg-white rounded-full border border-emerald-50">
                        Fork
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-1.5 !h-10 !bg-emerald-300 !border-none !rounded-full -right-0.5"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
        </div>
    );
};

export default ParallelSplitNode;
