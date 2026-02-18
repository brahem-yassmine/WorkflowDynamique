import { Search, HelpCircle, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
      {/* Search Bar for Traceability */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="Search workflow history or users..." 
          className="w-full bg-slate-50 border border-slate-100 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">
          <HelpCircle size={18} />
          <span className="text-sm font-medium">Documentation</span>
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-none">Admin User</p>
            <p className="text-[10px] text-indigo-600 font-medium mt-1 uppercase tracking-tighter">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-all">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}