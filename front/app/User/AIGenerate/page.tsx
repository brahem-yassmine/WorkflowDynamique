'use client'

import React, { Suspense } from 'react';
import { Sparkles, Layout, ClipboardCheck, Zap, Settings, ArrowRight, MousePointer2 } from 'lucide-react';

const AIWorkflowBuilderContent = () => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col">
        <div className="font-bold text-xl mb-10 flex items-center gap-2 text-indigo-600">
          <div className="bg-indigo-600 p-1 rounded-lg">
            <Zap size={20} className="text-white" fill="currentColor" />
          </div>
          <span>ProcessFlow <span className="text-slate-400 font-light">AI</span></span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-3 font-semibold cursor-pointer">
            <Sparkles size={18} /> AI Generator
          </div>
          <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl flex items-center gap-3 cursor-pointer transition-all">
            <Layout size={18} /> Workflows
          </div>
          <div className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl flex items-center gap-3 cursor-pointer transition-all">
            <ClipboardCheck size={18} /> Forms & Checklists
          </div>
        </nav>

        <div className="mt-auto p-4 bg-slate-900 rounded-2xl text-white">
          <p className="text-xs text-slate-400 mb-2">PRO PLAN</p>
          <p className="text-sm font-medium">Unlimited Generations</p>
          <button className="mt-3 w-full py-2 bg-indigo-500 rounded-lg text-xs font-bold hover:bg-indigo-400 transition-colors">
            UPGRADE
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Automation Hub</h1>
            <p className="text-slate-500 mt-2">Describe your business logic, and our AI will build the architecture for you.</p>
          </header>

          {/* AI Input Area */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden transition-all hover:border-indigo-300">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <MousePointer2 size={14} /> AI Assistant Input
              </span>
              <span className="text-xs text-indigo-600 font-medium">GPT-4 Engine Active</span>
            </div>
            
            <textarea 
              className="w-full p-8 text-lg text-slate-700 outline-none resize-none h-48 placeholder:text-slate-300"
              placeholder="e.g., Generate a 5-step recruitment workflow including a candidate screening form and a tech interview checklist..."
            />

            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border-t border-slate-50">
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                  <Settings size={20} />
                </button>
              </div>
              <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95">
                Build Workflow <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Smart Suggestions Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Optimization Card */}
            <div className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-3">
                <Zap size={16} fill="currentColor" /> PROCESS OPTIMIZATION
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our AI identified a bottleneck in your approval step. Suggested: **Parallel Reviewing**.
              </p>
            </div>

            {/* Checklist Card */}
            <div className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-3">
                <ClipboardCheck size={16} fill="currentColor" /> AUTO-CHECKLISTS
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Found 3 missing compliance fields. Would you like to auto-generate the **GDPR checklist**?
              </p>
            </div>

            {/* Config Card */}
            <div className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-sm mb-3">
                <Sparkles size={16} fill="currentColor" /> SMART CONFIG
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Detected external triggers. Recommended integration: **Webhook & Slack**.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AIWorkflowBuilder() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-bold text-indigo-600">Loading AI Engine...</div>}>
      <AIWorkflowBuilderContent />
    </Suspense>
  );
}
