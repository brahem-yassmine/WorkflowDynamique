'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
    Database, 
    Plus, 
    Search, 
    Terminal, 
    Box, 
    Layers, 
    ChevronRight,
    Search as SearchIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DomainModels() {
    const { id } = useParams();
    const [search, setSearch] = useState("");

    const mockModels = [
        { name: "InventoryAsset", fields: 12, workflows: 4, type: "Core Entity" },
        { name: "SupplierContract", fields: 8, workflows: 2, type: "Reference Data" },
        { name: "QualityMetric", fields: 15, workflows: 1, type: "Analytical Node" }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Domain Data Models</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Structural Entity Schema / Data Architecture</p>
                </div>
                <button
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[24px] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 uppercase tracking-widest text-[11px]"
                >
                    <Plus size={18} />
                    Define New Entity
                </button>
            </div>

            {/* Search */}
            <div className="relative group max-w-2xl">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Filter structural schemas by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[32px] shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-slate-700"
                />
            </div>

            {/* Content Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockModels.map((m, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group cursor-pointer border-l-4 border-l-emerald-500"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Terminal size={24} />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.type}</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">{m.name}</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Property Fields</span>
                                <span className="text-sm font-black text-slate-700">{m.fields}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Workflow Links</span>
                                <span className="text-sm font-black text-slate-700">{m.workflows}</span>
                            </div>
                        </div>
                        <button className="w-full mt-8 py-3 bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            Refine Architecture
                            <ChevronRight size={14} />
                        </button>
                    </motion.div>
                ))}

                <button className="bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-emerald-50/20 hover:border-emerald-100 transition-all group min-h-[300px]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 group-hover:text-emerald-300 transition-colors shadow-sm">
                        <Plus size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Inject Schema</p>
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">Manual structural vector</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
