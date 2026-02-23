'use client'

import React from "react";
import WorkflowEditor from "../../Workflows/_components/WorkflowEditor";
import { Plus, Zap, Activity, Info } from "lucide-react";

const CreateWorkflowsPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">


      {/* Toolbox Hint / Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 animate-pulse">
            <Zap size={20} fill="white" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight">Active Designer Node</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Status: Schematic Syncing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Info size={14} className="text-indigo-400" />
            Drag & Drop Nodes from the side panel
          </div>
          <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} />
            Live Preview
          </div>
        </div>
      </div>

      {/* Editor Canvas Container */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-900/10 border border-slate-100 h-[calc(100vh-320px)] min-h-[500px] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 opacity-50"></div>
        <WorkflowEditor />
      </div>

      {/* Footer Metadata */}
      <div className="flex justify-between items-center px-4">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Global Lattice Architect v2.0</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkflowsPage;
