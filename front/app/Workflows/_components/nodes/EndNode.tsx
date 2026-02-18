import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

const EndNode = ({ data }: any) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-red-500 min-w-[150px]">
            <Handle type="target" position={Position.Left} className="bg-red-500" style={{ borderRadius: '50%', width: '12px', height: '12px' }} />
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 mr-2">
                    <Square size={16} />
                </div>
                <div>
                    <div className="text-sm font-bold text-gray-900">{data.label || 'Fin'}</div>
                </div>
            </div>
        </div>
    );
};

export default EndNode;
