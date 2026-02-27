"use client"

import Link from 'next/link'
import React from 'react'
import { GoWorkflow } from "react-icons/go";
import { IoNotifications } from "react-icons/io5";
import { FcWorkflow } from "react-icons/fc";
import { FcInvite } from "react-icons/fc";
import { IoMdHelpCircleOutline } from "react-icons/io";
import { FaMagic } from "react-icons/fa";
import { IoMdContact } from "react-icons/io";
import { FiChevronRight } from "react-icons/fi";
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation'; // ✅ CORRECT: using next/navigation for App Router

const UserComp = () => {
  const router = useRouter(); // Using the App Router hook

  const menuItems = [
    {
      icon: <IoMdContact className="text-indigo-500" size={22} />,
      label: "My Profile",
      href: "/User",
    },
    {
      icon: <GoWorkflow className="text-blue-500" size={22} />,
      label: "New Workflow",
      href: "/User/create_workflows",
    },
    {
      icon: <FcWorkflow size={22} />,
      label: "My Workflows",
      href: "/User/Workflows",
    },
    {
      icon: <FaMagic className="text-purple-500" size={22} />,
      label: "AI Autopilot",
      href: "/User/AIGenerate",
    },
    {
      icon: <IoMdHelpCircleOutline className="text-green-500" size={22} />,
      label: "Help Center",
      href: "/User/Help&FirstSteps",
    }
  ];

  // ✅ LOGOUT FUNCTION - Now using App Router's router.refresh()
  const handleLogout = () => {
    try {
      // Remove all authentication data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');

      // Optional: clear everything
      // localStorage.clear();

      // Redirect to login page
      router.push('/signin');
      router.refresh(); // ✅ Now this works with next/navigation!

    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Add 'use client' directive at the top of the file
  // Since this component uses hooks and browser APIs

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Logo/Header Section */}
      <div className="mb-8 px-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <GoWorkflow className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">Axia Solutions</h1>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest opacity-80">User Workspace</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
          <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1">Status Report</p>
          <p className="text-xs text-slate-500 font-medium">Lattice Monitoring Active</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                href={item.href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group hover:shadow-sm border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-blue-100">
                    {item.icon}
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-blue-600">
                    {item.label}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full rounded-lg transition-colors group"
        >
          <LogOut
            size={20}
            className="group-hover:translate-x-1 transition-transform"
          />
          <span className="font-medium text-sm">
            Logout
          </span>
        </button>
      </div>
    </div>
  )
}

export default UserComp