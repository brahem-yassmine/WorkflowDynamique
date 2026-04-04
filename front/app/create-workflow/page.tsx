'use client';

import React from "react";
import WorkflowEditor from "../Workflows/_components/WorkflowEditor";
import { ArrowLeft, Zap, Info, Activity } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const WorkflowArchitectContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const flowId = searchParams.get('id');

    const handleBack = () => {
        const domainId = searchParams.get('domainId');
        const moduleId = searchParams.get('moduleId');

        if (flowId) {
            window.location.href = `/admin/workflows/${flowId}?tab=visual`;
        } else if (projectId) {
            window.location.href = `/admin/projects/${projectId}`;
        } else if (domainId && moduleId) {
            window.location.href = `/admin/domains/${domainId}/modules?moduleId=${moduleId}`;
        } else {
            window.location.href = '/admin/workflows';
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-[#fdfdfd] overflow-hidden isolate">
            {/* Top Navigation Bar - Premium Dark Theme */}
            <div className="bg-[#1e1b4b] px-10 py-5 flex items-center justify-between shadow-[0_10px_50px_rgba(0,0,0,0.3)] z-[99999] relative">
                {/* Visual Glow Ornament */}
                <div className="absolute top-0 left-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 pointer-events-none"></div>
                
                <div className="flex items-center gap-10">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all group cursor-pointer backdrop-blur-md relative z-[300000] pointer-events-auto"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] pt-0.5">Exit Architect</span>
                    </button>

                    <div className="h-10 w-px bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-2xl shadow-indigo-500/40 border border-indigo-400/30 group">
                            <Zap size={24} fill="white" className="text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-widest leading-none uppercase flex items-center gap-3">
                                Workflow <span className="text-indigo-400">Architect</span>
                                <span className="bg-indigo-500 text-[8px] px-2 py-1 rounded-md text-white font-black">PRO</span>
                            </h1>
                            <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mt-2">Design Organizational Intelligence System</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] shadow-inner">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        Live Design Synchronized
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em]">
                        <Activity size={16} />
                        Lattice Protocol v2.4
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

const CreateWorkflowFullScreen = () => {
    return (
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-50 font-black text-indigo-600 uppercase tracking-widest">Initializing Architect...</div>}>
            <WorkflowArchitectContent />
        </Suspense>
    );
};

export default CreateWorkflowFullScreen;
