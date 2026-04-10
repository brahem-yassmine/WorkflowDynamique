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
    ChevronRight,
    Circle,
    Activity,
    Cpu,
    Network
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
        <aside className="w-full bg-indigo-700 text-white flex flex-col h-full shadow-2xl relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-20"></div>

            {/* Top Bar / Back Button - Enhanced */}
            <div className="p-8 border-b border-white/5 relative z-10">
                <button
                    onClick={() => router.push('/admin/domains')}
                    className="flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all group mb-10 border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.1)] active:scale-95"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-indigo-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] pt-0.5">Admin Central</span>
                </button>

                <div className="flex items-center gap-5 relative group/header cursor-default">
                    <div className="relative">
                        <div 
                            className="w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transform rotate-3 relative z-10 overflow-hidden group-hover/header:rotate-6 group-hover/header:scale-105 transition-all duration-500"
                            style={{ backgroundColor: domain?.color || '#6366f1' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                            <Box size={32} className="text-white relative z-20" />
                        </div>
                        {/* Orb glow behind icon */}
                        <div 
                            className="absolute inset-0 w-16 h-16 rounded-full blur-2xl opacity-40 group-hover/header:opacity-60 transition-opacity duration-500 animate-pulse"
                            style={{ backgroundColor: domain?.color || '#6366f1' }}
                        />
                    </div>
                    <div className="relative">
                        <h1 className="text-2xl font-black text-white tracking-tighter leading-none group-hover/header:translate-x-1 transition-transform duration-500">
                            {domain?.name || 'Loading...'}
                        </h1>
                        <p className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                            <span className="w-2.5 h-[2px] bg-indigo-400 rounded-full" />
                            Sector Matrix
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Items - Redesigned Hierarchy */}
            <nav className="flex-1 mt-10 overflow-y-auto px-6 space-y-10 relative z-10 scrollbar-hide pb-10">
                {/* Modules Section */}
                <div className="space-y-4">
                    <div className="px-4 flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.4em]">Structure Control</span>
                        <div className="w-10 h-[1px] bg-white/10" />
                    </div>

                    <Link
                        href={`/admin/domains/${domainId}/modules`}
                        className={`
                            px-5 py-4 rounded-2xl flex items-center justify-between transition-all duration-500 group relative overflow-hidden
                            ${pathname === `/admin/domains/${domainId}/modules` && !currentModuleId
                                ? 'bg-white text-indigo-800 shadow-[0_10px_40px_rgba(0,0,0,0.2)]'
                                : 'text-indigo-100 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/5'}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-colors ${pathname === `/admin/domains/${domainId}/modules` && !currentModuleId ? 'bg-indigo-50 text-indigo-600' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                <LayoutGrid size={16} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Global Units</span>
                        </div>
                        <ChevronRight size={14} className={`transition-all ${pathname === `/admin/domains/${domainId}/modules` && !currentModuleId ? 'text-indigo-400 translate-x-1' : 'text-white/20 opacity-0 group-hover:opacity-100 translate-x-0'}`} />
                    </Link>

                    <div className="pl-4 space-y-2 relative">
                        {/* Nested list vertical line */}
                        <div className="absolute left-7 top-0 bottom-4 w-[1px] bg-white/10" />
                        
                        {modules.map((mod) => {
                            const active = pathname === `/admin/domains/${domainId}/modules` && currentModuleId === mod._id;
                            return (
                                <Link
                                    key={mod._id}
                                    href={`/admin/domains/${domainId}/modules?moduleId=${mod._id}`}
                                    className={`
                                        flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 group relative ml-4
                                        ${active
                                            ? 'bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-xl'
                                            : 'text-indigo-200 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <div className="relative">
                                        <Circle 
                                            size={6} 
                                            fill={active ? "currentColor" : "transparent"} 
                                            className={`${active ? 'text-emerald-400' : 'text-white/20 group-hover:text-white/40'} transition-all`} 
                                        />
                                        {active && <div className="absolute inset-0 bg-emerald-400 blur-sm rounded-full opacity-50" />}
                                    </div>
                                    <span className={`text-[10px] tracking-wide flex-1 truncate uppercase ${active ? 'font-black' : 'font-bold'}`}>{mod.name}</span>
                                    
                                    {/* Horizontal connector link */}
                                    <div className={`absolute -left-3 top-1/2 w-3 h-[1px] ${active ? 'bg-white/20' : 'bg-white/10'}`} />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="px-4 flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.4em]">Matrix Tuning</span>
                        <div className="w-10 h-[1px] bg-white/10" />
                    </div>
                    
                    <div className="space-y-2">
                        <Link
                            href={`/admin/domains/${domainId}/settings`}
                            className={`
                                flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative
                                ${pathname.includes('/settings')
                                    ? 'bg-white text-indigo-800 shadow-[0_10px_40px_rgba(0,0,0,0.2)] font-black'
                                    : 'text-indigo-100 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/5'}
                            `}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${pathname.includes('/settings') ? 'bg-indigo-50 text-indigo-600' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                <Cpu size={16} />
                            </div>
                            <span className="text-[11px] uppercase tracking-[0.15em] font-black flex-1">Sector Parameters</span>
                            <ChevronRight size={14} className={pathname.includes('/settings') ? 'text-indigo-400 translate-x-1' : 'opacity-0'} />
                        </Link>
                    </div>
                </div>
            </nav>


        </aside>
    );
}
