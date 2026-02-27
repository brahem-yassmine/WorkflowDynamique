'use client';

import React, { useState, useEffect } from 'react';
import { 
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {  
  CheckSquare, Plus, Trash2, GripVertical, ListTodo, AlertCircle, Save, Clock, ChevronLeft, Check, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

interface WorkflowTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

function SortableTask({ task, onUpdate, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColors = { 
    low: 'bg-indigo-50 text-indigo-600 border-indigo-100', 
    medium: 'bg-amber-50 text-amber-600 border-amber-100', 
    high: 'bg-rose-50 text-rose-600 border-rose-100' 
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      layout
      className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group mb-3 relative overflow-hidden flex items-center gap-4 ${task.completed ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full transition-all ${task.completed ? 'bg-emerald-500' : 'bg-indigo-600'} opacity-0 group-hover:opacity-100`}></div>
      
      <button {...attributes} {...listeners} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-all">
        <GripVertical size={18} />
      </button>

      <button 
        onClick={() => onUpdate(task.id, { completed: !task.completed })} 
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
          task.completed 
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' 
            : 'border-slate-200 hover:border-indigo-400 text-transparent'
        }`}
      >
        <Check size={14} className="stroke-[4px]" />
      </button>

      <div className="flex-1">
        <input 
          type="text" 
          value={task.title} 
          onChange={(e) => onUpdate(task.id, { title: e.target.value })}
          className={`text-sm font-black bg-transparent border-b-2 border-transparent focus:border-indigo-400 outline-none w-full transition-all ${
            task.completed ? 'line-through text-slate-400' : 'text-slate-700'
          }`} 
        />
      </div>

      <div className="flex items-center gap-3">
        <select 
          value={task.priority} 
          onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border appearance-none cursor-pointer transition-all ${priorityColors[task.priority as keyof typeof priorityColors]}`}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button 
          onClick={() => onDelete(task.id)} 
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export default function WorkflowChecklist() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistName, setChecklistName] = useState('Workflow Checklist');
  const [checklistStatus, setChecklistStatus] = useState<'draft' | 'completed'>('draft');
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setChecklistId(id);
      fetchChecklist(id);
    }
  }, []);

  const fetchChecklist = async (id?: string) => {
    const targetId = id || checklistId;
    if (!targetId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = localStorage.getItem('tenantId') || tenant?._id || user?.tenantId;

      if (!tenantId || !token) return;

      const res = await axios.get(`http://localhost:5000/api/checklists/${targetId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId 
        }
      });

      if (res.data.success && res.data.data) {
        const checklist = res.data.data;
        setTasks(checklist.tasks || []);
        setChecklistName(checklist.name);
        setChecklistStatus(checklist.status || 'draft');
        setChecklistId(checklist._id);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
      toast.error("Failed to load checklist node");
    } finally {
      setIsLoading(false);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addTask = () => {
    setTasks([...tasks, { id: Date.now().toString(), title: 'New task', completed: false, priority: 'medium' }]);
  };

  const updateTask = (id: string, updates: Partial<WorkflowTask>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    toast.error('Task removed');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = localStorage.getItem('tenantId') || tenant?._id || user?.tenantId;

      if (!tenantId || !token) {
        toast.error("Auth session expired. Please sign in again.");
        return;
      }

      const method = checklistId ? 'put' : 'post';
      const url = checklistId 
        ? `http://localhost:5000/api/checklists/${checklistId}` 
        : 'http://localhost:5000/api/checklists';

      const response = await axios[method](url, {
        name: checklistName,
        tasks: tasks,
        status: checklistStatus
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId 
        }
      });

      if (response.data.success) {
        if (!checklistId) setChecklistId(response.data.data._id);
        toast.success('Workflow saved successfully');
      } else {
        toast.error(response.data.message || 'Synchronization failed');
      }
    } catch (error: any) {
      console.error('Error saving checklist:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Network error';
      toast.error(`Failed to save: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />
      
      {/* Standalone Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 mb-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = '/admin/AllCheck'}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
              title="Back to Management"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Checklist Designer</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                {isLoading ? 'Loading Knowledge Schema...' : checklistId ? 'Architecture' : 'Provisioning New Schema'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={isSaving || isLoading} 
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Synchronizing...' : 'Save Checklist'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Schema...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-10 gap-8">
              <div className="flex-1">
                <input 
                  value={checklistName}
                  onChange={(e) => setChecklistName(e.target.value)}
                  className="text-3xl font-black text-slate-800 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none w-full transition-all"
                  placeholder="Untitled Checklist..."
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                <select 
                  value={checklistStatus}
                  onChange={(e) => setChecklistStatus(e.target.value as any)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border appearance-none cursor-pointer transition-all ${
                    checklistStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-slate-50 text-slate-600 border-slate-100'
                  }`}
                >
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                </select>
                
                <button 
                  onClick={addTask} 
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm whitespace-nowrap active:scale-95"
                >
                  <Plus size={18} /> Add new Task 
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-50 mb-10"></div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {tasks.map(task => (
                    <SortableTask key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-32 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
                         <AlertCircle className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No logic gates defined for this checklist</p>
                      <button 
                        onClick={addTask}
                        className="mt-8 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 underline underline-offset-8"
                      >
                        Start Architecting
                      </button>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
