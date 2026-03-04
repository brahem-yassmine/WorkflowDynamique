import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

const StartNode = ({ data }: any) => {
    return (
        <div className="px-1.5 py-1 shadow-sm rounded bg-white border border-green-500 min-w-[70px] max-w-[90px]">
            <div className="flex items-center">
                <div className="rounded-sm w-4 h-4 flex items-center justify-center bg-green-50 text-green-600 mr-1.5">
                    <Play size={8} />
                </div>
                <div>
                    <div className="text-[8px] font-bold text-slate-800 uppercase tracking-tighter">{data.label || 'Start'}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="bg-green-500" style={{ width: '5px', height: '5px' }} />
        </div>
    );
};

export default StartNode;
