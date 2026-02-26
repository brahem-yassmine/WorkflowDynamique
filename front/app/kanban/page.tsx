'use client';

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
  LayoutDashboard,
  Trash2,
  ArrowLeft,
  Save,
  Check,
  X,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import Link from 'next/link';

// --- Types ---
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  position: number;
}

const COLUMNS: { id: 'todo' | 'doing' | 'done'; title: string; bg: string; headerBg: string }[] = [
  { id: 'todo',  title: 'To Do', bg: 'bg-red-100',    headerBg: 'bg-red-200'    },
  { id: 'doing', title: 'Doing', bg: 'bg-yellow-100', headerBg: 'bg-yellow-200' },
  { id: 'done',  title: 'Done',  bg: 'bg-green-100',  headerBg: 'bg-green-200'  },
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
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group mb-3"
    >
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
              className="flex-1 text-sm font-semibold text-gray-800 border-b border-indigo-400 outline-none bg-transparent"
            />
            <button onClick={commitEdit} className="text-green-500 hover:text-green-600">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={cancelEdit} className="text-red-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h4
            className="flex-1 text-sm font-semibold text-gray-800 cursor-pointer hover:text-indigo-600 transition-colors"
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
              className="p-1 hover:bg-gray-100 rounded text-gray-400 cursor-grab"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
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
}: {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
  onAdd: (status: 'todo' | 'doing' | 'done') => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  bg: string;
  headerBg: string;
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column' } });

  return (
    <div ref={setNodeRef} className={`flex flex-col ${bg} rounded-2xl p-4 h-full`}>
      <div className={`flex items-center justify-between mb-4 px-2 py-2 rounded-xl ${headerBg}`}>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{title}</h3>
          <span className="bg-white text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(id)}
          className="p-1 hover:bg-white rounded-md text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px]">
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
export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthInfo = () => {
    const token = localStorage.getItem('auth_token');
    const tenantId =
      localStorage.getItem('tenantId') ||
      JSON.parse(localStorage.getItem('tenant') || '{}')?._id ||
      JSON.parse(localStorage.getItem('user') || '{}')?.tenantId;
    return { tenantId, token };
  };

  const fetchTasks = async () => {
    const { tenantId, token } = getAuthInfo();
    if (!tenantId || !token) { setIsLoading(false); return; }
    try {
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
      });
      if (res.data.success) setTasks(res.data.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

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
      const updated = prev.map((t) => ({ ...t }));
      const activeIndex = updated.findIndex((t) => t._id === active.id);
      if (activeIndex === -1) return prev;

      if (isOverATask) {
        const overIndex = updated.findIndex((t) => t._id === over.id);
        if (overIndex === -1) return prev;
        updated[activeIndex].status = updated[overIndex].status;
        return arrayMove(updated, activeIndex, overIndex);
      }

      if (isOverAColumn) {
        updated[activeIndex].status = over.id as 'todo' | 'doing' | 'done';
        return arrayMove(updated, activeIndex, activeIndex);
      }

      return prev;
    });
  };

  const handleDragEnd = async (_event: DragEndEvent) => {
    setActiveTask(null);
  };

  const saveBoard = async () => {
    const { tenantId, token } = getAuthInfo();
    setIsSaving(true);
    try {
      await axios.post(
        'http://localhost:5000/api/tasks/reorder',
        { tasks: tasks.map((t, i) => ({ id: t._id, position: i, status: t.status })) },
        { headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );
      toast.success('Board saved!');
    } catch {
      toast.error('Failed to save board');
    } finally {
      setIsSaving(false);
    }
  };

  const createTask = async (status: 'todo' | 'doing' | 'done') => {
    const { tenantId, token } = getAuthInfo();
    try {
      const res = await axios.post(
        'http://localhost:5000/api/tasks',
        { title: 'New Task', status, position: tasks.length },
        { headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );
      if (res.data.success) setTasks((prev) => [...prev, res.data.data]);
    } catch {
      toast.error('Failed to create task');
    }
  };

  const deleteTask = async (id: string) => {
    const { tenantId, token } = getAuthInfo();
    setTasks((prev) => prev.filter((t) => t._id !== id));
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
      });
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const renameTask = async (id: string, newTitle: string) => {
    const { tenantId, token } = getAuthInfo();
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, title: newTitle } : t)));
    try {
      await axios.patch(
        `http://localhost:5000/api/tasks/${id}`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );
    } catch {
      toast.error('Failed to rename task');
    }
  };

  const columnTasks = (status: 'todo' | 'doing' | 'done') =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="bg-white border-b px-8 py-5 shadow-sm">
        <div className="max-w-[1600px] mx-auto grid grid-cols-3 items-center">
          {/* Left: Back button */}
          <div className="flex items-center">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>

          {/* Center: Title */}
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">KanBan</h1>
              <p className="text-xs text-gray-400">Manage your team's tasks</p>
            </div>
          </div>

          {/* Right: Save button */}
          <div className="flex items-center justify-end">
            <button
              onClick={saveBoard}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="p-8 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
            Loading tasks…
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
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
                <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xl scale-105 cursor-grabbing max-w-[380px]">
                  <h4 className="text-sm font-semibold text-gray-800">{activeTask.title}</h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
