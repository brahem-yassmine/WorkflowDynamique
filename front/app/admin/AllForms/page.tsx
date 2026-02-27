"use client";

const API_URL = 'http://localhost:5000/api';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Copy, 
  Edit3, 
  Trash2, 
  Search, 
  MoreVertical,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

interface Form {
  _id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'approved' | 'rejected';
  submissionCount: number;
  createdAt: string;
}

export default function AllFormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchForms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const tenant = localStorage.getItem('tenant') ? JSON.parse(localStorage.getItem('tenant') || 'null') : null;
      const tenantId = localStorage.getItem('tenantId') || tenant?._id || user?.tenantId;

      const response = await axios.get('http://localhost:5000/api/forms', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (response.data.success) {
        setForms(response.data.data);
      }
    } catch (error) {
      console.error("Fetch forms error:", error);
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleClone = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
      const tenantId = localStorage.getItem('tenantId') || tenant?._id || user?.tenantId;

      const response = await axios.post(`http://localhost:5000/api/forms/${id}/clone`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (response.data.success) {
        toast.success("Form cloned successfully!");
        fetchForms();
      }
    } catch (error) {
      toast.error("Failed to clone form");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
      const tenantId = localStorage.getItem('tenantId') || tenant?._id || user?.tenantId;

      const response = await axios.delete(`http://localhost:5000/api/forms/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (response.data.success) {
        toast.success("Form deleted");
        setForms(forms.filter(f => f._id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete form");
    }
  };

  const filteredForms = forms.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Toaster position="top-right" richColors />
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-indigo-600"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">All Forms</h1>
              <p className="text-xs text-gray-500 font-medium">Manage and monitor your dynamic workflows</p>
            </div>
          </div>

          <Link 
            href="/form"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Create New Form
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search forms by name or description..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">No forms found</h2>
            <p className="text-gray-500 mt-2 max-w-sm mb-8">Start by creating your first dynamic form to automate your workflow.</p>
            <Link 
              href="/form"
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Start Building
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <div 
                key={form._id} 
                className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all relative overflow-hidden flex flex-col h-full"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    form.status === 'published' || form.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : form.status === 'rejected'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {form.status === 'published' || form.status === 'approved' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : form.status === 'rejected' ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {form.status || 'Draft'}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(form.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate mb-1">
                  {form.name}
                </h3>
                <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-6 flex-1">
                  {form.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Submissions</span>
                    <span className="text-lg font-black text-gray-800">{form.submissionCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleClone(form._id)}
                      className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Clone Form"
                    >
                      <Copy className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => router.push(`/form?id=${form._id}`)}
                      className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit Form"
                    >
                      <Edit3 className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(form._id)}
                      className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Form"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                    <Link 
                      href={`/form/form2?id=${form._id}`}
                      className="ml-2 w-9 h-9 bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                      title="View Interactive"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
