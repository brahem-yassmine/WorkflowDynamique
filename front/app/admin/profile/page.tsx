// app/profile/page.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function Sidebar() {
  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col h-full fixed">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">Axia Solutions</h1>
        <p className="text-indigo-200 text-sm mt-1">Admin panel</p>
      </div>
      
      <nav className="flex-1 mt-6 overflow-y-auto">
        <div className="px-4 space-y-1">
          <Link href="/essai" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            <span className="text-sm font-medium flex-1">Global Dashboard</span>
          </Link>
          
          <Link href="/essai/user-management" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium">User Managment</span>
          </Link>
          <Link href="/essai/roles" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium">Roles</span>
          </Link>
          
          <Link href="/essai/workflows" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium">Workflows</span>
          </Link>
          
          <Link href="/essai/create" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Create</span>
          </Link>
          
          <Link href="/essai/tasks" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-medium">Tasks</span>
          </Link>
          
          <Link href="/essai/reports" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0_1-2-2z" />
             </svg>
                         <span className="text-sm font-medium">reports</span>

          </Link>


          <Link href="/essai/notifications" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-sm font-medium">Notifications</span>
          </Link>
          
          <Link href="/essai/billing" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-sm font-medium">Billing</span>
          </Link>
          
          <Link href="/essai/logs" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <span className="text-sm font-medium">Logs & History</span>
          </Link>
          
          <Link href="/essai/profile" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium">Profile</span>
          </Link>
        </div>
      </nav>


<div className="p-4 border-t border-indigo-600">
  <Link href="/">
    <button className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg w-full transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="text-sm font-medium">Logout</span>
    </button>
  </Link>
</div>
    </aside>
  );
}

export default function ProfilePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Foulen Ben Foulen',
    email: 'foulen.benfoulen@example.com',
    password: 'password123',
    role: 'Admin'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleReset = () => {
    // Réinitialiser les champs (simulé)
    alert('Password reset email sent!');
  };

  const user = {
    name: formData.name,
    email: formData.email,
    role: formData.role
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header avec message de bienvenue */}
        <div className="bg-indigo-600 -mt-8 -mx-8 p-8 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full">
              <PersonIcon className="text-indigo-600" fontSize="large" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Foulen Ben Foulen</h1>
              <p className="text-indigo-200">Welcome!</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte des informations personnelles */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PersonIcon className="text-indigo-600" />
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <PersonIcon fontSize="small" className="text-gray-400" />
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <EmailIcon fontSize="small" className="text-gray-400" />
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">E-mail</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <LockIcon fontSize="small" className="text-gray-400" />
                  Password
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Password</span>
                  <div className="flex-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carte des rôles et actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AdminPanelSettingsIcon className="text-indigo-600" />
              Role & Permissions
            </h2>

            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Your Role</p>
                <p className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
                  <AdminPanelSettingsIcon fontSize="small" />
                  {formData.role}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 font-medium transition-colors"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  show
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings Section */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <SettingsIcon className="text-indigo-600" />
             Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-800 mb-2">Notifications</h3>
              <p className="text-sm text-gray-600">Configure your notification preferences</p>
              <button className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-800">
                Configure →
              </button>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-800 mb-2">Security</h3>
              <p className="text-sm text-gray-600">Two-factor authentication, login history</p>
              <button className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-800">
                Manage →
              </button>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-800 mb-2">Preferences</h3>
              <p className="text-sm text-gray-600">Language, timezone, display settings</p>
              <button className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-800">
                Customize →
              </button>
            </div>
          </div>
        </div>

        {/* Footer avec audit info */}
        <div className="mt-6 text-xs text-gray-400 border-t pt-4">
          <p>Last login: Today at 10:30 AM • IP: 192.168.1.1</p>
          <p>Account created: January 15, 2025</p>
        </div>
      </main>
    </div>
  );
}