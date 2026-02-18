import React from 'react';
import { Settings, Users, GitBranch, Plus, ShieldCheck, RefreshCcw, Save } from 'lucide-react';

const CreateWorkflow = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Configuration Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Workflow Designer</h1>
          <p className="text-xs text-slate-500">Configure steps, rules, and validators[cite: 18, 19].</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"><RefreshCcw size={16}/> Reset</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 shadow-lg shadow-slate-200"><Save size={16}/> Save Configuration </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-0">
        {/* Left Sidebar: Tool Palette */}
        <aside className="col-span-3 bg-white border-r border-slate-200 p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Configuration Tools </h2>
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center gap-3 cursor-grab hover:bg-indigo-50 hover:border-indigo-200 transition-all">
              <div className="p-2 bg-indigo-600 text-white rounded-lg"><GitBranch size={16}/></div>
              <span className="text-sm font-medium">Add Step </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center gap-3 cursor-grab hover:bg-blue-50 hover:border-blue-200 transition-all">
              <div className="p-2 bg-blue-600 text-white rounded-lg"><ShieldCheck size={16}/></div>
              <span className="text-sm font-medium">Multi-level Validation </span>
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="col-span-9 p-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px]">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Step 1 Example */}
            <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-xl relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full uppercase">Step 1: Intake</div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Assign To </label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option>Role: Administrator</option>
                    <option>Group: Finance Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Transition Rules </label>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-bold tracking-tight uppercase">Reject Support </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center py-2"><Plus size={20} className="text-slate-300" /></div>

            {/* Step 2 Example */}
            <div className="bg-white/70 p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center">
              <p className="text-sm text-slate-400 italic">Drag and drop to add a conditional transition </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateWorkflow;