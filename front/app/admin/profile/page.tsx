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
import Sidebar from '../components/sidebar';



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