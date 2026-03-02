"use client";

import React, { useEffect, useState } from 'react';
import { 
  ListTodo, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Filter,
  MoreVertical,
  ClipboardList,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { apiService } from '@/service/api.service';
import Link from 'next/link';

export default function AllChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const res = await apiService.getChecklists();
      if (res.success) {
        setChecklists(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChecklist = async (e: React.MouseEvent, id: string, instanceId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    // The user wants direct deletion without message
    try {
      // If there is an instanceId, delete the instance (which cascade deletes the checklist)
      // or just delete the checklist if it's standalone.
      let res;
      if (instanceId) {
        res = await apiService.deleteInstance(instanceId);
      } else {
        res = await apiService.deleteChecklist(id);
      }

      if (res.success) {
        setChecklists(prev => prev.filter(c => c._id !== id));
      } else {
        alert(res.message || 'Failed to delete checklist');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'An error occurred during deletion');
    }
  };

  const filteredChecklists = checklists.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 lg:p-12">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                <ListTodo size={28} strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">All CheckLists </h1>
            </div>
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
              Track real-time execution progress of checklists generated across all tactical workflow instances.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search matrices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-72 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardList size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Units</p>
              <h3 className="text-2xl font-black text-slate-900">{checklists.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed</p>
              <h3 className="text-2xl font-black text-slate-900">{checklists.filter(c => c.status === 'completed').length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Clock size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">In Progress</p>
              <h3 className="text-2xl font-black text-slate-900">{checklists.filter(c => c.status !== 'completed').length}</h3>
            </div>
          </div>
        </div>

        {/* Checklists Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanning Network...</p>
          </div>
        ) : filteredChecklists.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredChecklists.map((checklist) => {
              const progress = getProgress(checklist.tasks);
              return (
                <div 
                  key={checklist._id}
                  className="group bg-white border border-slate-100 rounded-[32px] p-8 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden flex flex-col h-full"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 ${checklist.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}></div>

                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 ${checklist.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <ListTodo size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleDeleteChecklist(e, checklist._id, checklist.instanceId)}
                        className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"
                      >
                        <Trash2 size={20} strokeWidth={2.5} />
                      </button>
                      <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <MoreVertical size={20} className="text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        checklist.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {checklist.status || 'Active'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight truncate">
                      {checklist.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {checklist.description || "No tactical objectives defined for this checkpoint matrix."}
                    </p>
                  </div>

                  {/* Progress Matrix */}
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Progress</p>
                      <p className="text-sm font-black text-slate-900">{progress}%</p>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                          checklist.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>{checklist.tasks?.filter((t: any) => t.completed).length || 0} Tasked</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-indigo-400" />
                        <span>{checklist.tasks?.length || 0} Total</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50">
                    <Link 
                      href={checklist.instanceId ? `/Workflows/instances/${checklist.instanceId}` : `/checklist/${checklist._id}`}
                      className="flex items-center justify-between w-full group/btn"
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover/btn:text-indigo-600 transition-colors">
                        {checklist.instanceId ? "View Workflow Task" : "View Detailed Log"}
                      </span>
                      <div className="p-2 bg-slate-50 text-slate-400 group-hover/btn:bg-indigo-600 group-hover/btn:text-white rounded-xl transition-all duration-300">
                        <ArrowRight size={18} />
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-24 text-center">
            <div className="inline-flex p-6 bg-slate-50 rounded-full text-slate-300 mb-6">
              <AlertCircle size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">No Tactical Data Found</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              Strategic matrices are automatically generated upon workflow initialization. Start a new workflow to begin tracking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
