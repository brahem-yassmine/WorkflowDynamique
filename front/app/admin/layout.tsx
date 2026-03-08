'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/sidebar';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { usePathname, useRouter } from 'next/navigation';
import Header from './components/header';
import { useAuth } from '@/hooks/useAuth';

const PAGE_METADATA: Record<string, { title: string, subtitle: string }> = {
    '/admin': {
        title: "Command Center",
        subtitle: "Manage your organization's workflows and talent."
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
        title: "Kanban",
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
    '/admin/create_workflows': {
        title: "Provision Flow Schema",
        subtitle: "Design and architect complex organizational throughput with node-based logic."
    },
    '/admin/workflows': {
        title: "Flow Orchestration",
        subtitle: "Architect business logic, manage phase alerts, and monitor execution cycles."
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
    }
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const metadata = PAGE_METADATA[pathname] || { title: "Axia Admin", subtitle: "Management Console" };

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

        const internal = setInterval(checkSubscription, 10000); // Reduce to 10s for better feel
        
        return () => {
            clearInterval(internal);
            window.removeEventListener('subscriptionChange', checkSubscription);
            window.removeEventListener('storage', checkSubscription);
        };
    }, [pathname, router]);
    const { subscriptionExpired, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && subscriptionExpired && pathname !== '/admin/billing') {
            router.push('/admin/billing');
        }
    }, [subscriptionExpired, loading, pathname, router]);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar with responsive overlay logic */}
            <div className={`
                fixed inset-y-0 left-0 z-50 transform bg-indigo-700 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                w-64
            `}>
                <Sidebar isExpired={isExpired} />
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-[-50px] bg-indigo-700 text-white p-2 rounded-r-lg lg:hidden shadow-lg shadow-indigo-200"
                >
                    <CloseIcon />
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Menu Trigger */}
                <div className="lg:hidden p-4 bg-white border-b border-gray-100 flex items-center shadow-sm">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                        <MenuIcon />
                    </button>
                    <span className="ml-4 font-bold text-gray-800 tracking-tight">Axia Admin</span>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title={metadata.title} subtitle={metadata.subtitle} />
                    <main className="flex-1 overflow-y-scroll p-4 md:p-8 pt-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
