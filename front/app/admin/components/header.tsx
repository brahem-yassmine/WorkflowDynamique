'use client';

import React from 'react';
import useUser from '@/hooks/useUser';
import { UserCircle, Bell, Menu, PanelLeft } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface HeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    rightContent?: React.ReactNode;
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, icon, rightContent, onToggleSidebar, isSidebarOpen }) => {
    const { user, tenant } = useUser();

    return (
        <div className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center relative z-30">
            <div className="flex items-center gap-6">
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="w-12 h-12 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 flex items-center justify-center mr-2 shadow-sm"
                        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        <PanelLeft size={24} strokeWidth={1.5} />
                    </button>
                )}
                <div className="flex items-center gap-4">
                    {icon && (
                        <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
                            {icon}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{title}</h1>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{subtitle || 'Management Console'}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {rightContent || (
                    <div className="flex items-center gap-6">
                        {/* Notifications */}
                        <NotificationBell />

                        {/* Profile Info */}
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-800 leading-none capitalize">
                                    {user?.firstName || user?.name || user?.email?.split('@')[0] || 'User'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 justify-end">
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight">
                                        {user?.role === 'super_admin' ? 'Global Admin' : (user?.role || 'Member')}
                                    </span>
                                    {tenant?.name && (
                                        <>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase truncate max-w-[100px]">
                                                {tenant.name}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                                <UserCircle size={24} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
