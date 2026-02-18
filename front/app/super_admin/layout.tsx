"use client";

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/header'; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex">

      
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      
      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        {/* Header Component */}
        <Header toggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}