import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardList, User, Users, Building, Laptop, DollarSign, ListChecks, AlertCircle, LayoutGrid, ClipboardType, CheckSquare, FilePlus } from 'lucide-react';

const domainIcons = {
    'HR': <Users size={8} />,
    'Finance': <DollarSign size={8} />,
    'IT': <Laptop size={8} />,
    'Sales': <Building size={8} />,
    'Management': <User size={8} />,
    'All': <ClipboardList size={8} />,
    'checklist': <ListChecks size={8} />,
    'kanban': <LayoutGrid size={8} />,
    'form': <ClipboardType size={8} />,
    'normal': <CheckSquare size={8} />
};

const ActionNode = ({ data }: any) => {
    const Icon = domainIcons[data.responsibleDomain as keyof typeof domainIcons] || <ClipboardList size={8} />;

    return (
        <div className="px-2 py-1.5 shadow-sm rounded-md bg-white border border-slate-200 min-w-[120px]">
            <Handle type="target" position={Position.Left} className="!bg-indigo-500" />

            <div className="flex items-center gap-2">
                <div className="rounded-md w-6 h-6 flex-none flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {data.taskType ? (domainIcons[data.taskType as keyof typeof domainIcons] || Icon) : Icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-700 leading-tight truncate">{data.label || 'Task'}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5 truncate uppercase font-medium">
                        {data.responsibleDomain || 'N/D'}
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
        </div>
    );
};

export default ActionNode;
