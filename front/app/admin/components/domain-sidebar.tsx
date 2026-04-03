import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
    LayoutGrid, 
    Box, 
    Layers, 
    Settings, 
    ChevronLeft, 
    Zap,
    Users,
    FileText,
    Database,
    ArrowLeft,
    Plus,
    ChevronRight
} from 'lucide-react';
import { apiService } from '@/service/api.service';

interface Domain {
    _id: string;
    name: string;
    color: string;
}

interface Module {
    _id: string;
    name: string;
}

export default function DomainSidebar({ domainId }: { domainId: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentModuleId = searchParams.get('moduleId');
    
    const [domain, setDomain] = useState<Domain | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchModules = async () => {
        try {
            const res = await apiService.getModules(domainId);
            if (res.success) setModules(res.data);
        } catch (err) {
            console.error('Error fetching domain modules:', err);
        }
    };

    useEffect(() => {
        const fetchDomain = async () => {
            try {
                const response = await apiService.getDomains();
                if (response.success) {
                    const found = response.data.find((d: Domain) => d._id === domainId);
                    setDomain(found);
                }
            } catch (error) {
                console.error('Failed to fetch domain info', error);
            }
        };
        
        fetchDomain();
        fetchModules();
        
        // Listen for module changes
        window.addEventListener('modulesUpdated', fetchModules);
        return () => window.removeEventListener('modulesUpdated', fetchModules);
    }, [domainId]);

    const isActive = (href: string) => pathname === href;

    return (
        <aside className="w-full bg-slate-900 text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-20"></div>
            
            {/* Top Bar / Back Button */}
            <div className="p-6 border-b border-white/5 relative z-10">
                <button 
                    onClick={() => router.push('/admin/domains')}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors group mb-6"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back to Admin</span>
                </button>

                <div className="flex items-center gap-4">
                    <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 relative group"
                        style={{ backgroundColor: domain?.color || '#6366f1' }}
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Box size={24} className="text-white relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight leading-none truncate max-w-[160px]">
                            {domain?.name || 'Loading...'}
                        </h1>
                        <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sector Matrix
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 mt-6 overflow-y-auto px-4 space-y-8 relative z-10 scrollbar-hide pb-10">
                {/* Modules Section */}
                <div className="space-y-4">
                    <div className="px-4 py-2 bg-slate-800 rounded-xl">
                        <Link
                            href={`/admin/domains/${domainId}/modules`}
                            className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center justify-between hover:text-indigo-300 transition-colors"
                        >
                            create and modify module
                            <ChevronRight size={14} className="text-slate-500" />
                        </Link>
                    </div>
                    
                    <div className="space-y-1">
                        {modules.map((mod) => {
                            const active = pathname === `/admin/domains/${domainId}/modules` && currentModuleId === mod._id;
                            return (
                                <Link
                                    key={mod._id}
                                    href={`/admin/domains/${domainId}/modules?moduleId=${mod._id}`}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                                        ${active
                                            ? 'bg-slate-700 text-white shadow-lg border border-white/5'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white font-bold'}
                                    `}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-400' : 'bg-slate-700 group-hover:bg-slate-400'} transition-colors`} />
                                    <span className="text-[10px] tracking-tight flex-1 truncate uppercase font-black">{mod.name}</span>
                                    {active && (
                                        <motion.div
                                            layoutId="activeModuleIndicator"
                                            className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Management Section */}
                <div className="space-y-4">
                    <h2 className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Settings size={12} />
                        Lattice Management
                    </h2>
                    <div className="space-y-1">
                        <Link
                            href={`/admin/domains/${domainId}/settings`}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                                ${pathname.includes('/settings')
                                    ? 'bg-white/10 text-white shadow-lg border border-white/5'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white font-bold'}
                            `}
                        >
                            <Settings size={18} className={`${pathname.includes('/settings') ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className="text-xs tracking-tight uppercase font-black">Sector Config</span>
                            {pathname.includes('/settings') && (
                                <motion.div
                                    layoutId="activeIndicatorDomain"
                                    className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                                />
                            )}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Bottom Status */}
            <div className="p-6 mt-auto relative z-10">
                <div className="bg-white/5 backdrop-blur-md rounded-[24px] p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Matrix Node</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic">
                        Connected to {domain?.name || 'Sector'}
                    </p>
                </div>
            </div>
        </aside>
    );
}
