import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Merge } from 'lucide-react';

const ParallelJoinNode = ({ data }: any) => {
    return (
        <div className="px-4 py-3 shadow-lg rounded-[24px] bg-indigo-50 border-2 border-indigo-100 min-w-[130px] hover:border-indigo-300 transition-all group overflow-visible relative">
            {/* 🎯 TARGET HANDLE (LEFT) */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-1.5 !h-10 !bg-indigo-300 !border-none !rounded-full -left-0.5"
                style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 1000 }}
                isConnectable={true}
            />

            <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 border border-indigo-100 group-hover:scale-110 transition-transform shadow-sm">
                    <Merge size={16} />
                </div>
                <div className="text-center">
                    <div className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none">{data.label || 'Sync'}</div>
                    <div className="text-[6px] text-indigo-400 font-bold uppercase tracking-tight mt-1 px-3 py-0.5 bg-white rounded-full border border-indigo-50">
                        Join
                    </div>
                </div>
            </div>

            {/* 🚀 SOURCE HANDLE (RIGHT) */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-2.5 !h-2.5 !bg-indigo-400 !border-none !rounded-full -right-1"
                style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 1000 }}
                isConnectable={true}
            />
        </div>
    );
};

export default ParallelJoinNode;
