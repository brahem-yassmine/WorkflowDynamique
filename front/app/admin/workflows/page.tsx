// app/workflows/page.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Checkbox from '@mui/material/Checkbox';

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


// Types
interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

interface NotificationSetting {
  role: string;
  initiated: boolean;
  rolledBack: boolean;
  edited: boolean;
  completed: boolean;
  inheritOverride: boolean;
}

export default function WorkflowsPage() {
  const router = useRouter();
  
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: 'WF-001', name: 'Budget Approval', description: 'Annual budget review and approval process', status: 'active', createdAt: '2025-01-15' },
    { id: 'WF-002', name: 'Employee Onboarding', description: 'New employee onboarding workflow', status: 'active', createdAt: '2025-01-20' },
    { id: 'WF-003', name: 'Contract Review', description: 'Legal contract review and approval', status: 'draft', createdAt: '2025-02-01' },
    { id: 'WF-004', name: 'IT Access Request', description: 'System access request and approval', status: 'active', createdAt: '2025-02-10' },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    // Workflow Consumer
    { role: 'Application User', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: false },
    { role: 'Configuration Manager', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: true },
    { role: 'License Manager', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: true },
    { role: 'Project Manager', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: true },
    { role: 'UA Tester', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: false },
    { role: 'User', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: true },
    
    // Workflow Administrator
    { role: 'Project Manager', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: true },
    { role: 'Repackager', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: false },
    { role: 'SCAdmin', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: true },
    { role: 'System Administrator', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: false },
    { role: 'Tech Lead', initiated: false, rolledBack: false, edited: false, completed: false, inheritOverride: true },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const handleEdit = (workflow: Workflow) => {
    setEditingId(workflow.id);
    setEditForm({ name: workflow.name, description: workflow.description });
  };

  const handleSave = (id: string) => {
    setWorkflows(workflows.map(w => 
      w.id === id ? { ...w, name: editForm.name, description: editForm.description } : w
    ));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(workflows.filter(w => w.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    }
  };

  const handleCheckboxChange = (index: number, field: keyof Omit<NotificationSetting, 'role'>) => {
    const updated = [...notificationSettings];
    updated[index] = { ...updated[index], [field]: !updated[index][field] };
    setNotificationSettings(updated);
  };

  const handleUpdateNotifications = () => {
    // Logique pour sauvegarder les notifications
    console.log('Notifications updated:', notificationSettings);
    alert('Notifications settings saved successfully!');
  };

  const handleCreateWorkflow = () => {
    router.push('/workflows/create');
  };

  const handleSaveNotifications = () => {
    // Logique pour sauvegarder les paramètres de notification
    console.log('Notification settings saved:', notificationSettings);
    alert('Notification settings saved successfully!');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <div className="bg-indigo-600 -mt-8 -mx-8 p-8 mb-6">
          <h1 className="text-3xl font-bold text-white">Workflows</h1>
          <p className="text-indigo-200">Manage your workflow phases and notifications</p>
        </div>

        {/* Workflow Stats et Bouton Create Workflow */}
        <div className="mb-6 flex gap-4">
          <div className="bg-white rounded-lg shadow p-6 flex-1">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-indigo-600">{workflows.length}</span>
              <span className="text-gray-600">list of workflows</span>
            </div>
          </div>
          <button
            onClick={handleCreateWorkflow}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <AddIcon fontSize="small" />
            Create Workflow
          </button>
        </div>

        {/* Workflows List */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Workflows</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Id</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">details (selected to edit)</th>
                  <th className="p-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <tr key={workflow.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{workflow.id}</td>
                    <td className="p-3">
                      {editingId === workflow.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Workflow name"
                          />
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Description"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-gray-500">{workflow.description}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === workflow.id ? (
                          <>
                            <button
                              onClick={() => handleSave(workflow.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              <SaveIcon fontSize="small" />
                              save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                            >
                              cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(workflow)}
                              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                            >
                              <EditIcon fontSize="small" />
                              edit
                            </button>
                            <button
                              onClick={() => handleDelete(workflow.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              <DeleteIcon fontSize="small" />
                              delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Templates Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Templates</h2>
          <button 
            onClick={handleCreateWorkflow}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <AddIcon fontSize="small" />
            create
          </button>
        </div>

        {/* Workflow Phase Notifications */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Workflow Phase Notifications</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Role</th>
                  <th className="p-3 text-center text-sm font-medium text-gray-600">Initiated</th>
                  <th className="p-3 text-center text-sm font-medium text-gray-600">Rolled back</th>
                  <th className="p-3 text-center text-sm font-medium text-gray-600">Edited</th>
                  <th className="p-3 text-center text-sm font-medium text-gray-600">Completed</th>
                  <th className="p-3 text-center text-sm font-medium text-gray-600">Inherit/override</th>
                </tr>
              </thead>
              <tbody>
                {/* Workflow Consumer Section */}
                <tr className="bg-indigo-50">
                  <td colSpan={6} className="p-2 font-bold text-indigo-800">Workflow Consumer</td>
                </tr>
                
                {notificationSettings.slice(0, 6).map((setting, idx) => (
                  <tr key={`consumer-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{setting.role}</td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.initiated}
                        onChange={() => handleCheckboxChange(idx, 'initiated')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.rolledBack}
                        onChange={() => handleCheckboxChange(idx, 'rolledBack')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.edited}
                        onChange={() => handleCheckboxChange(idx, 'edited')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.completed}
                        onChange={() => handleCheckboxChange(idx, 'completed')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.inheritOverride}
                        onChange={() => handleCheckboxChange(idx, 'inheritOverride')}
                        size="small"
                        className={setting.inheritOverride ? 'text-indigo-600' : ''}
                      />
                    </td>
                  </tr>
                ))}

                {/* Workflow Administrator Section */}
                <tr className="bg-indigo-50">
                  <td colSpan={6} className="p-2 font-bold text-indigo-800">Workflow Administrator</td>
                </tr>

                {notificationSettings.slice(6).map((setting, idx) => (
                  <tr key={`admin-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{setting.role}</td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.initiated}
                        onChange={() => handleCheckboxChange(idx + 6, 'initiated')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.rolledBack}
                        onChange={() => handleCheckboxChange(idx + 6, 'rolledBack')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.edited}
                        onChange={() => handleCheckboxChange(idx + 6, 'edited')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.completed}
                        onChange={() => handleCheckboxChange(idx + 6, 'completed')}
                        size="small"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={setting.inheritOverride}
                        onChange={() => handleCheckboxChange(idx + 6, 'inheritOverride')}
                        size="small"
                        className={setting.inheritOverride ? 'text-indigo-600' : ''}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button 
              onClick={handleUpdateNotifications}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Update
            </button>
            <button 
              onClick={handleSaveNotifications}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <SaveIcon fontSize="small" />
              Save
            </button>
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <AddIcon fontSize="small" />
              Add User/Group
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}