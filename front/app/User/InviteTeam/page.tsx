import React from 'react';
import { 
  Send, 
  Copy, 
  UserPlus, 
  MessageSquare, 
  Layers, 
  Variable, 
  Save, 
  Trash2,
  ChevronRight
} from 'lucide-react';

const InviteTeam = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Section */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={28} /> Team Collaboration & Messaging
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage customizable message templates for team invitations and workflow updates.</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm">
            <Send size={18} /> Send New Invite
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-12 gap-8">
        
        {/* Left Column: Template List */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> Saved Templates
            </h2>
            <button className="text-xs font-bold text-indigo-600 hover:underline">+ Create New</button>
          </div>

          {[
            { title: "Team Invitation", date: "Updated 2h ago", active: true },
            { title: "Workflow Completion", date: "Updated 1d ago", active: false },
            { title: "Rejection Notice", date: "Updated 3d ago", active: false },
            { title: "Step Reminder", date: "Updated 1w ago", active: false },
          ].map((template, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                template.active 
                ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100' 
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${template.active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{template.title}</h3>
                    <p className="text-[11px] text-slate-400 uppercase font-medium">{template.date}</p>
                  </div>
                </div>
                <ChevronRight size={16} className={template.active ? 'text-indigo-400' : 'text-slate-300'} />
              </div>
            </div>
          ))}
        </aside>

        {/* Right Column: Template Editor */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Editor Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-700">Template: Team Invitation</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">Draft</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Copy size={18} /></button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Message Content</label>
                <textarea 
                  className="w-full h-64 p-6 bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-serif leading-relaxed"
                  defaultValue={`Hi {{user_name}},\n\nYou've been invited to join the {{team_name}} workflow on ProcessAI.\n\nClick the button below to start collaborating on your assigned tasks.\n\nBest regards,\n{{sender_name}}`}
                />
              </div>

              {/* Dynamic Variables Section */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-2 mb-3">
                  <Variable size={14} /> Available Variables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['user_name', 'team_name', 'sender_name', 'workflow_id', 'invite_link'].map((v) => (
                    <code key={v} className="px-2 py-1 bg-white border border-indigo-100 text-indigo-600 text-[11px] rounded-md font-mono cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors">
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            {/* Editor Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
              <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default InviteTeam;