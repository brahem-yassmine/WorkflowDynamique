import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardType, Image, FileText, FileBarChart, Link, ClipboardList } from 'lucide-react';

const icons = {
    'FORM': <ClipboardType size={8} />,
    'IMAGE': <Image size={8} />,
    'PDF': <FileText size={8} />,
    'REPORT': <FileBarChart size={8} />,
    'EXTERNAL': <Link size={8} />
};

const TaskNode = ({ data }: any) => {
    const Icon = icons[data.config?.taskType as keyof typeof icons] || <ClipboardList size={8} />;

    return (
        <div className="px-2 py-1.5 shadow-sm rounded-md bg-white border border-indigo-200 min-w-[120px]">
            <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-2 !h-2 !border-2 !border-white" />

            <div className="flex items-center gap-2">
                <div className="rounded-md w-6 h-6 flex-none flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {Icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-700 leading-tight truncate">{data.label || 'Task Unit'}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5 truncate uppercase font-medium">
                        {data.config?.taskType || 'CONTENT'}
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-2 !h-2 !border-2 !border-white" />
        </div>
    );
};

export default TaskNode;
