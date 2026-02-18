'use client'

import React from 'react';
import Link from 'next/link';
import Sidebar from './components/sidebar';

// import Sidebar from 'admin/components';

// Composant principal de la page
export default function EssaiPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <div className="bg-indigo-600 -mt-8 -mx-8 p-8 mb-6 flex justify-between items-center">
          <div className="text-center">
  <h1 className="text-3xl font-bold text-white">Admin dashboard</h1>

    <p className="text-white">welcome admin !</p>
</div>
          
          {/* Notification et Admin Button */}
          

           <div className="flex items-center gap-4">
            <button className="relative p-2 text-white hover:bg-indigo-700 rounded-lg transition-colors">

              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>

            </button>

<Link href="/essai/profile">
  <button className="flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
    <span className="font-medium">Admin</span>
  </button>
</Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Type to search..." 
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-3 text-gray-400">Q</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Dashboard</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 mb-2">Active Workflows</h3>
            <p className="text-3xl font-bold text-indigo-600">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <a href="/essai/tasks" className="flex items-center gap-3 px-4 py-3 text-indigo-500 hover:bg-indigo-800 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-sm font-medium">Pending Tasks</span>
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 mb-2">Recent Accounts</h3>
            <p className="text-3xl font-bold text-indigo-600">23</p>
          </div>
        </div>

        
        {/* Global Dashboard Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Global Dashboard</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Workflows</span>
            <span className="text-3xl font-bold text-indigo-600">75</span>
          </div>
        </div>
      </main>
    </div>
  );
}