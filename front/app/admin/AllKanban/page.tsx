"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Copy, 
  Edit3, 
  Trash2, 
  Search, 
  Calendar,
  Layers,
  ArrowRight,
  LayoutGrid
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { apiService } from '@/service/api.service';

interface Board {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export default function AllKanbanPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchBoards = async () => {
    try {
      const response = await apiService.getBoards();
      if (response.success) {
        setBoards(response.data);
      }
    } catch (error: any) {
      console.error("Fetch boards error:", error);
      toast.error("Failed to load kanban boards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = () => {
    router.push('/kanban');
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.deleteBoard(id);
      if (response.success) {
        toast.success("Board deleted");
        setBoards(boards.filter(b => b._id !== id));
      }
    } catch (error: any) {
      toast.error("Failed to delete board");
    }
  };

  const filteredBoards = boards.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" richColors />
      
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search boards..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button 
          onClick={handleCreateBoard}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          Create Kanban
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-white rounded-[32px] border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 text-center flex flex-col items-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <LayoutGrid className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">No boards found</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 mb-8">Start by provisioning your first organizational throughput board.</p>
          <button 
            onClick={handleCreateBoard}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} /> Start Provisioning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board) => (
            <div 
              key={board._id} 
              className="group bg-white rounded-[32px] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <LayoutDashboard size={18} />
                </div>
                <div className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                  <Calendar size={12} />
                  {new Date(board.createdAt).toLocaleDateString()}
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors">
                {board.name}
              </h3>
              
              <p className="text-xs text-slate-400 mb-8 font-medium line-clamp-2">
                {board.description || "Standard organizational throughput management board."}
              </p>

              <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await apiService.request(`/boards/${board._id}/clone`, { method: 'POST' });
                        if (res.success) {
                          toast.success("Board cloned!");
                          fetchBoards();
                        }
                      } catch { toast.error("Clone failed"); }
                    }}
                    className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Clone Board"
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(board._id)}
                    className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete Board"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <button 
                  onClick={() => router.push(`/kanban?boardId=${board._id}`)}
                  className="px-4 py-2 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-transparent group-hover:shadow-lg group-hover:shadow-indigo-100 active:scale-95"
                >
                  Open Board
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
