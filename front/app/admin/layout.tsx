'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/sidebar';
import CloseIcon from '@mui/icons-material/MenuOpen';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import Header from './components/header';
import { useAuth } from '@/hooks/useAuth';
import DomainSidebar from './components/domain-sidebar';
import WelcomeWizard from '@/components/WelcomeWizard';
import VisualHint from '@/components/VisualHint';

const PAGE_METADATA: Record<string, { title: string, subtitle: string }> = {
    '/admin': {
        title: "Command Center",
        subtitle: "Manage your organization's workflows and talent."
    },
    '/admin/alerts': {
        title: "Operational Security",
        subtitle: "Monitor critical deadlines and incident reports across the organization."
    },
    '/admin/operations': {
        title: "Operational Control",
        subtitle: "Monitor active processes, validate global tasks, and analyze organizational throughput."
    },
    '/admin/projects': {
        title: "Project Portfolios",
        subtitle: "Organize and group your workflows into strategic projects."
    },
    '/admin/userManagement': {
        title: "Persona Node Matrix",
        subtitle: "Manage organizational identities, authorization levels, and cell assignments."
    },
    '/admin/roles': {
        title: "Roles & Permissions",
        subtitle: "Manage user roles, permissions, and domain access"
    },
    '/admin/tasks': {
        title: "Task Manager",
        subtitle: "Monitor and orchestrate organizational throughput."
    },
    '/admin/AllCheck': {
        title: "All Checklists",
        subtitle: "Manage and monitor your dynamic checklists"
    },
    '/admin/AllKanban': {
        title: "All Kanbans",
        subtitle: "Manage and monitor your organizational throughput boards"
    },
    '/admin/AllForms': {
        title: "Global Form Repository",
        subtitle: "Manage and monitor all dynamic forms across your organization."
    },
    '/admin/workflows': {
        title: "Workflow Design Studio",
        subtitle: "Architect business logic, browse process inspirations, and orchestrate organizational flow."
    },
    '/admin/workflows/standard': {
        title: "Standard Procedures",
        subtitle: "Browse and deploy pre-defined organizational standard flows."
    },
    '/admin/billing': {
        title: "Fiscal Intelligence",
        subtitle: "Monitor organization resource consumption, manage node licenses, and analyze fiscal vectors."
    },
    '/admin/logs': {
        title: "Lattice Audit Center",
        subtitle: "Real-time system forensics, activity monitoring, and organizational audit logs."
    },
    '/admin/profile': {
        title: "Persona Node",
        subtitle: "Manage your administrative credentials and lattice preferences."
    },
    '/admin/reports': {
        title: "Strategic Support",
        subtitle: "Communicate directly with system architects and super administrators."
    },
    '/admin/modules': {
        title: "Functional Module Repository",
        subtitle: "Manage global reusable business units like Achat, Vente, and RH."
    },
    '/admin/domains': {
        title: "Organizational Sectors",
        subtitle: "Architect and manage specialized business domains across your organization."
    },
    '/admin/guide': {
        title: "Platform Onboarding",
        subtitle: "Master the architecture and configuration of your organizational lattice."
    }
};


export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { loading } = useAuth();
    const [isExpired, setIsExpired] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Handle responsive initial state
    useEffect(() => {
        const checkScreen = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        checkScreen();
        // Optionnel: window.addEventListener('resize', checkScreen);
    }, []);

    const isWorkflowDetail = pathname.match(/^\/admin\/workflows\/.+/);
    // Don't hide for standard flows
    const hideSidebar = isWorkflowDetail && !pathname.includes('/standard');

    const metadata = PAGE_METADATA[pathname] || { title: "Axia Admin", subtitle: "Management Console" };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        // Set initial state
        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const checkSubscription = () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            try {
                const user = JSON.parse(userStr);
                const expired = user.subscriptionExpired === true;
                setIsExpired(expired);

                // Force redirect to billing if expired and on another page
                if (expired && pathname !== '/admin/billing') {
                    router.push('/admin/billing');
                }
            } catch (err) {
                console.error('Error checking subscription in layout:', err);
            }
        };

        checkSubscription();

        // Listen for custom events (for same-tab updates)
        window.addEventListener('subscriptionChange', checkSubscription);
        // Listen for storage events (for multi-tab updates)
        window.addEventListener('storage', checkSubscription);

        const internal = setInterval(checkSubscription, 10000); // 10s check

        return () => {
            clearInterval(internal);
            window.removeEventListener('subscriptionChange', checkSubscription);
            window.removeEventListener('storage', checkSubscription);
        };
    }, [pathname, router]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
            <WelcomeWizard />
            <VisualHint 
                id="hint-nav-domains" 
                targetId="sidebar-link-domains" 
                title="Organizational Sectors" 
                content="Define your business domains and manage functional modules here."
                position="right"
                delay={4}
            />
            <VisualHint 
                id="hint-nav-studio" 
                targetId="sidebar-link-workflow-studio" 
                title="Architect's Studio" 
                content="Create and manage your professional business protocols and templates."
                position="right"
                delay={5}
            />
            <div className="flex flex-1 min-w-0 overflow-hidden relative">
                {/* Sidebar with responsive overlay logic */}
                {!hideSidebar && (
                    <>
                        <AnimatePresence mode="wait">
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 320, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "circOut" }}
                                    className={`fixed inset-y-0 left-0 z-40 lg:relative ${pathname.startsWith('/admin/domains/') && pathname !== '/admin/domains' ? 'bg-indigo-800' : 'bg-indigo-700'} shadow-2xl overflow-hidden flex-shrink-0`}
                                >
                                    {pathname.startsWith('/admin/domains/') && pathname !== '/admin/domains' ? (
                                        <DomainSidebar domainId={pathname.split('/')[3]} />
                                    ) : (
                                        <Sidebar isExpired={isExpired} />
                                    )}
                                    {/* Mobile Close Button */}
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="absolute top-4 right-[-50px] bg-indigo-700 text-white p-2 rounded-r-lg lg:hidden shadow-lg shadow-indigo-200"
                                    >
                                        <CloseIcon />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* Mobile Backdrop */}
                {isSidebarOpen && !hideSidebar && (
                    <div
                        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Header integrated into the content area */}
                    {!hideSidebar && (
                        <Header
                            title={metadata.title}
                            subtitle={metadata.subtitle}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            isSidebarOpen={isSidebarOpen}
                        />
                    )}
                    <main className={`flex-1 overflow-y-auto ${hideSidebar ? 'p-0' : 'p-4 md:p-8'}`}>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
