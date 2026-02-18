import React from 'react';
import { History, FileText, CheckCircle, Clock, Archive, MoreHorizontal, Eye } from 'lucide-react';

const WorkflowsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Workflow Registry</h1>
          <p className="text-slate-500">History, traceability, and status management[cite: 20, 25].</p>
        </header>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20}/></div>
            <div><p className="text-sm text-slate-500">Drafts</p><p className="text-xl font-bold">12</p></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={20}/></div>
            <div><p className="text-sm text-slate-500">Active</p><p className="text-xl font-bold">45</p></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><Archive size={20}/></div>
            <div><p className="text-sm text-slate-500">Archived</p><p className="text-xl font-bold">128</p></div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={18}/> Audit Trail & Actions </h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="px-6 py-4">Workflow Name</th>
                <th className="px-6 py-4">Current Status </th>
                <th className="px-6 py-4">Last Action</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 font-mono text-sm underline cursor-pointer">#WF-992: BTP Site Inspection</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">ACTIVE</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600 font-medium">Validation Step 2 </div>
                  <div className="text-[10px] text-slate-400">By Admin - 10 mins ago</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-indigo-600"><Eye size={18}/></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;