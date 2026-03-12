'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Bell,
  GitBranch,
  Users,
  User,
  HelpCircle,
  Zap,
  LogOut,
  CheckSquare,
  Layers,
  ListTodo
} from 'lucide-react';

function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDesignMode = searchParams.get('mode') === 'design';

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

  const menuItems = [
    { icon: User, label: "My Profile", href: "/User" },
    { icon: CheckSquare, label: "My Tasks", href: "/User/tasks" },
    { icon: Plus, label: "New Workflow", href: "/User/create_workflows" },
    { icon: Bell, label: "Alert Inbox", href: "/User/Notifications" },
    { icon: GitBranch, label: "My Workflows", href: "/User/Workflows" },
    { icon: Users, label: "Invite Matrix", href: "/User/InviteTeam" },
    { icon: Layers, label: "All Forms", href: "/User/Allforms", color: "text-indigo-300" },
    { icon: ListTodo, label: "All Checklists", href: "/User/Allchecks", color: "text-emerald-400" },
    { icon: Zap, label: "AI Autopilot", href: "/User/AIGenerate", color: "text-amber-400" },
  ];

  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col h-full shadow-2xl">
      <div className="p-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Axia Solutions</h1>
        <p className="text-indigo-200 text-xs mt-1 font-bold uppercase tracking-widest opacity-80">User Workspace</p>
      </div>

      <nav className="flex-1 mt-6 overflow-y-auto px-4">
        <div className="space-y-1">
          {menuItems.map((item, idx) => {
            const activeMatch = pathname === item.href;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeMatch ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-100 hover:bg-indigo-800'}`}
              >
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${activeMatch ? 'text-indigo-600' : (item.color || 'text-indigo-300')}`} />
                <span className={`text-sm font-bold ${activeMatch ? 'font-black' : ''}`}>{item.label}</span>
              </Link>
            );
          })}

          <div className="my-4 border-t border-indigo-600/50"></div>

          <Link href="/User/Help&FirstSteps" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === "/User/Help&FirstSteps" ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-100 hover:bg-indigo-800'}`}>
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
