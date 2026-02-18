// 'use client'
// import Link from 'next/link'; 

// import * as React from 'react';
// import { useState } from 'react';
// import List from '@mui/material/List';
// import ListItem from '@mui/material/ListItem';
// import ListItemButton from '@mui/material/ListItemButton';
// import ListItemIcon from '@mui/material/ListItemIcon';
// import ListItemText from '@mui/material/ListItemText';
// import Checkbox from '@mui/material/Checkbox';
// import IconButton from '@mui/material/IconButton';
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
// import PersonIcon from '@mui/icons-material/Person';

// function Sidebar() {
//   return (
//     <aside className="w-64 bg-indigo-700 text-white flex flex-col h-full fixed">
//       <div className="p-6">
//         <h1 className="text-2xl font-bold text-white">Axia Solutions</h1>
//         <p className="text-indigo-200 text-sm mt-1">Admin panel</p>
//       </div>
      
//       <nav className="flex-1 mt-6 overflow-y-auto">
//         <div className="px-4 space-y-1">
//           <Link href="/essai" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//               <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
//               <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
//             </svg>
//             <span className="text-sm font-medium flex-1">Global Dashboard</span>
//           </Link>
          
//           <Link href="/essai/user-management" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//             </svg>
//             <span className="text-sm font-medium">User Managment</span>
//           </Link>
//           <Link href="/essai/roles" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//             </svg>
//             <span className="text-sm font-medium">Roles</span>
//           </Link>
          
//           <Link href="/essai/workflows" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//             </svg>
//             <span className="text-sm font-medium">Workflows</span>
//           </Link>
          
//           <Link href="/essai/create" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <span className="text-sm font-medium">Create</span>
//           </Link>
          
//           <Link href="/essai/tasks" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
//             </svg>
//             <span className="text-sm font-medium">Tasks</span>
//           </Link>
          
//           <Link href="/essai/reports" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0_1-2-2z" />
//              </svg>
//                          <span className="text-sm font-medium">reports</span>

//           </Link>


//           <Link href="/essai/notifications" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//             </svg>
//             <span className="text-sm font-medium">Notifications</span>
//           </Link>
          
//           <Link href="/essai/billing" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//             </svg>
//             <span className="text-sm font-medium">Billing</span>
//           </Link>
          
//           <Link href="/essai/logs" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
//             </svg>
//             <span className="text-sm font-medium">Logs & History</span>
//           </Link>
          
//           <Link href="/essai/profile" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//             </svg>
//             <span className="text-sm font-medium">Profile</span>
//           </Link>
//         </div>
//       </nav>


// <div className="p-4 border-t border-indigo-600">
//   <Link href="/">
//     <button className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-indigo-800 rounded-lg w-full transition-colors">
//       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//       </svg>
//       <span className="text-sm font-medium">Logout</span>
//     </button>
//   </Link>
// </div>
//     </aside>
//   );
// }


// // Modal pour ajouter/modifier un utilisateur
// interface UserModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (userData: any) => void;
//   user?: any;
// }

// function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
//   const [formData, setFormData] = useState({
//     name: user?.name || '',
//     email: user?.email || '',
//     role: user?.role || 'User',
//     department: user?.department || 'IT',
//     domain: user?.domain || 'IT',
//     status: user?.status || 'Active'
//   });

//   if (!isOpen) return null;

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     onSave(formData);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md">
//         <h2 className="text-2xl font-bold mb-4">{user ? 'Edit User' : 'Add New User'}</h2>
//         <form onSubmit={handleSubmit}>
//           {/* Formulaire (identique à avant) */}
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//               <input
//                 type="text"
//                 required
//                 value={formData.name}
//                 onChange={(e) => setFormData({...formData, name: e.target.value})}
//                 className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//               <input
//                 type="email"
//                 required
//                 value={formData.email}
//                 onChange={(e) => setFormData({...formData, email: e.target.value})}
//                 className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//               <select
//                 value={formData.role}
//                 onChange={(e) => setFormData({...formData, role: e.target.value})}
//                 className="w-full p-2 border border-gray-300 rounded-lg"
//               >
//                 <option value="Admin">Admin</option>
//                 <option value="Manager">Manager</option>
//                 <option value="User">User</option>
//                 <option value="Editor">Editor</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
//               <select
//                 value={formData.department}
//                 onChange={(e) => setFormData({...formData, department: e.target.value})}
//                 className="w-full p-2 border border-gray-300 rounded-lg"
//               >
//                 <option value="IT">IT</option>
//                 <option value="Operations">Operations</option>
//                 <option value="Sales">Sales</option>
//                 <option value="Marketing">Marketing</option>
//                 <option value="HR">HR</option>
//                 <option value="Finance">Finance</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
//               <select
//                 value={formData.domain}
//                 onChange={(e) => setFormData({...formData, domain: e.target.value})}
//                 className="w-full p-2 border border-gray-300 rounded-lg"
//               >
//                 <option value="Finance">Finance</option>
//                 <option value="Operations">Operations</option>
//                 <option value="IT">IT</option>
//                 <option value="Marketing">Marketing</option>
//                 <option value="Sales">Sales</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//               <select
//                 value={formData.status}
//                 onChange={(e) => setFormData({...formData, status: e.target.value})}
//                 className="w-full p-2 border border-gray-300 rounded-lg"
//               >
//                 <option value="Active">Active</option>
//                 <option value="Inactive">Inactive</option>
//               </select>
//             </div>
//           </div>
//           <div className="flex justify-end gap-2 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//             >
//               {user ? 'Update' : 'Add'} User
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Composant pour afficher les détails d'un utilisateur
// interface UserDetailsProps {
//   user: any | null;
//   onClose: () => void;
//   onEdit: (user: any) => void;
//   onDelete: (userId: string) => void;
//   onStatusChange: (userId: string) => void;
// }

// function UserDetails({ user, onClose, onEdit, onDelete, onStatusChange }: UserDetailsProps) {
//   if (!user) return null;

//   return (
//     <div className="mt-6 bg-white rounded-lg shadow-lg p-6 border-2 border-indigo-200">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-xl font-semibold text-gray-800">User Details</h3>
//         <button
//           onClick={onClose}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           ✕
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Informations personnelles */}
//         <div className="space-y-4">
//           <h4 className="font-medium text-gray-700 border-b pb-2">Personal Information</h4>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-gray-500">Name</p>
//               <p className="font-medium">{user.name}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Email</p>
//               <p className="font-medium">{user.email}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">User ID</p>
//               <p className="font-medium text-xs bg-gray-100 p-1 rounded">{user.id}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Status</p>
//               <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
//                 user.status === 'Active' 
//                   ? 'bg-green-100 text-green-800' 
//                   : 'bg-yellow-100 text-yellow-800'
//               }`}>
//                 {user.status}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Rôle et département */}
//         <div className="space-y-4">
//           <h4 className="font-medium text-gray-700 border-b pb-2">Role & Department</h4>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-gray-500">Role</p>
//               <p className="font-medium bg-indigo-50 p-2 rounded">{user.role}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Department</p>
//               <p className="font-medium bg-indigo-50 p-2 rounded">{user.department}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Domain</p>
//               <p className="font-medium bg-indigo-50 p-2 rounded">{user.domain}</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Actions pour l'utilisateur */}
//       <div className="mt-6 pt-4 border-t">
//         <h4 className="font-medium text-gray-700 mb-3">Actions</h4>
//         <div className="flex flex-wrap gap-3">
//           <button
//             onClick={() => onEdit(user)}
//             className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
//           >
//             <EditIcon fontSize="small" />
//             Edit User
//           </button>
//           <button
//             onClick={() => onStatusChange(user.id)}
//             className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
//               user.status === 'Active' 
//                 ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
//                 : 'bg-green-600 hover:bg-green-700 text-white'
//             }`}
//           >
//             {user.status === 'Active' ? 'Deactivate' : 'Activate'} User
//           </button>
//           <button
//             onClick={() => onDelete(user.id)}
//             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
//           >
//             <DeleteIcon fontSize="small" />
//             Delete User
//           </button>
//         </div>
//       </div>

//       {/* Audit Info */}
//       <div className="mt-4 text-xs text-gray-400 border-t pt-2">
//         <p>Last updated: Just now • Created: 2 days ago</p>
//       </div>
//     </div>
//   );
// }

// // Données initiales simulées
// const INITIAL_USERS = [
//   { 
//     id: '1', 
//     name: 'John Doe', 
//     email: 'john@example.com', 
//     role: 'Admin', 
//     department: 'IT', 
//     domain: 'Finance', 
//     status: 'Active' 
//   },
//   { 
//     id: '2', 
//     name: 'Jane Smith', 
//     email: 'jane@example.com', 
//     role: 'Manager', 
//     department: 'Operations', 
//     domain: 'Operations', 
//     status: 'Active' 
//   },
//   { 
//     id: '3', 
//     name: 'Mike Johnson', 
//     email: 'mike@example.com', 
//     role: 'User', 
//     department: 'Sales', 
//     domain: 'IT', 
//     status: 'Inactive' 
//   },
//   { 
//     id: '4', 
//     name: 'Sarah Williams', 
//     email: 'sarah@example.com', 
//     role: 'Editor', 
//     department: 'Marketing', 
//     domain: 'Finance', 
//     status: 'Active' 
//   },
// ];

// export default function UserManagementPage() {
//   const [users, setUsers] = useState(INITIAL_USERS);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [selectedUserForDetails, setSelectedUserForDetails] = useState(null); // Nouvel état pour les détails
//   const [showBulkActions, setShowBulkActions] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState(null);

//   // Gestion de la sélection multiple (checkbox)
//   const handleToggle = (userId: string) => () => {
//     const currentIndex = selectedUsers.indexOf(userId);
//     const newSelected = [...selectedUsers];

//     if (currentIndex === -1) {
//       newSelected.push(userId);
//     } else {
//       newSelected.splice(currentIndex, 1);
//     }

//     setSelectedUsers(newSelected);
//     setShowBulkActions(newSelected.length > 0);
//   };

//   // Sélectionner un utilisateur pour voir ses détails (clic sur la ligne)
//   const handleUserSelect = (user) => {
//     setSelectedUserForDetails(user);
//   };

//   // Fermer les détails
//   const handleCloseDetails = () => {
//     setSelectedUserForDetails(null);
//   };

//   // Sélectionner/désélectionner tous les utilisateurs
//   const handleSelectAll = () => {
//     if (selectedUsers.length === filteredUsers.length) {
//       setSelectedUsers([]);
//       setShowBulkActions(false);
//     } else {
//       setSelectedUsers(filteredUsers.map(user => user.id));
//       setShowBulkActions(true);
//     }
//   };

//   // Actions individuelles
//   const handleEditUser = (user) => {
//     setEditingUser(user);
//     setModalOpen(true);
//   };

//   const handleDeleteUser = (userId) => {
//     if (window.confirm('Are you sure you want to delete this user?')) {
//       const updatedUsers = users.filter(user => user.id !== userId);
//       setUsers(updatedUsers);
//       setSelectedUsers(selectedUsers.filter(id => id !== userId));
//       if (selectedUserForDetails?.id === userId) {
//         setSelectedUserForDetails(null);
//       }
//     }
//   };

//   const handleStatusChange = (userId) => {
//     const updatedUsers = users.map(user => 
//       user.id === userId 
//         ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' } 
//         : user
//     );
//     setUsers(updatedUsers);
//     if (selectedUserForDetails?.id === userId) {
//       setSelectedUserForDetails(updatedUsers.find(u => u.id === userId));
//     }
//   };

//   const handleSaveUser = (userData) => {
//     if (editingUser) {
//       // Modification
//       const updatedUsers = users.map(user => 
//         user.id === editingUser.id ? { ...user, ...userData } : user
//       );
//       setUsers(updatedUsers);
//       if (selectedUserForDetails?.id === editingUser.id) {
//         setSelectedUserForDetails({ ...editingUser, ...userData });
//       }
//     } else {
//       // Ajout
//       const newUser = {
//         ...userData,
//         id: `${users.length + 1}`
//       };
//       setUsers([...users, newUser]);
//     }
//     setModalOpen(false);
//     setEditingUser(null);
//   };

//   // Actions en masse (conservées)
//   const handleBulkRoleChange = (newRole) => {
//     const updatedUsers = users.map(user => 
//       selectedUsers.includes(user.id) ? { ...user, role: newRole } : user
//     );
//     setUsers(updatedUsers);
//     if (selectedUserForDetails && selectedUsers.includes(selectedUserForDetails.id)) {
//       setSelectedUserForDetails(updatedUsers.find(u => u.id === selectedUserForDetails.id));
//     }
//     setSelectedUsers([]);
//     setShowBulkActions(false);
//     alert(`Roles updated successfully for ${selectedUsers.length} users`);
//   };

//   const handleBulkDepartmentChange = (newDepartment) => {
//     const updatedUsers = users.map(user => 
//       selectedUsers.includes(user.id) ? { ...user, department: newDepartment } : user
//     );
//     setUsers(updatedUsers);
//     if (selectedUserForDetails && selectedUsers.includes(selectedUserForDetails.id)) {
//       setSelectedUserForDetails(updatedUsers.find(u => u.id === selectedUserForDetails.id));
//     }
//     setSelectedUsers([]);
//     setShowBulkActions(false);
//     alert(`Departments updated successfully for ${selectedUsers.length} users`);
//   };

//   const handleBulkDomainChange = (newDomain) => {
//     const updatedUsers = users.map(user => 
//       selectedUsers.includes(user.id) ? { ...user, domain: newDomain } : user
//     );
//     setUsers(updatedUsers);
//     if (selectedUserForDetails && selectedUsers.includes(selectedUserForDetails.id)) {
//       setSelectedUserForDetails(updatedUsers.find(u => u.id === selectedUserForDetails.id));
//     }
//     setSelectedUsers([]);
//     setShowBulkActions(false);
//     alert(`Domains updated successfully for ${selectedUsers.length} users`);
//   };

//   const handleBulkActivate = () => {
//     const updatedUsers = users.map(user => 
//       selectedUsers.includes(user.id) ? { ...user, status: 'Active' } : user
//     );
//     setUsers(updatedUsers);
//     if (selectedUserForDetails && selectedUsers.includes(selectedUserForDetails.id)) {
//       setSelectedUserForDetails(updatedUsers.find(u => u.id === selectedUserForDetails.id));
//     }
//     setSelectedUsers([]);
//     setShowBulkActions(false);
//     alert(`Users activated successfully for ${selectedUsers.length} users`);
//   };

//   const handleBulkDeactivate = () => {
//     const updatedUsers = users.map(user => 
//       selectedUsers.includes(user.id) ? { ...user, status: 'Inactive' } : user
//     );
//     setUsers(updatedUsers);
//     if (selectedUserForDetails && selectedUsers.includes(selectedUserForDetails.id)) {
//       setSelectedUserForDetails(updatedUsers.find(u => u.id === selectedUserForDetails.id));
//     }
//     setSelectedUsers([]);
//     setShowBulkActions(false);
//     alert(`Users deactivated successfully for ${selectedUsers.length} users`);
//   };

//   const handleBulkDelete = () => {
//     if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
//       const updatedUsers = users.filter(user => !selectedUsers.includes(user.id));
//       setUsers(updatedUsers);
//       if (selectedUserForDetails && selectedUsers.includes(selectedUserForDetails.id)) {
//         setSelectedUserForDetails(null);
//       }
//       setSelectedUsers([]);
//       setShowBulkActions(false);
//       alert(`Users deleted successfully`);
//     }
//   };

//   // Filtrage des utilisateurs
//   const filteredUsers = users.filter(user => 
//     user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.department.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const selectedUsersData = users.filter(user => selectedUsers.includes(user.id));

//   return (
//     <div className="flex h-screen bg-gray-50">
//       <Sidebar />
//       <main className="flex-1 ml-64 p-8 overflow-y-auto">
//         {/* Modal */}
//         <UserModal
//           isOpen={modalOpen}
//           onClose={() => {
//             setModalOpen(false);
//             setEditingUser(null);
//           }}
//           onSave={handleSaveUser}
//           user={editingUser}
//         />

//         {/* Header */}
//         <div className="bg-indigo-600 -mt-8 -mx-8 p-8 mb-6">
//           <h1 className="text-3xl font-bold text-white">User Management</h1>
//           <p className="text-indigo-200">Manage your users</p>
//         </div>

//         {/* Search Bar and Add Button */}
//         <div className="mb-6 flex gap-4">
//           <div className="relative flex-1">
//             <input 
//               type="text" 
//               placeholder="Search users..." 
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             />
//             <span className="absolute left-3 top-3 text-gray-400">🔍</span>
//           </div>
//           <button
//             onClick={() => {
//               setEditingUser(null);
//               setModalOpen(true);
//             }}
//             className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
//           >
//             + Add User
//           </button>
//         </div>

//         {/* Select All and Bulk Actions */}
//         <div className="mb-4 flex justify-between items-center">
//           <button
//             onClick={handleSelectAll}
//             className="text-indigo-600 hover:text-indigo-800 font-medium"
//           >
//             {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
//           </button>
//           <span className="text-gray-600">
//             {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
//           </span>
//         </div>

//         {/* User List */}
//         <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
//           {filteredUsers.map((user) => {
//             const labelId = `checkbox-list-label-${user.id}`;

//             return (
//               <ListItem
//                 key={user.id}
//                 secondaryAction={
//                   <div className="flex gap-2">
//                     <IconButton 
//                       edge="end" 
//                       aria-label="edit" 
//                       size="small"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleEditUser(user);
//                       }}
//                     >
//                       <EditIcon fontSize="small" className="text-indigo-600" />
//                     </IconButton>
//                     <IconButton 
//                       edge="end" 
//                       aria-label="delete" 
//                       size="small"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDeleteUser(user.id);
//                       }}
//                     >
//                       <DeleteIcon fontSize="small" className="text-red-600" />
//                     </IconButton>
//                   </div>
//                 }
//                 disablePadding
//                 className={`border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
//                   selectedUsers.includes(user.id) ? 'bg-indigo-50' : ''
//                 } ${selectedUserForDetails?.id === user.id ? 'border-l-4 border-indigo-500' : ''}`}
//               >
//                 <ListItemButton 
//                   role={undefined} 
//                   onClick={() => handleUserSelect(user)} 
//                   dense
//                 >
//                   <ListItemIcon>
//                     <Checkbox
//                       edge="start"
//                       checked={selectedUsers.includes(user.id)}
//                       tabIndex={-1}
//                       disableRipple
//                       inputProps={{ 'aria-labelledby': labelId }}
//                       size="small"
//                       onClick={(e) => e.stopPropagation()}
//                       onChange={handleToggle(user.id)}
//                     />
//                   </ListItemIcon>
//                   <div className="flex items-center gap-3 flex-1">
//                     <PersonIcon className="text-gray-400" fontSize="small" />
//                     <div className="flex-1">
//                       <ListItemText 
//                         id={labelId} 
//                         primary={user.name} 
//                         secondary={user.email}
//                         primaryTypographyProps={{ className: 'font-medium' }}
//                         secondaryTypographyProps={{ className: 'text-sm' }}
//                       />
//                     </div>
//                     <div className="flex items-center gap-3 text-sm">
//                       <span className="px-2 py-1 bg-gray-100 rounded">{user.role}</span>
//                       <span className="px-2 py-1 bg-gray-100 rounded">{user.department}</span>
//                       <span className="px-2 py-1 bg-gray-100 rounded">{user.domain}</span>
//                       <span className={`px-2 py-1 rounded ${
//                         user.status === 'Active' 
//                           ? 'bg-green-100 text-green-800' 
//                           : 'bg-yellow-100 text-yellow-800'
//                       }`}>
//                         {user.status}
//                       </span>
//                     </div>
//                   </div>
//                 </ListItemButton>
//               </ListItem>
//             );
//           })}
//         </List>

//         {/* Bulk Actions Panel */}
//         {showBulkActions && (
//           <div className="mt-6 bg-white rounded-lg shadow-lg p-6 border-2 border-indigo-200">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-xl font-semibold text-gray-800">
//                 Bulk Actions ({selectedUsers.length} users selected)
//               </h3>
//               <button
//                 onClick={() => {
//                   setSelectedUsers([]);
//                   setShowBulkActions(false);
//                 }}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Selected Users Preview */}
//             <div className="mb-4 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
//               <p className="text-sm font-medium text-gray-700 mb-2">Selected users:</p>
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
//                 {selectedUsersData.map(user => (
//                   <div key={user.id} className="text-sm text-gray-600">
//                     • {user.name} ({user.email})
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Bulk Action Buttons */}
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
//               {/* Assign Role */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">Assign Role</label>
//                 <select
//                   onChange={(e) => handleBulkRoleChange(e.target.value)}
//                   className="w-full p-2 border border-gray-300 rounded-lg"
//                   defaultValue=""
//                 >
//                   <option value="" disabled>Select role</option>
//                   <option value="Admin">Admin</option>
//                   <option value="Manager">Manager</option>
//                   <option value="User">User</option>
//                   <option value="Editor">Editor</option>
//                 </select>
//               </div>

//               {/* Assign Department */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">Assign Department</label>
//                 <select
//                   onChange={(e) => handleBulkDepartmentChange(e.target.value)}
//                   className="w-full p-2 border border-gray-300 rounded-lg"
//                   defaultValue=""
//                 >
//                   <option value="" disabled>Select department</option>
//                   <option value="IT">IT</option>
//                   <option value="Operations">Operations</option>
//                   <option value="Sales">Sales</option>
//                   <option value="Marketing">Marketing</option>
//                   <option value="HR">HR</option>
//                   <option value="Finance">Finance</option>
//                 </select>
//               </div>

//               {/* Assign Domain */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">Assign Domain</label>
//                 <select
//                   onChange={(e) => handleBulkDomainChange(e.target.value)}
//                   className="w-full p-2 border border-gray-300 rounded-lg"
//                   defaultValue=""
//                 >
//                   <option value="" disabled>Select domain</option>
//                   <option value="Finance">Finance</option>
//                   <option value="Operations">Operations</option>
//                   <option value="IT">IT</option>
//                   <option value="Marketing">Marketing</option>
//                   <option value="Sales">Sales</option>
//                 </select>
//               </div>

//               {/* Activate/Deactivate */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">Status</label>
//                 <div className="grid grid-cols-2 gap-2">
//                   <button
//                     onClick={handleBulkActivate}
//                     className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
//                   >
//                     Activate
//                   </button>
//                   <button
//                     onClick={handleBulkDeactivate}
//                     className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 text-sm"
//                   >
//                     Deactivate
//                   </button>
//                 </div>
//               </div>

//               {/* Delete */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">Danger Zone</label>
//                 <button
//                   onClick={handleBulkDelete}
//                   className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
//                 >
//                   Delete Selected
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* User Details Section */}
//         <UserDetails
//           user={selectedUserForDetails}
//           onClose={handleCloseDetails}
//           onEdit={handleEditUser}
//           onDelete={handleDeleteUser}
//           onStatusChange={handleStatusChange}
//         />

//         {/* Pagination */}
//         <div className="mt-4 text-sm text-gray-500">
//           Showing {filteredUsers.length} of {users.length} users
//         </div>
//       </main>
//     </div>
//   );
// }