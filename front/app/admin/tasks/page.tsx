'use client';

const API_URL = 'http://localhost:5000/api';

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Trash2,
  Save,
  Check,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { motion } from 'framer-motion';

// --- Types ---
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  position: number;
}

const COLUMNS: { id: 'todo' | 'doing' | 'done'; title: string; bg: string; headerBg: string; edgeColor: string }[] = [
  { id: 'todo',  title: 'To Do', bg: 'bg-rose-50/50',    headerBg: 'bg-rose-100/50', edgeColor: 'bg-rose-500' },
  { id: 'doing', title: 'Doing', bg: 'bg-amber-50/50', headerBg: 'bg-amber-100/50', edgeColor: 'bg-amber-500' },
  { id: 'done',  title: 'Done',  bg: 'bg-emerald-50/50',  headerBg: 'bg-emerald-100/50', edgeColor: 'bg-emerald-500' },
];

// --- Inline Editable Task ---
function SortableTask({
  task,
  onDelete,
  onRename,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { type: 'Task', task },
  });

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== task.title) onRename(task._id, trimmed);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraftTitle(task.title);
    setEditing(false);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group mb-3 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="flex-1 text-sm font-bold text-slate-700 border-b-2 border-indigo-400 outline-none bg-transparent"
            />
            <button onClick={commitEdit} className="text-emerald-500 hover:text-emerald-600 p-1">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={cancelEdit} className="text-rose-400 hover:text-rose-500 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h4
            className="flex-1 text-sm font-bold text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors leading-tight"
            onClick={() => setEditing(true)}
            title="Click to edit"
          >
            {task.title}
          </h4>
        )}

        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Droppable Column ---
function KanbanColumn({
  id,
  title,
  tasks,
  onAdd,
  onDelete,
  onRename,
  bg,
  headerBg,
  edgeColor,
}: {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
  onAdd: (status: 'todo' | 'doing' | 'done') => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  bg: string;
  headerBg: string;
  edgeColor: string;
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column' } });

  return (
    <div ref={setNodeRef} className={`flex flex-col ${bg} rounded-[32px] p-5 border border-slate-100 h-full`}>
      <div className={`flex items-center justify-between mb-6 px-3 py-2.5 rounded-2xl ${headerBg} border border-white/50 backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${edgeColor}`}></div>
          <h3 className="font-black text-slate-700 uppercase text-[10px] tracking-[0.15em]">{title}</h3>
          <span className="bg-white/80 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-lg border border-white shadow-sm">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(id)}
          className="p-1.5 bg-white/50 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px] pr-1 custom-scrollbar">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task._id} task={task} onDelete={onDelete} onRename={onRename} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthInfo = () => {
    if (typeof window === 'undefined') return { tenantId: null, token: null };
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const tenantId =
      localStorage.getItem('tenantId') ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem('tenant') || '{}')?._id;
        } catch { return null; }
      })() ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || '{}')?.tenantId;
        } catch { return null; }
      })();
    return { tenantId, token };
  };

  const fetchTasks = async () => {
    const { tenantId, token } = getAuthInfo();
    if (!tenantId || !token) { 
      setIsLoading(false); 
      return; 
    }
    try {
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
      });
      if (res.data.success) setTasks(res.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchTasks(); 
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isActiveATask = active.data.current?.type === 'Task';
    if (!isActiveATask) return;

    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    setTasks((prev) => {
      const updated = [...prev];
      const activeIndex = updated.findIndex((t) => t._id === active.id);
      if (activeIndex === -1) return prev;

      if (isOverATask) {
        const overIndex = updated.findIndex((t) => t._id === over.id);
        if (overIndex === -1) return prev;
        
        // Only update if they are different so we don't trigger unnecessary re-renders
        if (updated[activeIndex].status !== updated[overIndex].status) {
          updated[activeIndex] = { ...updated[activeIndex], status: updated[overIndex].status };
        }
        return arrayMove(updated, activeIndex, overIndex);
      }

      if (isOverAColumn) {
        const newStatus = over.id as 'todo' | 'doing' | 'done';
        if (updated[activeIndex].status !== newStatus) {
            updated[activeIndex] = { ...updated[activeIndex], status: newStatus };
        }
        return arrayMove(updated, activeIndex, activeIndex);
      }

      return prev;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
  };

  const saveBoard = async () => {
    const { tenantId, token } = getAuthInfo();
    if (!tenantId || !token) return;
    setIsSaving(true);
    try {
      await axios.post(
        'http://localhost:5000/api/tasks/reorder',
        { tasks: tasks.map((t, i) => ({ id: t._id, position: i, status: t.status })) },
        { headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );
      toast.success('Kanban saved!');
    } catch {
      toast.error('Failed to sync board state');
    } finally {
      setIsSaving(false);
    }
  };

  const createTask = async (status: 'todo' | 'doing' | 'done') => {
    const { tenantId, token } = getAuthInfo();
    if (!tenantId || !token) return;
    try {
      const res = await axios.post(
        'http://localhost:5000/api/tasks',
        { title: 'New Node', status, position: tasks.length },
        { headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );
      if (res.data.success) setTasks((prev) => [...prev, res.data.data]);
    } catch {
      toast.error('Failed to provision new node');
    }
  };

  const deleteTask = async (id: string) => {
    const { tenantId, token } = getAuthInfo();
    if (!tenantId || !token) return;
    setTasks((prev) => prev.filter((t) => t._id !== id));
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
      });
    } catch {
      toast.error('Failed to terminate node');
    }
  };

  const renameTask = async (id: string, newTitle: string) => {
    const { tenantId, token } = getAuthInfo();
    if (!tenantId || !token) return;
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, title: newTitle } : t)));
    try {
      await axios.patch(
        `http://localhost:5000/api/tasks/${id}`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );
    } catch {
      toast.error('Failed to update node title');
    }
  };

  const columnTasks = (status: 'todo' | 'doing' | 'done') =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Sub-Header with Action Button */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight uppercase">Kanban</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Status: {isLoading ? 'Syncing...' : 'Kanban Online'}</p>
          </div>
        </div>

        <button
          onClick={saveBoard}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? 'Synchronizing...' : 'Save Kanban'}
        </button>
      </div>

      {/* Board Canvas */}
      <div className="h-[calc(100vh-280px)] min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Kanban...</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  tasks={columnTasks(col.id)}
                  onAdd={createTask}
                  onDelete={deleteTask}
                  onRename={renameTask}
                  bg={col.bg}
                  headerBg={col.headerBg}
                  edgeColor={col.edgeColor}
                />
              ))}
            </div>

            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: '0.5' } },
                }),
              }}
            >
              {activeTask ? (
                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-500 shadow-2xl scale-105 cursor-grabbing w-[320px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                  <h4 className="text-sm font-black text-slate-800">{activeTask.title}</h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
