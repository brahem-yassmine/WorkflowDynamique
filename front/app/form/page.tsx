'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FileText, Type, Hash, Calendar, CheckSquare, PenTool, AlignLeft, List, 
  GripVertical, Trash2, Mail, Phone, Settings, Move, 
  Clock, ThumbsUp, ThumbsDown, Maximize2, Minimize2, Save, Plus, ArrowRight, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
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

export default function FormBuilder() {
  const [steps, setSteps] = useState<Step[]>([{ id: 'step-1', title: 'New Step', fields: [], status: 'pending' }]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
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
      const token = localStorage.getItem('auth_token');
      const tenantId = localStorage.getItem('tenantId');
      
      const res = await axios.get(`http://localhost:5000/api/forms/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (res.data.success) {
        setSteps(res.data.data.steps || []);
      }
    } catch (error) {
      console.error("Error fetching form:", error);
      toast.error("Failed to load form data");
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, fields: arrayMove(s.fields, s.fields.findIndex((f: any) => f.id === active.id), s.fields.findIndex((f: any) => f.id === over?.id)) } : s));
    }
  };

  const addField = (type: any) => {
    const f = { id: `${type.id}-${Date.now()}`, type: type.id, label: type.label, required: false, width: 'half', options: ['select', 'checkbox'].includes(type.id) ? ['Option 1'] : undefined };
    setSteps(prev => prev.map((s, i) => i === currentStepIndex ? { ...s, fields: [...s.fields, f] } : s));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
      const tenantId = localStorage.getItem('tenantId') || tenant?._id || user?.tenantId;
      
      if (!tenantId) {
        console.error("DEBUG: Tenant ID missing", { user, tenant });
        return toast.error("Tenant ID missing. Please log in again.");
      }
      
      const payload = { 
        name: steps[0]?.title || "Untitled Form", 
        steps, 
        description: "Form created with Form Builder" 
      };

      let res;
      if (formId) {
        // Update existing form
        res = await axios.put(`http://localhost:5000/api/forms/${formId}`, payload, {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'x-tenant-id': tenantId 
          }
        });
      } else {
        // Create new form
        res = await axios.post('http://localhost:5000/api/forms', payload, {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'x-tenant-id': tenantId 
          }
        });
      }

      if (res.data.success) {
        toast.success(formId ? 'Form updated!' : 'Form saved!');
        if (!formId && res.data.data?._id) {
           router.push(`/form?id=${res.data.data._id}`);
        }
      }
    } catch (e: any) { 
      toast.error('Save failed: ' + (e.response?.data?.message || e.message)); 
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
      <div className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/AllForms" 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Back to All Forms"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <h1 className="text-xl font-bold">Form Builder</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/form/form2" className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-400 transition-all shadow-sm">
              Next <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isSaving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 w-full flex-1">
        <div className="mb-4 flex gap-2 overflow-x-auto p-1">
          {steps.map((s, i) => <button key={s.id} onClick={() => setCurrentStepIndex(i)} className={`px-4 py-2 rounded-lg text-sm ${currentStepIndex === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border'}`}>{i + 1}. {s.title}</button>)}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-3 sticky top-4">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-1"><Settings className="w-3 h-3" /> Fields</h2>
              <div className="space-y-1.5">
                {FIELD_TYPES.map(t => (
                  <div 
                    key={t.id} 
                    draggable 
                    onDragStart={(e) => e.dataTransfer.setData('text', t.id)} 
                    className="flex flex-col gap-1 p-3 border rounded-xl cursor-move hover:border-indigo-300 hover:shadow-md text-sm group transition-all bg-white"
                  >
                    <div className="flex items-center gap-2">
                       <t.icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" /> 
                       <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{t.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight group-hover:text-gray-500">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-9 bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
              <input value={currentStep.title} onChange={(e) => setSteps(p => p.map((s, i) => i === currentStepIndex ? { ...s, title: e.target.value } : s))} className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-indigo-500 outline-none flex-1" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-yellow-50 text-yellow-500 border border-yellow-200">
                <Clock className="w-3.5 h-3.5" /> Pending
              </div>
            </div>

            <div className="p-4 min-h-[500px]" onDragOver={e => e.preventDefault()} onDrop={e => { const t = FIELD_TYPES.find(f => f.id === e.dataTransfer.getData('text')); if (t) addField(t); }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentStep.fields.map((f: any) => f.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentStep.fields.length ? renderFields() : <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed rounded-lg"><Move className="w-8 h-8 mb-2" /><p className="text-sm">Drag fields here</p></div>}
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
