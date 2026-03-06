// front/app/Workflows/_components/Sidebar.tsx
"use client"
import React from 'react';
import { Play, Square, Users, GitFork, Merge, GitBranchPlus } from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-3 h-full overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Toolbox</h3>
            <p className="text-sm text-gray-500 mb-2">Drag onto canvas</p>

            {/* Start */}
            <div
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded cursor-grab hover:bg-green-100"
                onDragStart={(e) => onDragStart(e, 'start')}
                draggable
            >
                <Play size={18} className="text-green-600" />
                <span className="font-medium">Start</span>
            </div>

            {/* Task */}
            <div
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded cursor-grab hover:bg-blue-100"
                onDragStart={(e) => onDragStart(e, 'action')}
                draggable
            >
                <Users size={18} className="text-blue-600" />
                <span className="font-medium">Task</span>
            </div>

            {/* Condition Node */}
            <div
                className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded cursor-grab hover:bg-amber-100"
                onDragStart={(e) => onDragStart(e, 'condition')}
                draggable
            >
                <GitFork size={18} className="text-amber-600" />
                <span className="font-medium">Condition (Yes/No)</span>
            </div>

            <div className="h-px bg-slate-100 my-2"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Logic Controls</p>

            {/* Parallel Split */}
            <div
                className="flex items-center gap-2 p-3 bg-emerald-900 border border-emerald-700 rounded cursor-grab hover:bg-emerald-800 text-white"
                onDragStart={(e) => onDragStart(e, 'parallel_split')}
                draggable
            >
                <GitBranchPlus size={18} className="text-emerald-400" />
                <span className="font-medium">Parallel Split</span>
            </div>

            {/* Parallel Join */}
            <div
                className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded cursor-grab hover:bg-slate-800 text-white"
                onDragStart={(e) => onDragStart(e, 'parallel_join')}
                draggable
            >
                <Merge size={18} className="text-indigo-400" />
                <span className="font-medium">Parallel Join</span>
            </div>

            {/* End Node */}
            <div
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded cursor-grab hover:bg-red-100"
                onDragStart={(e) => onDragStart(e, 'end')}
                draggable
            >
                <Square size={18} className="text-red-600" />
                <span className="font-medium">End</span>
            </div>

            {/* Info */}
            <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <p className="font-medium mb-1">💡 Condition:</p>
                <p>Two outputs: YES (green) and NO (red)</p>
            </div>
        </aside>
    );
}
