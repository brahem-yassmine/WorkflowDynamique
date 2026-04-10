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
        <div className="px-2 py-1.5 shadow-lg rounded-xl bg-white border-2 border-indigo-50 min-w-[120px] hover:border-indigo-200 transition-all group">
            <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-indigo-300 !border-none" />

            <div className="flex items-center gap-2">
                <div className="rounded-lg w-6 h-6 flex-none flex items-center justify-center bg-indigo-50 text-indigo-500 border border-indigo-100 group-hover:scale-110 transition-transform">
                    {data.taskType ? (domainIcons[data.taskType as keyof typeof domainIcons] || Icon) : Icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black text-slate-700 leading-tight truncate uppercase tracking-tight">{data.label || 'Task'}</div>
                    <div className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                        {data.responsibleDomain || 'N/D'}
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-indigo-300 !border-none" />
        </div>
    );
};

export default ActionNode;
