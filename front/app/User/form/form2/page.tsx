'use client';


import React, { useState, useEffect } from 'react';
import {
  FileText, Type, Hash, Calendar, CheckSquare, PenTool, AlignLeft, List,
  ArrowLeft, Send, CheckCircle2, Clock, Mail, Phone, Trash2
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import TaskExecutionPanel from '../../../Workflows/_components/TaskExecutionPanel';
import { apiService } from '@/service/api.service';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_ICONS: Record<string, any> = {
  text: Type, email: Mail, phone: Phone, number: Hash,
  textarea: AlignLeft, select: List, date: Calendar,
  signature: PenTool, checkbox: CheckSquare
};

const Form2PageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const instanceId = searchParams.get('instanceId');
  const nodeId = searchParams.get('nodeId');
  const formId = searchParams.get('formId') || searchParams.get('id');
  const workflowId = searchParams.get('workflowId');
  const designerWorkflowId = searchParams.get('designerWorkflowId');

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionName, setSubmissionName] = useState('New Response');
  const [submissionDescription, setSubmissionDescription] = useState('');

  // Workflow Integration State
  const [instance, setInstance] = useState<any>(null);
  const [currentNode, setCurrentNode] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Form
      if (formId) {
        // Use a generic request if specific getFormById doesn't exist or just to stay flexible
        const res = await apiService.request(`/forms/${formId}`);
        if (res.success) {
          setForm(res.data);
        }
      } else {
        const res = await apiService.getForms();
        if (res.success && res.data.length > 0) {
          setForm(res.data[0]);
        }
      }

      // 2. Fetch Workflow Instance if applicable
      if (instanceId) {
        const instanceRes = await apiService.getInstance(instanceId);
        if (instanceRes.success) {
          setInstance(instanceRes.data);
          // Find the node
          const nodes = instanceRes.data.workflowId?.nodes || [];
          const node = nodes.find((n: any) => n.id === nodeId);
          setCurrentNode(node);
        }
      }
    } catch (error: any) {
      console.error("Fetch Data Error:", error);
      // Only toast if it's not a expected 404 or empty
      if (error.message !== 'Not authenticated') {
        toast.error("Error loading data: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [instanceId, nodeId, formId]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: string, file: File | null) => {
    if (!file) return;

    // Check if image or PDF
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return toast.error("Only images and PDF files are allowed.");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange(fieldId, {
        name: file.name,
        type: file.type,
        data: reader.result, // Base64 string
        size: file.size
      });
      toast.success(`${file.name} uploaded!`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form?._id) return toast.error("Form ID missing.");
    setIsSubmitModalOpen(true);
  };

  const confirmSubmit = async () => {
    if (!form?._id) return toast.error("Form ID missing.");
    if (!submissionName.trim()) return toast.error("Veuillez saisir un nom pour cette soumission.");

    setIsSubmitting(true);
    try {
      const res = await apiService.request(`/forms/${form._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ 
          data: formData,
          name: submissionName,
          description: submissionDescription
        })
      });

      if (res.success) {
        toast.success("Form submitted successfully!");
        setIsSubmitModalOpen(false);
        
        // Dynamic redirection based on context
        if (designerWorkflowId) {
          router.push(`/User/create_workflows?id=${designerWorkflowId}`);
        } else if (instanceId === 'new') {
          router.push(`/Workflows/instances/new?workflowId=${workflowId}`);
        } else if (instanceId) {
          router.push(`/Workflows/instances/${instanceId}`);
        } else {
          router.push('/User/Allforms');
        }
      }
    } catch (error: any) {
      toast.error("Submission failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!form?._id) return toast.error("Form ID missing.");

    try {
      const res = await apiService.request(`/forms/${form._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      if (res.success) {
        setForm(res.data);
        toast.success(`Form ${status === 'approved' ? 'Approved' : 'Rejected'}!`);
      }
    } catch (error: any) {
      toast.error("Status update failed: " + error.message);
    }
  };

  if (loading) return (
    <div key="loading-state" className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Clock className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading interactive form...</p>
      </div>
    </div>
  );

  if (!form) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No form found. Please create one first.</p>
        <Link href="/form" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Go to Builder</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Toaster position="top-right" richColors />

      <AnimatePresence>
        {!!isSubmitModalOpen && (
          <div key="submit-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
            >
              {/* Modal Header */}
              <div key="modal-header" className="bg-indigo-600 p-8 text-white">
                <h2 className="text-2xl font-black tracking-tight uppercase">Workflow Identification</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Lattice Persistence</p>
              </div>

              {/* Modal Body */}
              <div key="modal-body" className="p-8 space-y-8">
                <div key="name-group" className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Submission Title</label>
                  <input 
                    value={submissionName}
                    onChange={(e) => setSubmissionName(e.target.value)}
                    placeholder="E.g., Quarterly Report, Maintenance Request..."
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div key="desc-group" className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes / Context</label>
                  <textarea 
                    value={submissionDescription}
                    onChange={(e) => setSubmissionDescription(e.target.value)}
                    placeholder="Add any additional context for this submission..."
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all min-h-[120px] resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div key="modal-footer" className="p-8 pt-0 flex items-center justify-between">
                <button 
                  key="discard-btn"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className="px-10 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {isSubmitting ? 'Synchronizing...' : 'Commit Submission'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={
                designerWorkflowId ? `/User/create_workflows?id=${designerWorkflowId}` :
                instanceId === 'new' ? `/Workflows/instances/new?workflowId=${workflowId}` :
                instanceId ? `/Workflows/instances/${instanceId}` :
                "/User/Allforms"
              }
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {form?.name || "Interactive Workflow"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fillable Protocol • </p>
                {form.steps?.some((s: any) => s.status === 'approved') ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wider">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Validated
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200 uppercase tracking-wider">
                    <Clock className="w-2.5 h-2.5" /> In Progress
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStatusUpdate('approved')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate('rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-sm"
            >
              Reject
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
            >
              {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {form.steps?.map((step: any, sIdx: number) => (
          <div key={step.id || `step-${sIdx}`} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${sIdx * 100}ms` }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md shadow-indigo-100">
                {sIdx + 1}
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Partie {sIdx + 1}</h2>
              <div className="flex-1 h-[2px] bg-slate-100 ml-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {step.fields?.map((field: any, fIdx: number) => {
                const Icon = FIELD_ICONS[field.type] || Type;
                const isFull = field.width !== 'half';
                return (
                  <div key={field.id || `field-${sIdx}-${fIdx}`} className={`${isFull ? 'md:col-span-2' : ''} space-y-2`}>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 px-1">
                      <Icon className="w-3.5 h-3.5 text-indigo-500" />
                      {field.label}
                      {!!field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        key={`textarea-${field.id}`}
                        className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm min-h-[120px]"
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                      />
                    ) : field.type === 'select' ? (
                      <div key={`select-container-${field.id}`} className="relative group">
                        <select
                          className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm appearance-none bg-white cursor-pointer"
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                        >
                          <option value="">{field.placeholder || "Please select..."}</option>
                          {field.options?.map((opt: string, i: number) => (
                            <option key={`${field.id}-opt-${i}`} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <List className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-500 pointer-events-none transition-colors" />
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div key={`checkbox-container-${field.id}`} className="p-4 bg-white border-2 border-gray-100 rounded-2xl space-y-3">
                        {field.options?.map((opt: string, i: number) => (
                          <label key={`${field.id}-check-${i}`} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-2 border-gray-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                              checked={(formData[field.id] || []).includes(opt)}
                              onChange={(e) => {
                                const current = formData[field.id] || [];
                                const next = e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt);
                                handleChange(field.id, next);
                              }}
                            />
                            <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600 transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'signature' ? (
                      <div key={`signature-container-${field.id}`} className="space-y-3">
                        <label
                          htmlFor={`file-${field.id}`}
                          className="w-full aspect-video md:aspect-auto md:h-40 border-2 border-gray-100 border-dashed rounded-2xl bg-white flex flex-col items-center justify-center group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer relative overflow-hidden block"
                        >
                          {formData[field.id]?.data ? (
                            <div key="signature-preview" className="absolute inset-0 flex flex-col items-center justify-center bg-white p-4">
                              {formData[field.id].type === 'application/pdf' ? (
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="w-12 h-12 text-red-500" />
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate max-w-full px-2">{formData[field.id].name}</p>
                                </div>
                              ) : (
                                <img src={formData[field.id].data} alt="Signature Preview" className="max-h-full object-contain pointer-events-none" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChange(field.id, null); }}
                                className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors z-20"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <React.Fragment key="signature-upload-ui">
                              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <PenTool className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-xs text-gray-400 font-medium text-center px-4 leading-relaxed group-hover:text-indigo-500 transition-colors">
                                  Click to upload your signature<br />
                                  <span className="text-[10px] text-gray-300 font-normal mt-1 block">(PNG, JPG or PDF)</span>
                                </p>
                              </div>
                              <div className="absolute inset-x-0 bottom-4 px-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex justify-center gap-2">
                                <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-100">
                                  Choose Local File
                                </div>
                              </div>
                            </React.Fragment>
                          )}
                        </label>
                        <input
                          id={`file-${field.id}`}
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(field.id, e.target.files?.[0] || null)}
                        />
                      </div>
                    ) : (
                      <input
                        key={`input-generic-${field.id}`}
                        type={field.type}
                        className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Success Footer */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center mt-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-900">Ready to submit?</h3>
            <p className="text-sm text-indigo-600 mt-1">Make sure all required fields are filled correctly before sending.</p>
          </div>
          <button
            onClick={handleSubmit}
            className="mt-2 w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Final Submission
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Form2Page() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading form...</div>}>
      <Form2PageContent />
    </React.Suspense>
  );
}
