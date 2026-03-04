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
        <div className="px-1 py-1 shadow-sm rounded bg-white border border-slate-200 min-w-[90px] max-w-[110px] hover:border-blue-400 transition-all">
            <Handle type="target" position={Position.Left} className="w-1 h-1 bg-blue-500 border-none" />

            <div className="flex items-center gap-1">
                <div className="rounded-sm w-4 h-4 flex-none flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100">
                    {data.taskType ? (domainIcons[data.taskType as keyof typeof domainIcons] || Icon) : Icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[8px] font-bold text-slate-800 leading-none truncate">{data.label || 'Task'}</div>
                    <div className="text-[6px] text-slate-300 uppercase tracking-tighter truncate">
                        {data.responsibleDomain || 'N/A'}
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="w-1 h-1 bg-blue-500 border-none" />
        </div>
    );
};

export default ActionNode;
