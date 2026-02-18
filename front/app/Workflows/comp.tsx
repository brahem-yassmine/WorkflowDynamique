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
      icon: <GoWorkflow className="text-blue-500" size={22} />,
      label: "Create Workflow",
      href: "/User/create_workflows",
    },
    {
      icon: <IoNotifications className="text-yellow-500" size={22} />,
      label: "Notifications",
      href: "/User/Notifications",
    },
    {
      icon: <FcWorkflow size={22} />,
      label: "Workflows",
      href: "/Workflows",
    },
    {
      icon: <FcInvite size={22} />,
      label: "Invite Team",
      href: "/User/InviteTeam",
    },
    {
      icon: <IoMdHelpCircleOutline className="text-green-500" size={22} />,
      label: "Help & First Steps",
      href: "/User/Help&FirstSteps",
    },
    {
      icon: <FaMagic className="text-purple-500" size={22} />,
      label: "AI Generate",
      href: "/User/AIGenerate",
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
          <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GoWorkflow className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Workflow Pro</h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-gray-700">Welcome back!</p>
          <p className="text-xs text-gray-500">Manage your workflows efficiently</p>
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