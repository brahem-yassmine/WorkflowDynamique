'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  MoreVertical, 
  GripVertical, 
  Clock, 
  AlertCircle,
  LayoutDashboard,
  Trash2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

// --- Types ---
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  position: number;
}

interface Column {
  id: 'todo' | 'doing' | 'done';
  title: string;
}

const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' }
];

// --- Sortable Task Item ---
function SortableTask({ task, onDelete }: { task: Task, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-800">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
            {...attributes} {...listeners}
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
      </div>
    </div>
  );
}

// --- Kanban Page ---
export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // APIs Setup
  const getAuthInfo = () => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tenantId = tenant?._id || user?.tenantId;
    const token = localStorage.getItem('auth_token');
    return { tenantId, token };
  };

  const fetchTasks = async () => {
    const { tenantId, token } = getAuthInfo();
    if (!tenantId || !token) return;

    try {
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
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
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        const overIndex = tasks.findIndex((t) => t._id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a Task over a Column
    const isOverAColumn = over.data.current?.type === 'Column';
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        tasks[activeIndex].status = overId as any;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    // Persist changes
    const { tenantId, token } = getAuthInfo();
    try {
      await axios.post('http://localhost:5000/api/tasks/reorder', {
        tasks: tasks.map((t, i) => ({ id: t._id, position: i, status: t.status }))
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
    } catch (error) {
      toast.error('Failed to save order');
    }
  };

  const createTask = async (status: 'todo' | 'doing' | 'done') => {
    const title = window.prompt('Task title:');
    if (!title) return;

    const { tenantId, token } = getAuthInfo();
    try {
      const res = await axios.post('http://localhost:5000/api/tasks', {
        title,
        status,
        position: tasks.length
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });

      if (res.data.success) {
        setTasks([...tasks, res.data.data]);
        toast.success('Task created');
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;

    const { tenantId, token } = getAuthInfo();
    try {
      const res = await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.data.success) {
        setTasks(tasks.filter(t => t._id !== id));
        toast.success('Task deleted');
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Monitor</h1>
              <p className="text-sm text-gray-500">Manage and track your team's progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="p-8 max-w-[1600px] mx-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex flex-col bg-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{column.title}</h3>
                    <span className="bg-white text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                      {tasks.filter(t => t.status === column.id).length}
                    </span>
                  </div>
                  <button 
                    onClick={() => createTask(column.id)}
                    className="p-1 hover:bg-white rounded-md text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[200px]">
                  <SortableContext
                    items={tasks.filter(t => t.status === column.id).map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasks
                      .filter(t => t.status === column.id)
                      .map((task) => (
                        <SortableTask key={task._id} task={task} onDelete={deleteTask} />
                      ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeTask ? (
              <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xl scale-105 cursor-grabbing w-full max-w-[400px]">
                <h4 className="text-sm font-semibold text-gray-800">{activeTask.title}</h4>
                {activeTask.description && (
                  <p className="text-xs text-gray-500 mt-1">{activeTask.description}</p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
