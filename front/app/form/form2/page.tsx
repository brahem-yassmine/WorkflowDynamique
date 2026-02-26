'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, Type, Hash, Calendar, CheckSquare, PenTool, AlignLeft, List,
  ArrowLeft, Send, CheckCircle2, Clock, Mail, Phone
} from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TaskExecutionPanel from '../../Workflows/_components/TaskExecutionPanel';
import { apiService } from '@/service/api.service';
import { AnimatePresence } from 'framer-motion';

const FIELD_ICONS: Record<string, any> = {
  text: Type, email: Mail, phone: Phone, number: Hash,
  textarea: AlignLeft, select: List, date: Calendar,
  signature: PenTool, checkbox: CheckSquare
};

export default function Form2Page() {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('instanceId');
  const nodeId = searchParams.get('nodeId');

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Workflow Integration State
  const [instance, setInstance] = useState<any>(null);
  const [currentNode, setCurrentNode] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Form
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const tenantId = tenant?._id || user?.tenantId;

      const res = await axios.get('http://localhost:5000/api/forms', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });

      if (res.data.success && res.data.data.length > 0) {
        setForm(res.data.data[0]);
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
    } catch (error) {
      toast.error("Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [instanceId, nodeId]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    if (!form?._id) return toast.error("Form ID missing.");

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = tenant?._id || user?.tenantId;

      const res = await axios.post(`http://localhost:5000/api/forms/${form._id}/submit`,
        { data: formData },
        { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );

      if (res.data.success) {
        toast.success("Form submitted successfully!");
      }
    } catch (error: any) {
      toast.error("Submission failed: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!form?._id) return toast.error("Form ID missing.");

    try {
      const token = localStorage.getItem('auth_token');
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = tenant?._id || user?.tenantId;

      const res = await axios.patch(`http://localhost:5000/api/forms/${form._id}/status`,
        { status },
        { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }
      );

      if (res.data.success) {
        setForm(res.data.data);
        toast.success(`Form ${status === 'approved' ? 'Approved' : 'Rejected'}!`);
      }
    } catch (error: any) {
      toast.error("Status update failed: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        {instanceId && currentNode && (
          <TaskExecutionPanel
            instance={instance}
            node={currentNode}
            onClose={() => { }}
            onRefresh={fetchData}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/form" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{form.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400">Interactive Mode • </p>
                {form.steps.some((s: any) => s.status === 'approved') ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wider">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                  </span>
                ) : form.steps.some((s: any) => s.status === 'rejected') ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-wider">
                    <Clock className="w-2.5 h-2.5" /> Rejected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200 uppercase tracking-wider">
                    <Clock className="w-2.5 h-2.5" /> Pending
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
        {form.steps.map((step: any, sIdx: number) => (
          <div key={step.id} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${sIdx * 100}ms` }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-100">
                {sIdx + 1}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{step.title}</h2>
              <div className="flex-1 h-px bg-gray-100 ml-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {step.fields.map((field: any) => {
                const Icon = FIELD_ICONS[field.type] || Type;
                const isFull = field.width !== 'half';

                return (
                  <div key={field.id} className={`${isFull ? 'md:col-span-2' : ''} space-y-2`}>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 px-1">
                      <Icon className="w-3.5 h-3.5 text-indigo-500" />
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm min-h-[120px]"
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                      />
                    ) : field.type === 'select' ? (
                      <div className="relative group">
                        <select
                          className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm appearance-none bg-white cursor-pointer"
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                        >
                          <option value="">{field.placeholder || "Please select..."}</option>
                          {field.options?.map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <List className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-500 pointer-events-none transition-colors" />
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl space-y-3">
                        {field.options?.map((opt: string, i: number) => (
                          <label key={i} className="flex items-center gap-3 cursor-pointer group">
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
                      <div className="w-full aspect-video md:aspect-auto md:h-40 border-2 border-gray-100 border-dashed rounded-2xl bg-white flex flex-col items-center justify-center group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-crosshair relative overflow-hidden">
                        <PenTool className="w-8 h-8 text-gray-200 mb-2 group-hover:text-indigo-300 transition-all" />
                        <p className="text-xs text-gray-400 group-hover:text-indigo-400 transition-all font-medium">Click to sign or drop signature image here</p>

                        <div className="absolute inset-x-0 bottom-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                          <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-indigo-100 uppercase tracking-wider">Sign Now</button>
                          <button className="px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">Upload PNG</button>
                        </div>
                      </div>
                    ) : (
                      <input
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
