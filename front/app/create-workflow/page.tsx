'use client';

import React from "react";
import WorkflowEditor from "../Workflows/_components/WorkflowEditor";
import { ArrowLeft, Zap, Info, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

const CreateWorkflowFullScreen = () => {
    const router = useRouter();

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all flex items-center gap-2 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-black uppercase tracking-widest">Back</span>
                    </button>

                    <div className="h-6 w-px bg-slate-100 mx-2"></div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">Workflow Architect</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Design Organizational Intelligence</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <Activity size={14} className="animate-pulse" />
                        Live Designer
                    </div>
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <Info size={14} />
                        Auto-save active
                    </div>
                </div>
            </div>

            {/* Editor Canvas Container - NOW FULL SCREEN */}
            <div className="flex-grow overflow-hidden relative">
                <WorkflowEditor />
            </div>

            {/* Subtle Footer Bar */}
            <div className="bg-white border-t border-slate-100 px-6 py-2 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <span>Lattice Engine v2.4</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-emerald-500/50">System Nominal</span>
                    </div>
                    <div className="h-3 w-px bg-slate-100"></div>
                    <span>Schema Sync: 100%</span>
                </div>
            </div>
        </div>
    );
};

export default CreateWorkflowFullScreen;
