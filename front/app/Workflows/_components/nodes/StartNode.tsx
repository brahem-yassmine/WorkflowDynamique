import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

const StartNode = ({ data }: any) => {
    return (
        <div className="px-3.5 py-2 shadow-md rounded-lg bg-white border-2 border-green-500 min-w-[140px]">
            <div className="flex items-center">
                <div className="rounded-full w-7 h-7 flex items-center justify-center bg-green-100 text-green-600 mr-2">
                    <Play size={14} />
                </div>
                <div>
                    <div className="text-sm font-bold text-gray-900">{data.label || 'Start'}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="bg-green-500" style={{ borderRadius: '50%', width: '11px', height: '11px' }} />
        </div>
    );
};

export default StartNode;
