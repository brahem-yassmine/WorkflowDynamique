'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GitBranch,
  Workflow,
  Plus,
  Settings,
  Save,
  Trash2,
  Edit3,
  Bell,
  Activity,
  Shield,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface WorkflowEntity {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

interface NotificationProtocol {
  role: string;
  initiated: boolean;
  rolledBack: boolean;
  edited: boolean;
  completed: boolean;
  inheritOverride: boolean;
  category: 'Consumer' | 'Administrator';
}

const INITIAL_WORKFLOWS: WorkflowEntity[] = [
  { id: 'WF-001', name: 'Fiscal Audit Sync', description: 'Automated annual budget review and lattice verification.', status: 'active', createdAt: '2025-01-15' },
  { id: 'WF-002', name: 'Persona Onboarding', description: 'Systematic integration of new talent nodes.', status: 'active', createdAt: '2025-01-20' },
  { id: 'WF-003', name: 'Smart Contract Review', description: 'AI-assisted legal verification for node contracts.', status: 'draft', createdAt: '2025-02-01' },
];

const INITIAL_NOTIFICATIONS: NotificationProtocol[] = [
  { role: 'Application User', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: false, category: 'Consumer' },
  { role: 'Configuration Manager', initiated: true, rolledBack: false, edited: true, completed: false, inheritOverride: true, category: 'Consumer' },
  { role: 'Project Lead', initiated: true, rolledBack: true, edited: true, completed: true, inheritOverride: true, category: 'Consumer' },
  { role: 'System Admin', initiated: false, rolledBack: true, edited: false, completed: true, inheritOverride: false, category: 'Administrator' },
  { role: 'Tech Architect', initiated: true, rolledBack: false, edited: false, completed: true, inheritOverride: true, category: 'Administrator' },
];

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowEntity[]>(INITIAL_WORKFLOWS);
  const [notifications, setNotifications] = useState<NotificationProtocol[]>(INITIAL_NOTIFICATIONS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const handleEdit = (w: WorkflowEntity) => {
    setEditingId(w.id);
    setEditForm({ name: w.name, description: w.description });
  };

  const handleSave = (id: string) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, name: editForm.name, description: editForm.description } : w));
    setEditingId(null);
  };

  const toggleNotification = (idx: number, field: keyof Omit<NotificationProtocol, 'role' | 'category'>) => {
    const updated = [...notifications];
    updated[idx] = { ...updated[idx], [field]: !updated[idx][field] };
    setNotifications(updated);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">


      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-6 w-full md:w-auto">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <GitBranch size={24} />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{workflows.length}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Schemas</p>
          </div>
          <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>
          <p className="text-xs font-semibold text-slate-500 max-w-[180px]">Maintain and broadcast your organizational throughput.</p>
        </div>

        <button
          onClick={() => router.push('/admin/create_workflows')}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          Architect New Flow
        </button>
      </div>

      {/* Workflow Matrix */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <Cpu size={20} className="text-indigo-600" />
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Active Schematics</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Broadcast Active</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattice ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Flow Metadata</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workflows.map((w) => (
                <tr key={w.id} className="group hover:bg-indigo-50/20 transition-all">
                  <td className="px-8 py-5">
                    <span className="text-xs font-mono font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">#{w.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    {editingId === w.id ? (
                      <div className="space-y-2 py-2">
                        <input
                          className="w-full bg-white border border-indigo-100 text-sm font-bold text-slate-700 px-3 py-2 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <input
                          className="w-full bg-white border border-indigo-100 text-xs font-medium text-slate-500 px-3 py-1.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{w.name}</span>
                        <span className="text-xs font-medium text-slate-400 mt-0.5 line-clamp-1 italic">{w.description}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${w.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === w.id ? (
                        <>
                          <button onClick={() => handleSave(w.id)} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(w)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={16} /></button>
                          <button className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notification Matrix */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Bell size={22} className="text-amber-500" />
              Phase Alert Protocol
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configure automated broadcast triggers for lattice roles.</p>
          </div>
          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">Commit Changes</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50/80 backdrop-blur-md">Node Role</th>
                {['Initiated', 'Rolled Back', 'Edited', 'Completed', 'Inherit'].map((h) => (
                  <th key={h} className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <ProtocolSection title="Workflow Consumers" items={notifications.filter(n => n.category === 'Consumer')} startIndex={0} toggle={toggleNotification} />
              <ProtocolSection title="Workflow Administrators" items={notifications.filter(n => n.category === 'Administrator')} startIndex={notifications.filter(n => n.category === 'Consumer').length} toggle={toggleNotification} />
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Shield size={14} />
            Lattice Inherit Override Active
          </div>
          <p className="text-[10px] font-bold text-slate-400">SESSION: MASTER_AUTH_NODE_04</p>
        </div>
      </section>
    </div>
  );
}

function ProtocolSection({ title, items, startIndex, toggle }: { title: string; items: NotificationProtocol[]; startIndex: number; toggle: (i: number, f: any) => void }) {
  return (
    <>
      <tr className="bg-indigo-50/30">
        <td colSpan={6} className="px-8 py-3 font-black text-[10px] text-indigo-700 uppercase tracking-tighter italic">{title}</td>
      </tr>
      {items.map((it, idx) => (
        <tr key={it.role} className="group hover:bg-slate-50 transition-colors">
          <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10">
            <span className="text-sm font-bold text-slate-700">{it.role}</span>
          </td>
          <CheckboxCell checked={it.initiated} onChange={() => toggle(startIndex + idx, 'initiated')} />
          <CheckboxCell checked={it.rolledBack} onChange={() => toggle(startIndex + idx, 'rolledBack')} />
          <CheckboxCell checked={it.edited} onChange={() => toggle(startIndex + idx, 'edited')} />
          <CheckboxCell checked={it.completed} onChange={() => toggle(startIndex + idx, 'completed')} />
          <CheckboxCell checked={it.inheritOverride} onChange={() => toggle(startIndex + idx, 'inheritOverride')} highlight />
        </tr>
      ))}
    </>
  );
}

function CheckboxCell({ checked, onChange, highlight = false }: { checked: boolean; onChange: () => void; highlight?: boolean }) {
  return (
    <td className="px-6 py-5 text-center">
      <div
        onClick={onChange}
        className={`
            w-10 h-10 mx-auto rounded-xl flex items-center justify-center cursor-pointer transition-all border-2
            ${checked
            ? (highlight ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100')
            : 'bg-white border-slate-100 hover:border-slate-300'}
         `}
      >
        <div className={`w-2 h-2 rounded-full ${checked ? 'bg-white' : 'bg-slate-200'}`}></div>
      </div>
    </td>
  );
}