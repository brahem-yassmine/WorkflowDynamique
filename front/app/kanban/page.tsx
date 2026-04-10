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
  Edit3,
  LayoutDashboard,
  ChevronLeft,
  Clock,
  Save as SaveIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiService } from '@/service/api.service';
import useUser from '@/hooks/useUser';

// --- Types ---
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  position: number;
  assignedTo?: string; // Added field
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
  onOpenSettings,
  users,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onOpenSettings: (task: Task) => void;
  users: any[];
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
        className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing transition-all border-0 outline-none"
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1 min-w-0 text-left">
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
                className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-100 border-0 outline-none"
                title="Save Changes"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task._id)}
                className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100 outline-none"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEdit}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent outline-none"
                title="Cancel"
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
        
        {task.assignedTo && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-50">
            <div className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[8px] font-black uppercase shadow-sm">
              {users.find(u => (u._id || u.id) === task.assignedTo)?.firstName?.substring(0, 1) || 'U'}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              {users.find(u => (u._id || u.id) === task.assignedTo)?.firstName} {users.find(u => (u._id || u.id) === task.assignedTo)?.lastName}
            </span>
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onOpenSettings(task)}
            className="p-2.5 hover:bg-indigo-50 rounded-xl text-slate-300 hover:text-indigo-600 transition-all border-0 outline-none"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all border-0 outline-none"
          >
            <Trash2 size={18} />
          </button>
        </div>
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
  onOpenSettings,
  users,
  accent,
  bar,
}: {
  id: 'todo' | 'doing' | 'done';
  title: string;
  tasks: Task[];
  onAdd: (status: 'todo' | 'doing' | 'done') => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onOpenSettings: (task: Task) => void;
  users: any[];
  accent: string;
  bar: string;
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column' } });
  const { btnDisabledClass } = useUser();

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full group/column border-2 border-slate-100/80 rounded-[40px] p-7 bg-slate-50/10 hover:bg-slate-50/30 transition-all duration-500 hover:border-indigo-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${bar} shadow-lg shadow-current opacity-60 animate-pulse`}></div>
          <div className="text-left">
            <h3 className={`font-black uppercase text-[12px] tracking-[0.25em] ${accent}`}>{title}</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">
              {tasks.length} {tasks.length === 1 ? 'Ongoing Task' : 'Ongoing Tasks'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { onAdd(id); }}
          className={`w-10 h-10 bg-white rounded-2xl flex items-center justify-center transition-all border border-slate-100 shadow-sm active:scale-90 outline-none text-indigo-600 hover:bg-indigo-600 hover:text-white ${btnDisabledClass('KANBAN_ADD')}`}
          title="Add Task"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px] pr-2 custom-scrollbar space-y-1">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task._id} task={task} onDelete={onDelete} onRename={onRename} onOpenSettings={onOpenSettings} users={users} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/20 group-hover/column:bg-slate-50/50 transition-all">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4 border border-slate-50 text-slate-200">
              <Check size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-8 leading-loose">
              No ongoing tasks assigned to this domain
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
  const [user, setUser] = useState<any>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [designerWorkflowId, setDesignerWorkflowId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('admin');
  const [isSaving, setIsSaving] = useState(false);
  const { btnDisabledClass, hasPermission } = useUser();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('New Board');
  const [boardDescription, setBoardDescription] = useState('');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [boardId, setBoardId] = useState<string | null>(null);
  const [fromWorkflow, setFromWorkflow] = useState<boolean>(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]); // Added users state

  // Task Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '', // Added assignedTo field
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  // const boardId = searchParams.get('boardId'); // This line is now replaced by state

  const fetchBoardData = async (currentBoardId: string | null) => { // Modified to accept boardId
    try {
      setIsLoading(true);
      if (!currentBoardId) {
        setTasks([]);
        setBoardName('New Board');
        setBoardDescription('');
        setIsLoading(false);
        return;
      }

      // Fetch Tasks
      const tasksUrl = `/tasks?boardId=${currentBoardId}`;
      const tasksRes = await apiService.request(tasksUrl);
      if (tasksRes.success) setTasks(tasksRes.data);

      // Fetch Board Details
      try {
        const boardRes = await apiService.request(`/boards/${currentBoardId}`);
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

  const fetchWorkflows = async () => {
    try {
      const res = await apiService.getWorkflows();
      if (res.success) setWorkflows(res.data);
    } catch (e) {
      console.error('Fetch workflows error:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiService.getUsers();
      if (res.success) setUsers(res.data);
    } catch (e) {
      console.error('Fetch users error:', e);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const id = searchParams.get('boardId');
    const dwId = searchParams.get('designerWorkflowId');
    const role = searchParams.get('role');
    const fWorkflow = searchParams.get('fromWorkflow') === 'true';
    const bName = searchParams.get('boardName');
    const rUrl = searchParams.get('returnUrl');

    if (id) {
      setBoardId(id);
      fetchBoardData(id);
    } else {
      setBoardId(null);
      fetchBoardData(null);
      if (bName) setBoardName(bName);
    }

    if (dwId) {
      setDesignerWorkflowId(dwId);
      setSelectedWorkflowId(dwId); // Default select the workflow we came from
    }

    if (role) setUserRole(role);
    if (fWorkflow) setFromWorkflow(true);
    if (rUrl) setReturnUrl(rUrl);

    fetchWorkflows();
    fetchUsers();
  }, [searchParams]);



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
      let currentBoardId = boardId;
      const boardPayload = {
        name: boardName,
        description: boardDescription,
      };

       if (currentBoardId) {
        await apiService.request(`/boards/${currentBoardId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...boardPayload,
            workflowId: selectedWorkflowId || null
          })
        });
      } else {
        const boardRes = await apiService.request('/boards', {
          method: 'POST',
          body: JSON.stringify({
            ...boardPayload,
            workflowId: selectedWorkflowId || null
          })
        });
        if (boardRes.success) {
          currentBoardId = boardRes.data._id;
          setBoardId(currentBoardId); // Update boardId state after creation
        }
      }

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

      const successMsg = fromWorkflow ? 'Kanban attached' : (boardId ? 'Architecture Board updated' : 'Architecture Board created successfully');
      toast.success(successMsg);
      setIsSaveModalOpen(false);

      if (returnUrl) {
        const url = new URL(returnUrl, window.location.origin);
        url.searchParams.set('notif', successMsg);
        if (currentBoardId) url.searchParams.set('newBoardId', currentBoardId);
        window.location.href = url.toString();
      } else if (fromWorkflow && designerWorkflowId) {
        router.push(`/admin/workflows/${designerWorkflowId}?tab=kanban&notif=${encodeURIComponent(successMsg)}`);
      } else if (designerWorkflowId) {
        router.push(`/${userRole}/create_workflows?id=${designerWorkflowId}&notif=${encodeURIComponent(successMsg)}`);
      } else {
        router.push('/admin/AllKanban');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save architecture');
    } finally {
      setIsSaving(false);
    }
  };

  const openTaskModal = (status: 'todo' | 'doing' | 'done', task: Task | null = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedTo || '',
      });
    } else {
      setEditingTask({ status } as any);
      setTaskForm({
        title: 'New Task',
        description: '',
        assignedTo: '',
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleTaskSave = async () => {
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      if (editingTask?._id) {
        const res = await apiService.request(`/tasks/${editingTask._id}`, {
          method: 'PATCH',
          body: JSON.stringify(taskForm),
        });
        if (res.success) {
          setTasks(prev => prev.map(t => t._id === editingTask._id ? res.data : t));
          
          const selectedUser = users.find(u => (u._id || u.id) === taskForm.assignedTo);
          const feedbackMsg = selectedUser 
            ? `Task synchronized and assigned to ${selectedUser.firstName} ${selectedUser.lastName}`
            : "Task logic unit synchronized";

          toast.success(feedbackMsg, {
            icon: <SaveIcon size={18} className="text-emerald-500" />
          });
        }
      } else {
        const res = await apiService.request('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            ...taskForm,
            status: editingTask?.status,
            position: tasks.length,
            boardId
          }),
        });
        if (res.success) {
          setTasks(prev => [...prev, res.data]);
          
          const selectedUser = users.find(u => (u._id || u.id) === taskForm.assignedTo);
          const feedbackMsg = selectedUser 
            ? `Task provisioned and assigned to ${selectedUser.firstName} ${selectedUser.lastName}`
            : "New task provisioned successfully";

          toast.success(feedbackMsg, {
            icon: <Plus size={18} className="text-emerald-500" />
          });
        }
      }
      setIsTaskModalOpen(false);
    } catch (error) {
      toast.error("Failed to save task");
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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-indigo-600 p-8 text-white relative text-left">
                <div className="absolute top-0 right-0 p-6">
                  <button onClick={() => setIsTaskModalOpen(false)} className="text-white/60 hover:text-white transition-colors border-0 outline-none bg-transparent">
                    <X size={24} />
                  </button>
                </div>
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  {editingTask?._id ? 'Refine Logic Gate' : 'Provision New Task'}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Lattice Unit Configuration</p>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar text-left">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Task Designation</label>
                    <input
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      placeholder="Enter task title..."
                      className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Procedural Instructions</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      placeholder="Detail the steps for this task..."
                      className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all min-h-[120px] shadow-sm resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Logic Operator Assignment</label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm appearance-none"
                    >
                      <option value="">Unassigned (Open for Pool)</option>
                      {users.map((u: any) => (
                        <option key={u._id || u.id} value={u._id || u.id}>
                          {u.firstName} {u.lastName} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Simplified - removed other types and attachments as requested */}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 pt-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors border-0 outline-none bg-transparent"
                >
                  Discard
                </button>
                <button
                  onClick={handleTaskSave}
                  className="px-12 py-5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 border-0 outline-none"
                >
                  <SaveIcon size={18} />
                  {editingTask?._id ? 'Synchronize Updates' : 'Commit Logic Unit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="bg-indigo-600 p-8 text-white text-left">
                <h2 className="text-2xl font-black tracking-tight uppercase">Board Identification</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Lattice Persistence</p>
              </div>

              <div className="p-8 space-y-8 text-left">
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

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Associate with Workflow</label>
                  <select 
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none"
                  >
                    <option value="">Select a Workflow...</option>
                    {workflows.map((wf: any) => (
                      <option key={wf._id} value={wf._id}>{wf.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-8 pt-0 flex items-center justify-between">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors border-0 outline-none bg-transparent"
                >
                  Discard
                </button>
                <button
                  onClick={confirmSaveBoard}
                  disabled={isSaving}
                  className="px-10 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 border-0 outline-none"
                >
                  {isSaving ? 'Synchronizing...' : 'Commit Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Standalone Header */}
      <div className="bg-white border-b border-gray-100 z-30 mb-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-0 sm:h-20 flex flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (returnUrl) {
                  window.location.href = returnUrl;
                } else if (fromWorkflow && designerWorkflowId) {
                  router.push(`/admin/workflows/${designerWorkflowId}?tab=kanban`);
                } else if (designerWorkflowId) {
                  router.push(`/${userRole}/create_workflows?id=${designerWorkflowId}`);
                } else {
                  router.push('/admin/AllKanban');
                }
              }}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shrink-0"
              title={designerWorkflowId ? "Back to Workflow" : "Return to Management"}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div className="text-left min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase truncate">Throughput Designer</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1 truncate">
                {isLoading ? 'Loading Neural Lattice...' : boardId ? `Architecture Board` : 'Provisioning Master Schema'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={saveBoard}
              disabled={isSaving || isLoading || (!hasPermission('KANBAN_CREATE') && !hasPermission('KANBAN_EDIT'))} 
              className={`flex items-center gap-3 px-6 sm:px-8 py-2.5 sm:py-3 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 whitespace-nowrap ${(!hasPermission('KANBAN_CREATE') && !hasPermission('KANBAN_EDIT')) ? btnDisabledClass : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
              title={(!hasPermission('KANBAN_CREATE') && !hasPermission('KANBAN_EDIT')) ? "Permission denied" : ""}
            >
              {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <SaveIcon size={18} />}
              {isSaving ? 'Synchronizing...' : 'Save Lattice State'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[600px] bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Schema...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-10 gap-8">
              <div className="flex-1 text-left">
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
                    onAdd={openTaskModal}
                    onDelete={deleteTask}
                    onRename={renameTask}
                    onOpenSettings={(task) => openTaskModal(task.status, task)}
                    users={users}
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
                  <div className="bg-white p-6 rounded-[32px] border-2 border-indigo-500 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.3)] scale-105 cursor-grabbing w-[350px] relative overflow-hidden text-left">
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
