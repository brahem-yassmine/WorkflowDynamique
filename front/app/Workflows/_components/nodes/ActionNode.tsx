import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardList, User, Users, Building, Laptop, DollarSign } from 'lucide-react';

const domainIcons = {
    'RH': <Users size={16} />,
    'Finance': <DollarSign size={16} />,
    'IT': <Laptop size={16} />,
    'Vente': <Building size={16} />,
    'Direction': <User size={16} />,
    'Tous': <ClipboardList size={16} />
};

const ActionNode = ({ data }: any) => {
    const Icon = domainIcons[data.responsibleDomain as keyof typeof domainIcons] || <ClipboardList size={16} />;

    return (
        <div className="px-4 py-2 shadow-md rounded-lg bg-white border-2 border-blue-500 min-w-[190px]">
            <Handle type="target" position={Position.Left} className="bg-blue-500" style={{ borderRadius: '50%', width: '11px', height: '11px' }} />

            <div className="flex items-center mb-2">
                <div className="rounded-full w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-600 mr-2">
                    {Icon}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-gray-900">{data.label || 'Action'}</div>
                        {data.taskType && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border border-blue-100">
                                {data.taskType}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">{data.responsibleDomain || 'Non assigné'}</div>
                </div>
            </div>

            {data.description && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2 border border-gray-100 italic">
                    {data.description}
                </div>
            )}

            <Handle type="source" position={Position.Right} className="bg-blue-500" style={{ borderRadius: '50%', width: '11px', height: '11px' }} />
        </div>
    );
};

export default ActionNode;
