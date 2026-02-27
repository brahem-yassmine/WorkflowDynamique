import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardList, User, Users, Building, Laptop, DollarSign, ListChecks, AlertCircle, LayoutGrid, ClipboardType, CheckSquare, FilePlus } from 'lucide-react';

const domainIcons = {
    'HR': <Users size={16} />,
    'Finance': <DollarSign size={16} />,
    'IT': <Laptop size={16} />,
    'Sales': <Building size={16} />,
    'Management': <User size={16} />,
    'All': <ClipboardList size={16} />,
    'checklist': <ListChecks size={16} />,
    'kanban': <LayoutGrid size={16} />,
    'form': <ClipboardType size={16} />,
    'normal': <CheckSquare size={16} />
};

const priorityStyles = {
    'low': 'bg-slate-100 text-slate-600 border-slate-200',
    'medium': 'bg-blue-50 text-blue-600 border-blue-100',
    'high': 'bg-orange-50 text-orange-600 border-orange-100',
    'critical': 'bg-rose-50 text-rose-600 border-rose-100'
};

const ActionNode = ({ data }: any) => {
    const Icon = domainIcons[data.responsibleDomain as keyof typeof domainIcons] || <ClipboardList size={16} />;
    const priorityClass = priorityStyles[data.priority as keyof typeof priorityStyles] || priorityStyles.medium;
    const checklistCount = Array.isArray(data.checklist) ? data.checklist.length : 0;

    return (
        <div className="px-4 py-3 shadow-xl rounded-2xl bg-white border-2 border-blue-500/20 min-w-[220px] hover:border-blue-500/50 transition-all">
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-white" />

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-xl w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-sm">
                        {data.taskType ? (domainIcons[data.taskType as keyof typeof domainIcons] || Icon) : Icon}
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-800 tracking-tight leading-none">{data.label || 'Task'}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {data.domainScope === 'all' ? 'Global / All Domains' : (data.responsibleDomain || 'Unassigned')}
                        </div>
                    </div>
                </div>
                {data.priority && (
                    <div className="flex flex-col items-end gap-1">
                        <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border ${priorityClass}`}>
                            {data.priority}
                        </div>
                        <div className="text-[7px] font-black uppercase tracking-[0.15em] text-slate-300">
                            {data.taskType || 'Task'}
                        </div>
                    </div>
                )}
            </div>

            {data.description && (
                <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl mb-3 line-clamp-2 border border-slate-100/50">
                    {data.description}
                </p>
            )}

            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="flex items-center gap-3">
                    {checklistCount > 0 && (
                        <div className="flex items-center gap-1 text-slate-400">
                            <ListChecks size={12} />
                            <span className="text-[10px] font-black">{checklistCount}</span>
                        </div>
                    )}
                    {data.estimatedDuration && (
                        <div className="flex items-center gap-1 text-slate-400">
                            <AlertCircle size={12} />
                            <span className="text-[10px] font-black">{data.estimatedDuration}</span>
                        </div>
                    )}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            </div>

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
        </div>
    );
};

export default ActionNode;
