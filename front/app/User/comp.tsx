'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Bell,
  GitBranch,
  Users,
  User,
  HelpCircle,
  Zap,
  LogOut,
  Layers,
  ListTodo
} from 'lucide-react';

function UserSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      router.push('/signin');
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col h-full shadow-2xl">
      <div className="p-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Axia Solutions</h1>
        <p className="text-indigo-200 text-xs mt-1 font-bold uppercase tracking-widest opacity-80">User Workspace</p>
      </div>

      <nav className="flex-1 mt-6 overflow-y-auto px-4">
        <div className="space-y-1">
          <Link href="/User" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">My Profile</span>
          </Link>

          <Link href="/User/create_workflows" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-bold">New Workflow</span>
          </Link>

          <Link href="/User/Notifications" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">Alert Inbox</span>
          </Link>

          <Link href="/User/Workflows" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <GitBranch className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-bold">My Workflows</span>
          </Link>

          <Link href="/User/InviteTeam" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold">Invite Matrix</span>
          </Link>

          <Link href="/User/Allforms" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <Layers className="h-5 w-5 group-hover:scale-110 transition-transform text-indigo-300" />
            <span className="text-sm font-bold">All Forms</span>
          </Link>



          <Link href="/User/AIGenerate" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <Zap className="h-5 w-5 text-amber-400 group-hover:animate-pulse" />
            <span className="text-sm font-bold">AI Autopilot</span>
          </Link>

          <div className="my-4 border-t border-indigo-600/50"></div>

          <Link href="/User/Help&FirstSteps" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all group">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm font-bold">Help Center</span>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-indigo-600">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 rounded-xl w-full transition-all group"
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}

export default UserSidebar;