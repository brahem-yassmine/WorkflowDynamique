'use client'

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  Trash2,
  Edit,
  User,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  description: string;
  assignedTo: string;
  state: 'pending' | 'in-progress' | 'done';
  comments: number;
  attachments: number;
  warnings: number;
  dueDate: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Renew budget proposal', priority: 'High', category: 'Finance', description: 'Update and renew the annual budget proposal for the upcoming fiscal year.', assignedTo: 'John Doe', state: 'pending', comments: 3, attachments: 2, warnings: 1, dueDate: '2 days left' },
    { id: '2', name: 'Plan Q kickoff', priority: 'Medium', category: 'Events', description: 'Coordinate with all department heads for the next quarterly kickoff.', assignedTo: 'Jane Smith', state: 'pending', comments: 0, attachments: 1, warnings: 0, dueDate: '5 days left' },
    { id: '3', name: 'Update marketing plan', priority: 'Medium', category: 'Brief', description: 'Refresh the marketing strategy document with latest analytics.', assignedTo: 'Mike Johnson', state: 'in-progress', comments: 5, attachments: 3, warnings: 0, dueDate: 'Tomorrow' },
    { id: '4', name: 'New design flow', priority: 'Low', category: 'Product', description: 'Design the user flow for the new AI-powered workflow builder.', assignedTo: 'Sarah Williams', state: 'in-progress', comments: 12, attachments: 8, warnings: 2, dueDate: 'Next week' },
    { id: '5', name: 'Brand sync', priority: 'High', category: 'Marketing', description: 'Synchronize brand assets with the global design team.', assignedTo: 'David Brown', state: 'done', comments: 2, attachments: 1, warnings: 0, dueDate: 'Completed' },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStateChange = (taskId: string, newState: Task['state']) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, state: newState } : t));
    if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, state: newState });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">


      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by task name, owner or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Filter size={20} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus size={18} />
            Create Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
        {/* Kanban Board */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          <Column
            title="Scheduled"
            count={tasks.filter(t => t.state === 'pending').length}
            color="bg-slate-400"
          >
            {tasks.filter(t => t.state === 'pending').map(t => (
              <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} styles={getPriorityStyles(t.priority)} />
            ))}
          </Column>

          <Column
            title="In Execution"
            count={tasks.filter(t => t.state === 'in-progress').length}
            color="bg-indigo-500"
          >
            {tasks.filter(t => t.state === 'in-progress').map(t => (
              <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} styles={getPriorityStyles(t.priority)} />
            ))}
          </Column>

          <Column
            title="Synchronized"
            count={tasks.filter(t => t.state === 'done').length}
            color="bg-emerald-500"
          >
            {tasks.filter(t => t.state === 'done').map(t => (
              <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} styles={getPriorityStyles(t.priority)} />
            ))}
          </Column>
        </div>

        {/* Task Inspector */}
        <div className="lg:col-span-4 h-full">
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getPriorityStyles(selectedTask.priority)}`}>
                    {selectedTask.priority} Priority
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{selectedTask.name}</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">{selectedTask.description}</p>

                <div className="space-y-6 flex-grow">
                  <DetailRow label="Protocol State" icon={<Clock size={16} />}>
                    <select
                      value={selectedTask.state}
                      onChange={(e) => handleStateChange(selectedTask.id, e.target.value as Task['state'])}
                      className="bg-slate-50 border-none text-xs font-black text-indigo-600 rounded-lg py-1 px-3 outline-none"
                    >
                      <option value="pending">Scheduled</option>
                      <option value="in-progress">Executing</option>
                      <option value="done">Synchronized</option>
                    </select>
                  </DetailRow>
                  <DetailRow label="Assignee Node" icon={<User size={16} />}>
                    <span className="text-sm font-bold text-slate-700">{selectedTask.assignedTo}</span>
                  </DetailRow>
                  <DetailRow label="Deadline" icon={<Calendar size={16} />}>
                    <span className={`text-sm font-black ${selectedTask.dueDate === 'Critical' ? 'text-rose-600' : 'text-slate-700'}`}>
                      {selectedTask.dueDate}
                    </span>
                  </DetailRow>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-3">
                  <button className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                    <Edit size={16} />
                    Update Node
                  </button>
                  <button className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95">
                    <Trash2 size={16} />
                    Terminate Node
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-slate-300">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-400 tracking-tight">Inspector Idle</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Select a task node to view sub-metrics.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Column({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-3xl p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${color}`}></div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        </div>
        <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">{count}</span>
      </div>
      <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, styles }: { task: Task; onClick: () => void; styles: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-tighter ${styles}`}>
          {task.category}
        </span>
        <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
          <Clock size={10} /> {task.dueDate}
        </span>
      </div>
      <h4 className="text-sm font-bold text-slate-800 mb-4 line-clamp-2">{task.name}</h4>
      <div className="flex items-center justify-between mt-auto">
        <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
          {task.assignedTo.slice(0, 2)}
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1 text-[10px] font-black tracking-tighter">
            <MessageSquare size={12} /> {task.comments}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black tracking-tighter">
            <Paperclip size={12} /> {task.attachments}
          </div>
          {task.warnings > 0 && (
            <div className="text-rose-500">
              <AlertCircle size={14} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
      </div>
      {children}
    </div>
  );
}
