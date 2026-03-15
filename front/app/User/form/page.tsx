'use client';

const API_URL = 'http://localhost:5000/api';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FileText, Type, Hash, Calendar, CheckSquare, PenTool, AlignLeft, List,
  GripVertical, Trash2, Mail, Phone, Settings, Move,
  Clock, ThumbsUp, ThumbsDown, Maximize2, Minimize2, Save, Plus, ArrowRight, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { apiService } from '@/service/api.service';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

const STEP_STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'approved', label: 'Approved', icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { id: 'rejected', label: 'Rejected', icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
];

const FIELD_TYPES = [
  { id: 'text', label: 'Text Field', icon: Type, description: 'Short text (names, titles)' },
  { id: 'email', label: 'Email', icon: Mail, description: 'Validated email format' },
  { id: 'phone', label: 'Phone Number', icon: Phone, description: 'Global phone numbers' },
  { id: 'number', label: 'Number', icon: Hash, description: 'Quantities or numerical IDs' },
  { id: 'textarea', label: 'Text Area', icon: AlignLeft, description: 'Multi-line descriptions' },
  { id: 'select', label: 'Dropdown List', icon: List, description: 'Single choice from a list' },
  { id: 'date', label: 'Date', icon: Calendar, description: 'Calendar date selection' },
  { id: 'signature', label: 'Signature', icon: PenTool, description: 'Digital sign or file upload' },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Multiple choices ' },
];

const PREVIEWS: Record<string, (f: any) => React.ReactNode> = {
  textarea: (f) => <textarea className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed resize-none" rows={2} placeholder={f.placeholder || "Textarea preview..."} readOnly />,
  select: (f) => (
    <div className="relative">
      <select className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 outline-none appearance-none cursor-not-allowed" disabled>
        <option value="">{f.placeholder || 'Select an option...'}</option>
        {(f.options || []).map((o: string, i: number) => <option key={i} value={o}>{o}</option>)}
      </select>
      <List className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
    </div>
  ),
  checkbox: (f) => (
    <div className="space-y-2 p-1">
      {(f.options || []).length > 0 ? (f.options || []).map((o: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 rounded border-2 border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed" disabled />
          <span className="text-sm text-gray-400">{o || 'Option'}</span>
        </div>
      )) : <div className="text-xs text-gray-300 italic">No options defined</div>}
    </div>
  ),
  signature: () => (
    <div className="space-y-2">
      <label 
        htmlFor="builder-sig-test"
        className="w-full h-24 border-2 border-gray-100 border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50 group/sig hover:bg-indigo-50/30 transition-all relative overflow-hidden cursor-pointer block"
      >
        <div className="flex flex-col items-center transition-all group-hover/sig:-translate-y-2">
          <PenTool className="w-6 h-6 text-indigo-300 mb-1" />
          <p className="text-[10px] text-gray-400 italic font-medium text-center px-4">Signature / Upload</p>
        </div>
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center translate-y-8 group-hover/sig:translate-y-0 opacity-0 group-hover/sig:opacity-100 transition-all">
          <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-tight shadow-md flex items-center gap-1.5 backdrop-blur-sm">
            <Plus className="w-2.5 h-2.5" /> Select Local File
          </div>
        </div>
      </label>
      <input 
        id="builder-sig-test" 
        type="file" 
        className="hidden" 
        accept="image/*,.pdf" 
        onChange={() => toast.info("File selector triggered successfully!", { description: "Testing trigger only. Upload works in Preview mode." })}
      />
    </div>
  ),
  default: (f) => <input type="text" className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed" placeholder={f.placeholder || `Enter ${f.type}...`} readOnly />
};

function SortableField({ field, onUpdate, onRemove, isAlone }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const [showSettings, setShowSettings] = useState(false);
  const Icon = FIELD_TYPES.find(t => t.id === field.type)?.icon || Type;
  const isWidthHalf = field.width === 'half';

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 1 }}
      className={`bg-white border rounded-2xl p-4 hover:shadow-lg transition-all relative group ${isAlone ? 'md:col-span-2' : ''} ${isDragging ? 'ring-2 ring-indigo-500 shadow-xl' : ''}`}>
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 text-gray-300 hover:text-indigo-600 transition-colors cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-1.5 bg-indigo-50 rounded-lg"><Icon className="w-3.5 h-3.5 text-indigo-600" /></div>
              <input 
                type="text"
                className="text-sm font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-0 w-full p-0"
                value={field.label || ''}
                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                placeholder="Unnamed Field"
              />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onUpdate(field.id, { width: isWidthHalf ? 'full' : 'half' })} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 rounded-lg">{isWidthHalf ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}</button>
              {['select', 'checkbox'].includes(field.type) && (
                <button 
                  onClick={() => onUpdate(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                  className="p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                  title="Add Option"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded-lg ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}><Settings className="w-3.5 h-3.5" /></button>
              <button onClick={() => onRemove(field.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="mb-3">{(PREVIEWS[field.type] || PREVIEWS.default)(field)}</div>

          {['select', 'checkbox'].includes(field.type) && (
            <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Manage Options</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {(field.options || []).map((o: string, idx: number) => (
                  <div key={idx} className="flex gap-1 group/opt">
                    <input value={o} onChange={(e) => { const n = [...field.options]; n[idx] = e.target.value; onUpdate(field.id, { options: n }); }} className="flex-1 text-xs p-1.5 border border-indigo-100 rounded-lg bg-white outline-none focus:border-indigo-400 transition-all" placeholder={`Option ${idx + 1}`} />
                    <button onClick={() => onUpdate(field.id, { options: field.options.filter((_: any, i: number) => i !== idx) })} className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSettings && (
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1.5">Field Label</label>
                  <input type="text" className="w-full p-2 bg-white border border-indigo-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200" value={field.label || ''} onChange={(e) => onUpdate(field.id, { label: e.target.value })} placeholder="Enter label..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1.5">Placeholder</label>
                  <input type="text" className="w-full p-2 bg-white border border-indigo-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200" value={field.placeholder || ''} onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })} placeholder="Enter helper text..." />
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-white border border-indigo-100 rounded-lg">
                <span className="text-xs font-medium text-gray-600">Required Field</span>
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600" checked={field.required} onChange={(e) => onUpdate(field.id, { required: e.target.checked })} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DraggableSidebarItem({ t }: any) {
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `add-field-${t.id}`,
    data: { type: t, isSidebar: true }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-4 p-4 border-2 border-slate-50 rounded-2xl cursor-grab active:cursor-grabbing hover:border-indigo-100 hover:bg-indigo-50/30 text-left group transition-all ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none">
        <t.icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col pointer-events-none">
        <span className="text-xs font-black text-slate-700 uppercase tracking-wide leading-none">{t.label}</span>
        <span className="text-[9px] text-slate-400 font-bold mt-1 tracking-tight">{t.description}</span>
      </div>
    </div>
  );
}

export function DroppableArea({ children, isEmpty }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-drop-zone',
  });
  return (
    <div ref={setNodeRef} className={`flex-1 p-8 ${isOver && isEmpty ? 'bg-indigo-50/30 ring-2 ring-indigo-400 rounded-3xl transition-all' : ''}`}>
      {children}
    </div>
  );
}

interface Field {
  id: string;
  type: string;
  label: string;
  required: boolean;
  width: string;
  placeholder?: string;
  options?: string[];
}

interface Step {
  id: string;
  title: string;
  fields: Field[];
  status: 'pending' | 'approved' | 'rejected';
}

const FormBuilderContent = () => {
  const [steps, setSteps] = useState<Step[]>([{ id: 'step-1', title: 'New Step', fields: [], status: 'pending' }]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('New Form');
  const [formDescription, setFormDescription] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get('from');
  const designerWorkflowId = searchParams.get('designerWorkflowId');
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const [activeId, setActiveId] = useState<string | null>(null);
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setFormId(id);
      fetchFormData(id);
    }
  }, [searchParams]);

  const fetchFormData = async (id: string) => {
    try {
      const res = await apiService.request(`/forms/${id}`);
      if (res.success) {
        setSteps(res.data.steps || []);
        setFormName(res.data.name || 'New Form');
        setFormDescription(res.data.description || '');
      }
    } catch (error: any) {
      console.error("Error fetching form:", error);
      toast.error("Failed to load form data: " + error.message);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    if (String(active.id).startsWith('add-field-')) {
      const typeId = String(active.id).replace('add-field-', '');
      const typeObj = FIELD_TYPES.find(t => t.id === typeId);
      if (!typeObj) return;

      const f = { 
        id: `${typeObj.id}-${Date.now()}`, 
        type: typeObj.id, 
        label: typeObj.label, 
        required: false, 
        width: 'half', 
        options: ['select', 'checkbox'].includes(typeObj.id) ? ['Option 1'] : undefined 
      };

      setSteps(prev => prev.map((s, i) => {
        if (i !== currentStepIndex) return s;
        const newFields = [...s.fields];
        if (over.id === 'form-drop-zone') {
          newFields.push(f);
        } else {
          const insertIndex = newFields.findIndex((cf: any) => cf.id === over.id);
          if (insertIndex !== -1) {
            newFields.splice(insertIndex, 0, f);
          } else {
            newFields.push(f);
          }
        }
        return { ...s, fields: newFields };
      }));
      return;
    }

    if (active.id !== over.id) {
      setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, fields: arrayMove(s.fields, s.fields.findIndex((f: any) => f.id === active.id), s.fields.findIndex((f: any) => f.id === over?.id)) } : s));
    }
  };

  const addField = (type: any) => {
    const f = { id: `${type.id}-${Date.now()}`, type: type.id, label: type.label, required: false, width: 'half', options: ['select', 'checkbox'].includes(type.id) ? ['Option 1'] : undefined };
    setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, fields: [...s.fields, f] } : s));
  };

  const handleSave = async (shouldNavigate: boolean = false) => {
    setIsSaving(true);
    try {
      const payload = {
        name: formName || `Form Template ${new Date().toLocaleDateString()}`,
        description: formDescription,
        steps: steps.map((s, i) => ({
          ...s,
          order: i,
          fields: s.fields.map((f, fi) => ({ ...f, order: fi }))
        }))
      };

      const method = formId ? 'PATCH' : 'POST';
      const url = formId ? `/forms/${formId}` : '/forms';

      const res = await apiService.request(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.success) {
        toast.success(formId ? "Architecture updated!" : "Architecture saved!");
        const newId = formId || res.data?._id;
        
        if (!formId && res.data?._id) {
          setFormId(res.data._id);
        }

        if (shouldNavigate && newId) {
          router.push(`/form/form2?id=${newId}&from=user${designerWorkflowId ? `&designerWorkflowId=${designerWorkflowId}` : ''}`);
        } else if (!formId && res.data?._id) {
          // If just saving new form without Next, update URL
          router.push(`/User/form?id=${res.data._id}&from=user${designerWorkflowId ? `&designerWorkflowId=${designerWorkflowId}` : ''}`, { scroll: false });
        }
      }
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateField = (id: string, updates: any) => {
    setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, fields: s.fields.map((f: any) => f.id === id ? { ...f, ...updates } : f) } : s));
  };

  const handleRemoveField = (id: string) => {
    setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, fields: s.fields.filter((f: any) => f.id !== id) } : s));
  };

  const renderFields = () => {
    const res = [];
    let i = 0;
    while (i < currentStep.fields.length) {
      const f: any = currentStep.fields[i];
      const next: any = currentStep.fields[i + 1];
      const paired = f.width === 'half' && next?.width === 'half';

      res.push(<SortableField key={f.id} field={f} isAlone={!paired} onUpdate={handleUpdateField} onRemove={handleRemoveField} />);
      if (paired) {
        res.push(<SortableField key={next.id} field={next} isAlone={false} onUpdate={handleUpdateField} onRemove={handleRemoveField} />);
        i += 2;
      } else {
        i++;
      }
    }
    return res;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" richColors />
      <div className="bg-indigo-600 text-white z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (designerWorkflowId) {
                    router.push(`/User/create_workflows?id=${designerWorkflowId}`);
                } else {
                  router.push(from === 'user' ? "/User/Allforms" : "/admin/AllForms");
                }
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
              title={designerWorkflowId ? "Back to Workflow" : "Back to All Forms"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white/10 rounded-xl shrink-0">
                <FileText className="w-5 h-5 text-indigo-100" />
              </div>
              <div className="flex flex-col min-w-0">
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-transparent border-none outline-none text-lg sm:text-xl font-black text-white placeholder:text-indigo-300 w-full p-0 focus:ring-0 leading-tight truncate"
                  placeholder="Untitled Protocol"
                />
                <input 
                  type="text" 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="bg-transparent border-none outline-none text-[9px] sm:text-[10px] font-bold text-indigo-200 uppercase tracking-widest opacity-70 w-full p-0 focus:ring-0 truncate"
                  placeholder="Add form description..."
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            {designerWorkflowId && (
              <button 
                onClick={() => router.push(`/User/create_workflows?id=${designerWorkflowId}`)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-white/20 transition-all shadow-sm whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Back to Workflow</span><span className="xs:hidden">Workflow</span>
              </button>
            )}
            <button 
              onClick={() => handleSave(true)} 
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold text-sm hover:bg-indigo-400 transition-all shadow-sm whitespace-nowrap"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleSave(false)} 
              disabled={isSaving} 
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 whitespace-nowrap ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isSaving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 w-full flex-1">
        <div className="mb-4 flex gap-2 overflow-x-auto p-1">
          {steps.map((s, i) => (
            <button 
              key={s.id} 
              onClick={() => setCurrentStepIndex(i)} 
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                currentStepIndex === i 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-600'
              }`}
            >
              Step {i + 1}
            </button>
          ))}
          <button 
            onClick={() => setSteps([...steps, { id: `step-${Date.now()}`, title: 'New Step', fields: [], status: 'pending' }])}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3">
              <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 sticky top-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Plus className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Components</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {FIELD_TYPES.map(t => (
                    <DraggableSidebarItem key={t.id} t={t} />
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-9">
              <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[600px] flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white text-indigo-600 rounded-[20px] shadow-lg shadow-indigo-100 flex items-center justify-center font-black text-lg border border-indigo-50">
                      {currentStepIndex + 1}
                    </div>
                    <div className="flex flex-col">
                      <input 
                        value={currentStep.title} 
                        onChange={(e) => setSteps(p => p.map((s, i) => i === currentStepIndex ? { ...s, title: e.target.value } : s))} 
                        className="text-lg font-black text-slate-800 uppercase tracking-widest bg-transparent border-none outline-none focus:ring-0 p-0"
                        placeholder="STEP TITLE"
                      />
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-0.5">Define interaction logic here</span>
                    </div>
                  </div>
                  {steps.length > 1 && (
                    <button 
                      onClick={() => {
                        const n = steps.filter((_, i) => i !== currentStepIndex);
                        setSteps(n);
                        setCurrentStepIndex(Math.max(0, currentStepIndex - 1));
                      }} 
                      className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                      title="Remove Step"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <DroppableArea isEmpty={currentStep.fields.length === 0}>
                  <SortableContext items={currentStep.fields.map(f => f.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderFields()}
                      {currentStep.fields.length === 0 && (
                        <div className="col-span-2 h-64 border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-400 gap-4 transition-all">
                          <div className="p-4 bg-white rounded-[24px] shadow-xl shadow-slate-100 transition-transform">
                            <Plus size={32} />
                          </div>
                          <p className="font-black text-[10px] uppercase tracking-[0.3em]">Drop components here</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableArea>
              </div>
            </div>
          </div>
          <DragOverlay>
            {activeId && activeId.startsWith('add-field-') ? (() => {
              const tId = activeId.replace('add-field-', '');
              const t = FIELD_TYPES.find(x => x.id === tId);
              if (!t) return null;
              return (
                <div className="flex items-center gap-4 p-4 border-2 border-indigo-100 bg-white shadow-xl rounded-2xl cursor-grabbing scale-105 opacity-90 w-full max-w-xs">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide leading-none">{t.label}</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-1 tracking-tight">{t.description}</span>
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default function FormBuilder() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <FormBuilderContent />
    </React.Suspense>
  );
}
