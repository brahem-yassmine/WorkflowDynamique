'use client'

import Link from 'next/link';
import * as React from 'react';
import { useState } from 'react';
import { List, ListItem, ListItemButton, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon, Search } from '@mui/icons-material';
import Sidebar from '../components/sidebar';
import { toast, Toaster } from 'sonner';

interface User { id: string; name: string; email: string; role: string; department: string; domain: string; status: string; }

const UserForm = ({ onSave, onCancel, user }: { onSave: (u: any) => void, onCancel: () => void, user?: User | null }) => {
  const [fd, setFd] = useState(user || { name: '', email: '', role: 'User', department: 'IT', domain: 'IT', status: 'Active' });
  
  const fields = [
    { name: 'name', label: 'Full Name', type: 'text' },
    { name: 'email', label: 'Email Address', type: 'email' },
    { name: 'role', label: 'Role', type: 'select', options: ['Admin', 'Manager', 'User', 'Editor'] },
    { name: 'department', label: 'Department', type: 'select', options: ['IT', 'Operations', 'Sales', 'Marketing', 'HR', 'Finance'] },
    { name: 'domain', label: 'Domain', type: 'select', options: ['Finance', 'Operations', 'IT', 'Marketing', 'Sales'] },
    { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
  ];

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(fd); }} className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4 text-gray-800">{user ? 'Edit' : 'Add'} User</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{f.label}</label>
            {f.type === 'select' ? (
              <select value={(fd as any)[f.name]} onChange={e => setFd({...fd, [f.name]: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type} required value={(fd as any)[f.name]} onChange={e => setFd({...fd, [f.name]: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
        <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow-md transition-all">
          {user ? 'Update' : 'Create'} User
        </button>
      </div>
    </form>
  );
};

const INITIAL_USERS: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', department: 'IT', domain: 'Finance', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', department: 'Operations', domain: 'Operations', status: 'Active' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'User', department: 'Sales', domain: 'IT', status: 'Inactive' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', role: 'Editor', department: 'Marketing', domain: 'Finance', status: 'Active' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [ui, setUi] = useState({ showForm: false, editing: null as User | null });

  const handleSave = (userData: any) => {
    if (ui.editing) {
      setUsers(users.map(u => u.id === ui.editing!.id ? { ...u, ...userData } : u));
      toast.success('User updated successfully');
    } else {
      setUsers([...users, { ...userData, id: `${Date.now()}` }]);
      toast.success('New user created');
    }
    setUi({ showForm: false, editing: null });
  };

  const filtered = users.filter(u => Object.values(u).some(v => v.toString().toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="bg-indigo-600 -mt-8 -mx-8 p-10 mb-8 rounded-b-[40px] shadow-lg">
          <h1 className="text-3xl font-extrabold text-white">User Management</h1>
        </div>

        <div className="mb-8 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Search users by name, role or email..." value={search} onChange={(e) => setSearch(e.target.value)}
                   className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all outline-none" />
          </div>
          {!ui.showForm && <button onClick={() => setUi({ showForm: true, editing: null })} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 font-bold shadow-lg transition-transform active:scale-95">+ Add User</button>}
        </div>

        {ui.showForm && <UserForm onSave={handleSave} onCancel={() => setUi({ showForm: false, editing: null })} user={ui.editing} />}

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden p-2">
          <List>
            {filtered.map((user) => (
              <ListItem key={user.id} divider className="hover:bg-indigo-50/30 transition-colors rounded-2xl" 
                  secondaryAction={
                  <div className="flex gap-1 pr-2">
                    <IconButton onClick={() => setUi({ showForm: true, editing: user })} size="small"><EditIcon className="text-indigo-600" fontSize="small" /></IconButton>
                    <IconButton onClick={() => { setUsers(users.filter(u => u.id !== user.id)); toast.error('User deleted'); }} size="small"><DeleteIcon className="text-red-400" fontSize="small" /></IconButton>
                  </div>
                }>
                <ListItemButton component={Link} href={`#`} className="rounded-2xl py-3" onClick={(e) => e.preventDefault()}>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4"><PersonIcon className="text-indigo-600" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{user.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{user.status}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{user.email}</span>
                      <span className="font-medium text-indigo-600">{user.role} • {user.department}</span>
                    </div>
                  </div>
                </ListItemButton>
              </ListItem>
            ))}
            {filtered.length === 0 && <div className="p-12 text-center text-gray-400 font-medium">No matches found for "{search}".</div>}
          </List>
        </div>
      </main>
    </div>
  );
}