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
        <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col gap-4 h-full overflow-y-auto">
            <div className="mb-4">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">Architect Toolbox</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Drag components to build lattice</p>
            </div>

            <div className="space-y-2">

                {/* TASK Unit */}
                <div
                    className="flex items-center gap-3 p-3 bg-indigo-50 border-2 border-indigo-100/50 rounded-2xl cursor-grab hover:border-indigo-200 hover:bg-indigo-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'TASK')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100 group-hover:rotate-12 transition-transform">
                        <Users size={12} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Task Unit</span>
                </div>

                {/* APPROVAL Unit */}
                <div
                    className="flex items-center gap-3 p-3 bg-emerald-50 border-2 border-emerald-100/50 rounded-2xl cursor-grab hover:border-emerald-200 hover:bg-emerald-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'APPROVAL')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 group-hover:rotate-12 transition-transform">
                        <GitBranchPlus size={12} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Approval</span>
                </div>

                {/* CONDITION Node */}
                <div
                    className="flex items-center gap-3 p-3 bg-amber-50 border-2 border-amber-100/50 rounded-2xl cursor-grab hover:border-amber-200 hover:bg-amber-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'CONDITION')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 group-hover:rotate-12 transition-transform">
                        <GitFork size={12} />
                    </div>
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Logic Fork</span>
                </div>

                {/* AUTO Unit */}
                <div
                    className="flex items-center gap-3 p-3 bg-fuchsia-50 border-2 border-fuchsia-100/50 rounded-2xl cursor-grab hover:border-fuchsia-200 hover:bg-fuchsia-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'AUTO')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-fuchsia-500 shadow-sm border border-fuchsia-100 group-hover:rotate-12 transition-transform">
                        <Merge size={12} />
                    </div>
                    <span className="text-[10px] font-black text-fuchsia-900 uppercase tracking-widest">Automation</span>
                </div>

                {/* NOTIFICATION Unit */}
                <div
                    className="flex items-center gap-3 p-3 bg-blue-50 border-2 border-blue-100/50 rounded-2xl cursor-grab hover:border-blue-200 hover:bg-blue-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'NOTIFICATION')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 group-hover:rotate-12 transition-transform">
                        <Square size={12} />
                    </div>
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Trigger Alert</span>
                </div>
            </div>

            <div className="h-px bg-slate-50 my-4" />
            
            <div className="mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lattice Controls</p>
            </div>

            <div className="space-y-2">
                {/* Parallel Split */}
                <div
                    className="flex items-center gap-3 p-3 bg-cyan-50 border-2 border-cyan-100/50 rounded-2xl cursor-grab hover:border-cyan-200 hover:bg-cyan-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'parallel_split')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-cyan-500 shadow-sm border border-cyan-100 group-hover:rotate-12 transition-transform">
                        <GitBranchPlus size={12} />
                    </div>
                    <span className="text-[10px] font-black text-cyan-900 uppercase tracking-widest">Parallel Fork</span>
                </div>

                {/* Parallel Join */}
                <div
                    className="flex items-center gap-3 p-3 bg-violet-50 border-2 border-violet-100/50 rounded-2xl cursor-grab hover:border-violet-200 hover:bg-violet-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'parallel_join')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-violet-500 shadow-sm border border-violet-100 group-hover:rotate-12 transition-transform">
                        <Merge size={12} />
                    </div>
                    <span className="text-[10px] font-black text-violet-900 uppercase tracking-widest">Sync Join</span>
                </div>

                {/* End Node */}
                <div
                    className="flex items-center gap-3 p-3 bg-rose-50 border-2 border-rose-100/50 rounded-2xl cursor-grab hover:border-rose-200 hover:bg-rose-100/50 transition-all active:scale-95 group"
                    onDragStart={(e) => onDragStart(e, 'END')}
                    draggable
                >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 group-hover:rotate-12 transition-transform">
                        <Square size={10} fill="currentColor" />
                    </div>
                    <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Exit Node</span>
                </div>
            </div>

            {/* Hint Box */}
            <div className="mt-auto p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pro Architect Hint</p>
                </div>
                <p className="text-[8px] font-bold text-slate-500 leading-normal uppercase tracking-tight">
                    Use <span className="text-amber-500">Logic Forks</span> for decision gates and <span className="text-emerald-500">Parallel Forks</span> for high-throughput concurrent flows.
                </p>
            </div>
        </aside>
    );
}
