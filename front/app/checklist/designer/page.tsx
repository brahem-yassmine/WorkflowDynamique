'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckSquare, Plus, Trash2, GripVertical, ListTodo, AlertCircle, Save, Clock, ChevronLeft, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { apiService } from '@/service/api.service';

interface WorkflowTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

function SortableTask({ task, onUpdate, onDelete, isConsult }: any) {
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
        onClick={() => !isConsult && onUpdate(task.id, { completed: !task.completed })}
        disabled={isConsult}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed
          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
          : 'border-slate-200 hover:border-indigo-400 text-transparent'
          } ${isConsult ? 'cursor-not-allowed opacity-80' : ''}`}
      >
        <Check size={14} className="stroke-[4px]" />
      </button>

      <div className="flex-1">
        <input
          type="text"
          value={task.title}
          disabled={isConsult}
          onChange={(e) => onUpdate(task.id, { title: e.target.value })}
          className={`text-sm font-black bg-transparent border-b-2 border-transparent focus:border-indigo-400 outline-none w-full transition-all ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'
            } ${isConsult ? 'cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={task.priority}
          disabled={isConsult}
          onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border appearance-none cursor-pointer transition-all ${priorityColors[task.priority as keyof typeof priorityColors]} ${isConsult ? 'cursor-not-allowed' : ''}`}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {!isConsult && (
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function WorkflowChecklist() {
  const router = useRouter();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistName, setChecklistName] = useState('Workflow Checklist');
  const [checklistStatus, setChecklistStatus] = useState<'draft' | 'completed'>('draft');
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [checklistDescription, setChecklistDescription] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [designerWorkflowId, setDesignerWorkflowId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('admin');
  const [fromWorkflow, setFromWorkflow] = useState<boolean>(false);
  const [source, setSource] = useState<string | null>(null);
  const [workflowDetailsId, setWorkflowDetailsId] = useState<string | null>(null);

  // Execution Context
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [isConsult, setIsConsult] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const dwId = params.get('designerWorkflowId');
    const role = params.get('role');
    const fWorkflow = params.get('fromWorkflow') === 'true';
    const src = params.get('source');
    const wdId = params.get('workflowDetailsId');
    const instId = params.get('instanceId');
    const nId = params.get('nodeId');
    const fromPath = params.get('from');
    setIsConsult(params.get('consult') === 'true');

    if (id) {
      setChecklistId(id);
      fetchChecklist(id);
    }
    if (dwId) setDesignerWorkflowId(dwId);
    if (role) setUserRole(role);
    if (fWorkflow) setFromWorkflow(true);
    if (src) setSource(src);
    if (wdId) setWorkflowDetailsId(wdId);
    if (instId) setInstanceId(instId);
    if (nId) setNodeId(nId);
    if (fromPath) setFrom(fromPath);

    if (instId && nId && !id) {
      fetchInstanceData(instId, nId);
    }
  }, []);

  const fetchInstanceData = async (instId: string, nId: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.getInstance(instId);
      if (res.success) {
        const nodes = res.data.workflowId?.nodes || res.data.nodes || [];
        const node = nodes.find((n: any) => n.id === nId);
        if (node?.linkedObjectId) {
          setChecklistId(node.linkedObjectId);
          fetchChecklist(node.linkedObjectId);
        }
      }
    } catch (e) {
      console.error("Error fetching instance data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChecklist = async (id?: string) => {
    const targetId = id || checklistId;
    if (!targetId) return;

    setIsLoading(true);
    try {
      const response = await apiService.request(`/checklists/${targetId}`);
      if (response.success && response.data) {
        const checklist = response.data;
        let finalTasks = checklist.tasks || [];
        
        // If we are in execution mode, we might want to blend with instance variables
        const params = new URLSearchParams(window.location.search);
        const instId = params.get('instanceId');
        const nId = params.get('nodeId');
        
        if (instId && nId) {
          try {
             const instRes = await apiService.getInstance(instId);
             if (instRes.success) {
                const savedTasks = instRes.data.variables?.[nId] || instRes.data.variables?.[`${nId}_data`];
                if (savedTasks && Array.isArray(savedTasks)) {
                   finalTasks = savedTasks;
                }
             }
          } catch(e) {}
        }

        setTasks(finalTasks);
        setChecklistName(checklist.name);
        setChecklistDescription(checklist.description || '');
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

  const handleSave = () => {
    setIsSaveModalOpen(true);
  };

  const confirmSave = async () => {
    if (!checklistName.trim()) {
      toast.error("Veuillez saisir un nom pour la checklist.");
      return;
    }

    setIsSaving(true);
    try {
      if (instanceId && nodeId) {
        const res = await apiService.request(`/forms/null/submit`, {
           method: 'POST',
           body: JSON.stringify({
              data: tasks,
              name: checklistName,
              instanceId,
              nodeId
           })
        });
        
        if (res.success) {
          toast.success('Checklist progress synchronized');
          setIsSaveModalOpen(false);
          const isPath = from?.startsWith('/');
          if (isPath) {
             router.push(`${from}?instanceId=${instanceId}&nodeId=${nodeId}&executed=true`);
          } else {
             router.push(`/Workflows/instances/${instanceId}?nodeId=${nodeId}&executed=true`);
          }
          return;
        }
      }

      const payload = {
        name: checklistName,
        description: checklistDescription,
        tasks: tasks,
        status: checklistStatus
      };

      const response = checklistId 
        ? await apiService.request(`/checklists/${checklistId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiService.request(`/checklists`, { method: 'POST', body: JSON.stringify(payload) });

      if (response.success) {
        const savedId = response.data._id || checklistId;
        if (!checklistId) setChecklistId(savedId);
        toast.success('Workflow saved successfully');
        setIsSaveModalOpen(false);
        
        if (source === 'workflow_details' && workflowDetailsId) {
          router.push(`/admin/workflows/${workflowDetailsId}`);
        } else if (source === 'allchecks') {
          router.push('/admin/AllCheck');
        } else if (designerWorkflowId || fromWorkflow) {
          const basePath = userRole.toLowerCase().includes('admin') ? '/admin' : '/User';
          router.push(`${basePath}/create_workflows?id=${designerWorkflowId}`);
        } else {
          router.push(`/admin/AllCheck`);
        }
      } else {
        toast.error(response.message || 'Synchronization failed');
      }
    } catch (error: any) {
      console.error('Error saving checklist:', error);
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isExecutionMode = !!(instanceId && nodeId);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />
      
      {isExecutionMode && !isConsult && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg sticky top-0 z-[60]">
          Protocol Execution Active — Synchronizing with Live Lattice
        </div>
      )}

      {isConsult && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg sticky top-0 z-[60]">
          Validator Consultation View — Checklist is Read-Only
        </div>
      )}

      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="bg-indigo-600 p-8 text-white">
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  {isExecutionMode ? 'Synchronize Progress' : 'Checklist Identification'}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Lattice Persistence</p>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Checklist Name</label>
                  <input
                    value={checklistName}
                    onChange={(e) => setChecklistName(e.target.value)}
                    placeholder="Enter checklist name..."
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                {!isExecutionMode && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description (What is this for?)</label>
                    <textarea
                      value={checklistDescription}
                      onChange={(e) => setChecklistDescription(e.target.value)}
                      placeholder="Describe the purpose of this checklist..."
                      className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all min-h-[120px] resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-8 pt-0 flex items-center justify-between">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isSaving}
                  className="px-10 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {isSaving ? 'Synchronizing...' : (isExecutionMode ? 'Save and Continue' : 'Commit Save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`bg-white border-b border-gray-100 z-30 mb-10 shadow-sm ${isExecutionMode ? '' : 'sticky top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-0 sm:h-20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => {
                const basePath = userRole.toLowerCase().includes('admin') ? '/admin' : '/User';
                if (instanceId) {
                  router.push(`/Workflows/instances/${instanceId}`);
                } else if (source === 'workflow_details' && workflowDetailsId) {
                  router.push(`/admin/workflows/${workflowDetailsId}`);
                } else if (source === 'allchecks') {
                  router.push(`${basePath}/AllCheck`);
                } else if (designerWorkflowId || fromWorkflow) {
                  router.push(`${basePath}/Create_workflows?id=${designerWorkflowId}`);
                } else {
                  router.push(`${basePath}/AllCheck`);
                }
              }}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 shrink-0"
              title={designerWorkflowId ? "Back to Workflow" : "Back to Management"}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase truncate">
                {isExecutionMode ? 'Protocol Execution' : 'Checklist Designer'}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1 truncate">
                {isLoading ? 'Loading Knowledge Schema...' : (isExecutionMode ? `Instance: ${instanceId}` : (checklistId ? 'Architecture' : 'Provisioning New Schema'))}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {!isExecutionMode && (designerWorkflowId || fromWorkflow) && (
              <button 
                onClick={() => {
                  const basePath = userRole.toLowerCase().includes('admin') ? '/admin' : '/User';
                  if (source === 'workflow_details' && workflowDetailsId) {
                    router.push(`/admin/workflows/${workflowDetailsId}`);
                  } else if (source === 'allchecks') {
                    router.push(`${basePath}/AllCheck`);
                  } else {
                    router.push(`${basePath}/Create_workflows?id=${designerWorkflowId}`);
                  }
                }}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 active:scale-95 transition-all border border-slate-200 shadow-sm whitespace-nowrap"
              >
                <ChevronLeft size={16} /> <span className="hidden xs:inline">Back to Workflow</span><span className="xs:hidden">Workflow</span>
              </button>
            )}
            {isConsult ? (
              <button 
                onClick={() => router.back()} 
                className="flex items-center gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 active:scale-95 transition-all shadow-xl shadow-slate-100 whitespace-nowrap"
              >
                <ChevronLeft size={18} />
                Return to Workflow
              </button>
            ) : (
              <button 
                onClick={handleSave} 
                disabled={isSaving || isLoading} 
                className="flex items-center gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 whitespace-nowrap"
              >
                {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : (isExecutionMode ? <CheckSquare size={18} /> : <Save size={18} />)}
                {isSaving ? 'Saving...' : (isExecutionMode ? 'Synchronize' : 'Save Checklist')}
              </button>
            )}
          </div>
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
                {isExecutionMode ? (
                   <h2 className="text-3xl font-black text-slate-800 tracking-tight">{checklistName}</h2>
                ) : (
                  <input
                    value={checklistName}
                    onChange={(e) => setChecklistName(e.target.value)}
                    className="text-3xl font-black text-slate-800 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none w-full transition-all"
                    placeholder="Untitled Checklist..."
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                <select
                  value={checklistStatus}
                  onChange={(e) => setChecklistStatus(e.target.value as any)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border appearance-none cursor-pointer transition-all ${checklistStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-slate-50 text-slate-600 border-slate-100'
                    }`}
                >
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                </select>

                {!isExecutionMode && !isConsult && (
                  <button
                    onClick={addTask}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm whitespace-nowrap active:scale-95"
                  >
                    <Plus size={18} /> Add new Task
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-50 mb-10"></div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {tasks.map(task => (
                    <SortableTask key={task.id} task={task} onUpdate={updateTask} onDelete={isExecutionMode ? undefined : deleteTask} isConsult={isConsult} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-32 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No valid task sequence identified</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
            
            {isExecutionMode && !isConsult && (
              <div className="mt-12 flex flex-col items-center p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                     <CheckSquare className="w-6 h-6" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-black text-slate-800 uppercase tracking-tight">Protocol Verification</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                       {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
                     </p>
                   </div>
                 </div>
                 <button 
                  onClick={handleSave}
                  className="w-full max-w-sm py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                 >
                   Synchronize and Finalize
                 </button>
              </div>
            )}

            {isConsult && (
              <div className="mt-12 flex flex-col items-center p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100">
                     <AlertCircle className="w-8 h-8" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-black text-slate-800 uppercase tracking-tight">Consultation Complete</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                       Checklist values are read-only in this view
                     </p>
                   </div>
                 </div>
                 <button 
                  onClick={() => router.back()}
                  className="w-full max-w-sm py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-100 active:scale-95"
                 >
                   Return to Instance
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
