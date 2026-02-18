import React from 'react';
import { 
  Search, 
  BookOpen, 
  LifeBuoy, 
  MessageCircle, 
  Zap, 
  ChevronRight, 
  Video,
  FileText
} from 'lucide-react';

const HelpPage = () => {
  const categories = [
    { title: "Getting Started", icon: <Zap className="text-amber-500" />, articles: 5 },
    { title: "Workflow Design", icon: <BookOpen className="text-blue-500" />, articles: 12 },
    { title: "IA Assistant Guide", icon: <LifeBuoy className="text-purple-500" />, articles: 8 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Search Section */}
      <section className="bg-indigo-600 rounded-3xl p-10 text-center text-white shadow-xl shadow-indigo-100">
        <h1 className="text-3xl font-bold mb-4">How can we help you?</h1>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
          <input 
            type="text" 
            placeholder="Search for tutorials, rules, or step configurations..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md placeholder:text-indigo-100 outline-none focus:bg-white focus:text-slate-900 transition-all shadow-inner"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {cat.icon}
            </div>
            <h3 className="font-bold text-slate-800">{cat.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{cat.articles} detailed articles</p>
            <div className="mt-4 flex items-center text-indigo-600 text-xs font-bold uppercase tracking-wider">
              Explore <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Documentation */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" /> Popular Documentation
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {[
              "Configuring multi-level validation rules [cite: 24]",
              "Dynamic form drag & drop guide [cite: 27]",
              "Setting up automated SMS notifications [cite: 36]",
              "Tracing process history (Audit Logs) "
            ].map((text, i) => (
              <li key={i} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group cursor-pointer">
                <span className="text-sm text-slate-600 group-hover:text-indigo-600">{text}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </li>
            ))}
          </ul>
        </div>

        {/* Video Tutorials */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Video size={18} className="text-slate-400" /> Video Tutorials
          </h2>
          <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative group overflow-hidden">
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
               <div className="w-0 h-0 border-t-10 border-t-transparent border-l-18 border-l-white border-b-10 border-b-transparent ml-1"></div>
             </div>
             <p className="absolute bottom-4 left-4 text-white text-xs font-medium">Introduction to AI Workflow Generation [cite: 41]</p>
          </div>
        </div>
      </div>

      {/* Support CTA */}
      <div className="bg-indigo-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between border border-indigo-100">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Still need help?</h3>
            <p className="text-sm text-slate-600">Our technical support is available for platform configuration[cite: 72].</p>
          </div>
        </div>
        <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default HelpPage;