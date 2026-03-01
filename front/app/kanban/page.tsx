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
  Trash2,
  Save,
  Check,
  X,
  LayoutDashboard,
  ChevronLeft,
  ListTodo,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiService } from '@/service/api.service';

// --- Types ---
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  position: number;
}

const COLUMNS: { id: 'todo' | 'doing' | 'done'; title: string; accent: string; bar: string }[] = [
  { id: 'todo', title: 'To Do', accent: 'text-blue-500', bar: 'bg-blue-500' },
  { id: 'doing', title: 'Doing', accent: 'text-amber-500', bar: 'bg-amber-500' },
  { id: 'done', title: 'Done', accent: 'text-emerald-500', bar: 'bg-emerald-500' },
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
  };

  const statusColor = task.status === 'todo' ? 'bg-blue-500' : task.status === 'doing' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group mb-4 relative overflow-hidden flex gap-4"
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${statusColor} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

      <button
        {...attributes}
        {...listeners}
        className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing transition-all"
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="w-full text-sm font-black text-slate-700 border-b-2 border-indigo-400 outline-none bg-transparent py-1"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={commitEdit}
                className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-100"
                title="Oui (Enregistrer)"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task._id)}
                className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEdit}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent"
                title="Non (Annuler)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <h4
            className="text-sm font-black text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors leading-relaxed line-clamp-2"
            onClick={() => setEditing(true)}
          >
            {task.title}
          </h4>
        )}
      </div>

      {!editing && (
        <button
          onClick={() => onDelete(task._id)}
          className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={18} />
        </button>
      )}
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
  accent,
  bar,
}: {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
  onAdd: (status: 'todo' | 'doing' | 'done') => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  accent: string;
  bar: string;
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column' } });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full group/column border-2 border-slate-100/80 rounded-[40px] p-7 bg-slate-50/10 hover:bg-slate-50/30 transition-all duration-500 hover:border-indigo-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${bar} shadow-lg shadow-current opacity-60 animate-pulse`}></div>
          <div>
            <h3 className={`font-black uppercase text-[12px] tracking-[0.25em] ${accent}`}>{title}</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">
              {tasks.length} {tasks.length === 1 ? 'Logic Gate' : 'Logic Gates'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAdd(id)}
          className="w-10 h-10 bg-white text-indigo-600 rounded-2xl flex items-center justify-center transition-all border border-slate-100 shadow-sm hover:bg-indigo-600 hover:text-white active:scale-90"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px] pr-2 custom-scrollbar space-y-1">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task._id} task={task} onDelete={onDelete} onRename={onRename} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/20 group-hover/column:bg-slate-50/50 transition-all">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4 border border-slate-50 text-slate-200">
              <Check size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-8 leading-loose">
              No logic gates assigned to this domain
            </p>
          </div>
        )}
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

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('New Board');
  const [boardDescription, setBoardDescription] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const boardId = searchParams.get('boardId');

  const fetchBoardData = async () => {
    try {
      setIsLoading(true);
      if (!boardId) {
        setTasks([]);
        setBoardName('New Board');
        setBoardDescription('');
        setIsLoading(false);
        return;
      }

      // Fetch Tasks
      const tasksUrl = `/tasks?boardId=${boardId}`;
      const tasksRes = await apiService.request(tasksUrl);
      if (tasksRes.success) setTasks(tasksRes.data);

      // Fetch Board Details
      try {
        const boardRes = await apiService.request(`/boards/${boardId}`);
        if (boardRes.success && boardRes.data) {
          setBoardName(boardRes.data.name || 'New Board');
          setBoardDescription(boardRes.data.description || '');
        }
      } catch (e) {
        console.error('Board fetch error:', e);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

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

  const saveBoard = () => {
    setIsSaveModalOpen(true);
  };

  const confirmSaveBoard = async () => {
    if (!boardName.trim()) {
      toast.error("Please enter a board name");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save Board Info
      let currentBoardId = boardId;
      const boardPayload = {
        name: boardName,
        description: boardDescription,
      };

      if (currentBoardId) {
        await apiService.request(`/boards/${currentBoardId}`, {
          method: 'PATCH', // backend usually uses PATCH/PUT for updates
          body: JSON.stringify(boardPayload)
        });
      } else {
        const boardRes = await apiService.request('/boards', {
          method: 'POST',
          body: JSON.stringify(boardPayload)
        });
        if (boardRes.success) {
          currentBoardId = boardRes.data._id;
        }
      }

      // 2. Save Tasks (Reorder/Update status)
      await apiService.request('/tasks/reorder', {
        method: 'POST',
        body: JSON.stringify({
          tasks: tasks.map((t, i) => ({
            id: t._id,
            position: i,
            status: t.status,
            boardId: currentBoardId
          })),
          boardId: currentBoardId
        }),
      });

      toast.success(boardId ? 'Architecture Board updated' : 'Architecture Board created successfully');
      setIsSaveModalOpen(false);
      router.push('/admin/AllKanban');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save architecture');
    } finally {
      setIsSaving(false);
    }
  };

  const createTask = async (status: 'todo' | 'doing' | 'done') => {
    try {
      const res = await apiService.request('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Task', status, position: tasks.length, boardId }),
      });
      if (res.success) setTasks((prev) => [...prev, res.data]);
    } catch (error) {
      toast.error('Failed to provision new task');
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    try {
      await apiService.request(`/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch {
      toast.error('Failed to terminate task');
    }
  };

  const renameTask = async (id: string, newTitle: string) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, title: newTitle } : t)));
    try {
      await apiService.request(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle }),
      });
    } catch {
      toast.error('Failed to update task title');
    }
  };

  const columnTasks = (status: 'todo' | 'doing' | 'done') =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 -m-8">
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
            >
              {/* Modal Header */}
              <div className="bg-indigo-600 p-8 text-white">
                <h2 className="text-2xl font-black tracking-tight uppercase">Board Identification</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Lattice Persistence</p>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Board Name</label>
                  <input
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="Enter board name..."
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description (Architecture Details)</label>
                  <textarea
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    placeholder="Describe this architecture..."
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all min-h-[120px] resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 pt-0 flex items-center justify-between">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={confirmSaveBoard}
                  disabled={isSaving}
                  className="px-10 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {isSaving ? 'Synchronizing...' : 'Commit Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 mb-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/admin/AllKanban'}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
              title="Return to Management"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Throughput Designer</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                {isLoading ? 'Loading Neural Lattice...' : boardId ? `Architecture Board` : 'Provisioning Master Schema'}
              </p>
            </div>
          </div>

          <button
            onClick={saveBoard}
            disabled={isSaving || isLoading}
            className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Synchronizing...' : 'Save Lattice State'}
          </button>
        </div>
      </div>

      {/* Board Canvas */}
      <div className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[600px] bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Schema...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-10 gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Workflow Architecture</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Logic Distribution Monitor</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Link</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-50 mb-12"></div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 min-h-[600px]">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    tasks={columnTasks(col.id)}
                    onAdd={createTask}
                    onDelete={deleteTask}
                    onRename={renameTask}
                    accent={col.accent}
                    bar={col.bar}
                  />
                ))}
              </div>

              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '1' } },
                  }),
                }}
              >
                {activeTask ? (
                  <div className="bg-white p-6 rounded-[32px] border-2 border-indigo-500 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.3)] scale-105 cursor-grabbing w-[350px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">
                        Moving Task
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 leading-relaxed">{activeTask.title}</h4>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
