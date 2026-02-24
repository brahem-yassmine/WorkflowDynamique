import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

const EndNode = ({ data }: any) => {
    return (
        <div className="px-3.5 py-2 shadow-md rounded-lg bg-white border-2 border-red-500 min-w-[140px]">
            <Handle type="target" position={Position.Left} className="bg-red-500" style={{ borderRadius: '50%', width: '11px', height: '11px' }} />
            <div className="flex items-center">
                <div className="rounded-full w-7 h-7 flex items-center justify-center bg-red-100 text-red-600 mr-2">
                    <Square size={14} />
                </div>
                <div>
                    <div className="text-sm font-bold text-gray-900">{data.label || 'End'}</div>
                </div>
            </div>
        </div>
    );
};

export default EndNode;
