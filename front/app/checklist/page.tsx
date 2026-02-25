'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckSquare, Plus, Trash2, GripVertical, ListTodo, AlertCircle, Save, Clock, FilePlus, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

interface WorkflowTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

function SortableTask({ task, onUpdate, onDelete }: { 
  task: WorkflowTask, 
  onUpdate: (id: string, updates: Partial<WorkflowTask>) => void, 
  onDelete: (id: string) => void 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = { low: 'text-blue-500', medium: 'text-yellow-500', high: 'text-red-500' };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border rounded-xl mb-2 hover:shadow-sm transition-all ${task.completed ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="p-3 flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-move">
          <GripVertical className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onUpdate(task.id, { completed: !task.completed })} 
          className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300'}`}
        >
          <CheckSquare className={`w-5 h-5 ${task.completed ? 'fill-green-500 text-white' : ''}`} />
        </button>
        <div className="flex-1">
          <input 
            type="text" 
            value={task.title} 
            onChange={(e) => onUpdate(task.id, { title: e.target.value })}
            className={`text-sm font-medium bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`} 
          />
        </div>
        <select 
          value={task.priority} 
          onChange={(e) => onUpdate(task.id, { priority: e.target.value as any })}
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-100 ${priorityColors[task.priority]}`}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button onClick={() => onDelete(task.id)} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function WorkflowChecklist() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistName, setChecklistName] = useState('Workflow Checklist');
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // We don't fetch on mount anymore because the user wants a NEW checklist every time they enter.
    // fetchChecklist(); 
  }, []);

  const handleCancel = () => {
    router.back();
  };

  const fetchChecklist = async () => {
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = tenant?._id || user?.tenantId;
      const token = localStorage.getItem('auth_token');

      if (!tenantId || !token) return;

      const res = await axios.get('http://localhost:5000/api/checklists', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId 
        }
      });

      if (res.data.success && res.data.data.length > 0) {
        const checklist = res.data.data[0];
        setTasks(checklist.tasks);
        setChecklistName(checklist.name);
        setChecklistId(checklist._id);
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
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

  const handleNew = () => {
    setTasks([]);
    setChecklistName('Workflow Checklist');
    setChecklistId(null);
    toast.success('Started new checklist');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = tenant?._id || user?.tenantId;

      if (!tenantId) {
        toast.error("Tenant ID missing");
        return;
      }

      const method = checklistId ? 'put' : 'post';
      const url = checklistId 
        ? `http://localhost:5000/api/checklists/${checklistId}` 
        : 'http://localhost:5000/api/checklists';

      const token = localStorage.getItem('auth_token');
      const response = await axios[method](url, {
        name: checklistName,
        tasks: tasks
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId 
        }
      });

      if (response.data.success) {
        if (!checklistId) setChecklistId(response.data.data._id);
        toast.success('Workflow tasks saved');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save checklist');
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" richColors />
      <div className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            <h1 className="text-xl font-bold">Workflow Checklist</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancel}
              className="px-4 py-2 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button 
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-400 transition-all shadow-sm"
            >
              <FilePlus className="w-4 h-4" /> New
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className={`flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Checklist'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <input 
                value={checklistName}
                onChange={(e) => setChecklistName(e.target.value)}
                className="text-lg font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full"
              />
              <p className="text-xs text-gray-500 mt-1">{completedCount} of {tasks.length} tasks completed</p>
            </div>
            <button 
              onClick={addTask} 
              className="flex items-center gap-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {tasks.map(task => (
                  <SortableTask key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl">
                    <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No tasks defined for this step</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
