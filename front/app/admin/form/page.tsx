'use client';

import React, { useState } from 'react';
import { 
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor
} from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {  
  FileText, Type, Hash, Calendar, CheckSquare, PenTool, AlignLeft, List, 
  GripVertical, Trash2, Mail, Phone, Settings, Move, 
  Clock, ThumbsUp, ThumbsDown, Maximize2, Minimize2, Save, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

const STEP_STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'approved', label: 'Approved', icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { id: 'rejected', label: 'Rejected', icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
];

const FIELD_TYPES = [
  { id: 'text', label: 'Text Field', icon: Type },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone Number', icon: Phone },
  { id: 'number', label: 'Number', icon: Hash },
  { id: 'textarea', label: 'Text Area', icon: AlignLeft },
  { id: 'select', label: 'Dropdown List', icon: List },
  { id: 'date', label: 'Date', icon: Calendar },
  { id: 'signature', label: 'Signature', icon: PenTool },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
];

interface FormField {
  id: string; type: string; label: string; placeholder?: string; required: boolean; options?: string[]; width?: 'full' | 'half';
}

interface Step {
  id: string; title: string; fields: FormField[]; status: 'pending' | 'approved' | 'rejected';
}

function SortableField({ field, onUpdate, onRemove, isAlone }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const Icon = FIELD_TYPES.find(t => t.id === field.type)?.icon || Type;
  const isWidthHalf = field.width === 'half';

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} 
         className={`bg-white border rounded-lg p-3 hover:shadow-md transition-shadow relative ${isAlone ? 'md:col-span-2' : ''}`}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-1 text-gray-400 hover:text-gray-600"><GripVertical className="w-3 h-3" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-2">
            <Icon className="w-3 h-3 text-indigo-600" />
            <input value={field.label} onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                   className="text-sm font-medium bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full" placeholder="Label" />
          </div>
          
          <div className="space-y-2">
            {field.type === 'textarea' ? (
              <textarea 
                className="w-full p-1.5 border rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                rows={2} 
                value={field.placeholder || ''} 
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="Edit placeholder..." 
              />
            ) : field.type === 'select' ? (
              <div className="space-y-2">
                <select className="w-full p-1.5 border rounded text-xs bg-gray-50 text-gray-500" disabled>
                  <option>{field.placeholder || 'Preview dropdown...'}</option>
                  {(field.options || []).map((opt: string, i: number) => (
                    <option key={i}>{opt}</option>
                  ))}
                </select>
                <div className="bg-gray-50 p-2 rounded-md border border-dashed">
                  <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Options</p>
                  <div className="space-y-1">
                    {(field.options || []).map((opt: string, idx: number) => (
                      <div key={idx} className="flex gap-1">
                        <input 
                          value={opt} 
                          onChange={(e) => {
                            const newOpts = [...(field.options || [])];
                            newOpts[idx] = e.target.value;
                            onUpdate(field.id, { options: newOpts });
                          }}
                          className="flex-1 text-[10px] p-1 border rounded bg-white"
                        />
                        <button 
                          onClick={() => {
                            const newOpts = (field.options || []).filter((_: any, i: number) => i !== idx);
                            onUpdate(field.id, { options: newOpts });
                          }}
                          className="text-red-400 hover:text-red-600 px-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => onUpdate(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium py-1 w-full text-center border border-indigo-100 rounded bg-white hover:bg-indigo-50 transition-colors"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              </div>
            ) : field.type === 'checkbox' ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  {(field.options || []).map((opt: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-1">
                      <input type="checkbox" className="rounded border-gray-300" disabled />
                      <span className="text-xs text-gray-600">{opt || 'Option'}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-2 rounded-md border border-dashed">
                  <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Checkbox Options</p>
                  <div className="space-y-1">
                    {(field.options || []).map((opt: string, idx: number) => (
                      <div key={idx} className="flex gap-1">
                        <input 
                          value={opt} 
                          onChange={(e) => {
                            const newOpts = [...(field.options || [])];
                            newOpts[idx] = e.target.value;
                            onUpdate(field.id, { options: newOpts });
                          }}
                          className="flex-1 text-[10px] p-1 border rounded bg-white"
                        />
                        <button 
                          onClick={() => {
                            const newOpts = (field.options || []).filter((_: any, i: number) => i !== idx);
                            onUpdate(field.id, { options: newOpts });
                          }}
                          className="text-red-400 hover:text-red-600 px-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => onUpdate(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium py-1 w-full text-center border border-indigo-100 rounded bg-white hover:bg-indigo-50 transition-colors"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              </div>
            ) : field.type === 'signature' ? (
              <div className="w-full h-12 border-2 border-dashed rounded flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 italic">
                Signature area
              </div>
            ) : (
              <input 
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                className="w-full p-1.5 border rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                value={field.placeholder || ''} 
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder={`Edit ${field.type} placeholder...`} 
              />
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <input type="checkbox" checked={field.required} onChange={(e) => onUpdate(field.id, { required: e.target.checked })} /> Required
            </label>
            <button onClick={() => onUpdate(field.id, { width: isWidthHalf ? 'full' : 'half' })} 
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors">
              {isWidthHalf ? 'Expand' : 'Shrink'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onRemove(field.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}

export default function FormBuilder() {
  const [steps, setSteps] = useState<Step[]>([{ id: 'step-1', title: 'New Step', fields: [], status: 'pending' }]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const currentStep = steps[currentStepIndex];

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setSteps(prev => {
        const newSteps = [...prev];
        const step = { ...newSteps[currentStepIndex] };
        const oldIdx = step.fields.findIndex(f => f.id === active.id);
        const newIdx = step.fields.findIndex(f => f.id === over?.id);
        step.fields = arrayMove(step.fields, oldIdx, newIdx);
        newSteps[currentStepIndex] = step;
        return newSteps;
      });
    }
  };

  const addField = (type: any) => {
    const newField: FormField = { 
      id: `${type.id}-${Date.now()}`, 
      type: type.id, 
      label: type.label, 
      required: false, 
      width: 'half' as 'half',
      options: type.id === 'select' || type.id === 'checkbox' ? ['Option 1'] : undefined
    };
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], fields: [...newSteps[currentStepIndex].fields, newField] };
      return newSteps;
    });
  };

  const updateField = (id: string, updates: any) => {
    setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, fields: s.fields.map(f => f.id === id ? { ...f, ...updates } : f) } : s));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');
      const tenantStr = localStorage.getItem('tenant');
      
      const user = userStr ? JSON.parse(userStr) : null;
      const tenant = tenantStr ? JSON.parse(tenantStr) : null;
      
      // ✅ Priorité au tenantId de l'objet tenant, puis au user.tenantId, puis au user._id
      const tenantId = tenant?._id || user?.tenantId || user?._id;
      
      if (!tenantId) {
        toast.error("Tenant ID missing. Please log in again.");
        setIsSaving(false);
        return;
      }
      
      const response = await axios.post('http://localhost:5000/api/forms', {
        name: steps[0].title || "Untitled Form",
        steps: steps,
        description: "Form created with Form Builder"
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });

      if (response.data.success) {
        toast.success('Form saved successfully!');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save form: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" richColors />
      <div className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><FileText className="w-5 h-5" /><h1 className="text-xl font-bold">Form Builder</h1></div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 w-full flex-1">
        <div className="mb-4 flex gap-2 overflow-x-auto p-1">
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => setCurrentStepIndex(i)} 
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${currentStepIndex === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 border'}`}>
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-3 sticky top-4">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-1"><Settings className="w-3 h-3" /> Fields</h2>
              <div className="space-y-1.5">
                {FIELD_TYPES.map(t => (
                  <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                       className="flex items-center gap-2 p-2 bg-white border rounded-lg cursor-move hover:border-indigo-300 hover:shadow-sm transition-all group text-sm">
                    <t.icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" /> {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-9 bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
              <input value={currentStep.title} onChange={(e) => setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, title: e.target.value } : s))}
                     className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-indigo-500 outline-none flex-1" />
              
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border">
                {STEP_STATUSES.map(s => {
                  const isActive = currentStep.status === s.id;
                  return (
                    <button key={s.id} onClick={() => setSteps(prev => prev.map((st, i) => i === currentStepIndex ? { ...st, status: s.id as any } : st))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isActive ? `${s.bg} ${s.color} border ${s.border}` : 'text-gray-400 hover:bg-gray-100'}`}>
                      <s.icon className="w-3.5 h-3.5" /> {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

              <div 
                className="p-4 min-h-[500px]" onDragOver={e => e.preventDefault()} onDrop={e => {
              const type = FIELD_TYPES.find(t => t.id === e.dataTransfer.getData('text/plain'));
              if (type) addField(type);
            }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentStep.fields.map(f => f.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentStep.fields.length ? (() => {
                      const elements = [];
                      let i = 0;
                      const fields = currentStep.fields;
                      while (i < fields.length) {
                        const f = fields[i];
                        const next = fields[i + 1];
                        const isPaired = f.width === 'half' && next?.width === 'half';
                        
                        if (isPaired) {
                          elements.push(
                            <SortableField key={f.id} field={f} isAlone={false} onUpdate={updateField} onRemove={(id: string) => setSteps(prev => {
                              const ns = [...prev];
                              ns[currentStepIndex].fields = ns[currentStepIndex].fields.filter(fi => fi.id !== id);
                              return ns;
                            })} />
                          );
                          elements.push(
                            <SortableField key={next.id} field={next} isAlone={false} onUpdate={updateField} onRemove={(id: string) => setSteps(prev => {
                              const ns = [...prev];
                              ns[currentStepIndex].fields = ns[currentStepIndex].fields.filter(fi => fi.id !== id);
                              return ns;
                            })} />
                          );
                          i += 2;
                        } else {
                          elements.push(
                            <SortableField key={f.id} field={f} isAlone={true} onUpdate={updateField} onRemove={(id: string) => setSteps(prev => {
                              const ns = [...prev];
                              ns[currentStepIndex].fields = ns[currentStepIndex].fields.filter(fi => fi.id !== id);
                              return ns;
                            })} />
                          );
                          i += 1;
                        }
                      }
                      return elements;
                    })() : (
                      <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed rounded-lg"><Move className="w-8 h-8 mb-2" /><p className="text-sm">Drag fields here</p></div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
