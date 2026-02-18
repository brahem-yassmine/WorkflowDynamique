// app/tasks/page.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';

import Sidebar from '../components/sidebar';

// Types pour les tâches
interface Task {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  description: string;
  assignedTo: string;
  state: 'pending' | 'in-progress' | 'done';
  comments: number;
  attachments: number;
  warnings: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    // Pending Tasks
    { 
      id: '1', 
      name: 'Renew budget proposal', 
      priority: 'High', 
      category: 'Draft',
      description: 'Update and renew the annual budget proposal',
      assignedTo: 'John Doe',
      state: 'pending',
      comments: 0, 
      attachments: 1, 
      warnings: 1 
    },
    { 
      id: '2', 
      name: 'Plan Q kickoff', 
      priority: 'Medium', 
      category: 'Event',
      description: 'Plan the quarterly kickoff meeting',
      assignedTo: 'Jane Smith',
      state: 'pending',
      comments: 0, 
      attachments: 1, 
      warnings: 1 
    },
    { 
      id: '3', 
      name: 'Update marketing plan', 
      priority: 'Medium', 
      category: 'Brief',
      description: 'Refresh the marketing strategy document',
      assignedTo: 'Mike Johnson',
      state: 'in-progress',
      comments: 0, 
      attachments: 1, 
      warnings: 1 
    },
    { 
      id: '4', 
      name: 'New design flow', 
      priority: 'Low', 
      category: 'Strategy',
      description: 'Create new design workflow',
      assignedTo: 'Sarah Williams',
      state: 'in-progress',
      comments: 1, 
      attachments: 2, 
      warnings: 1 
    },
    { 
      id: '5', 
      name: 'Brand sync', 
      priority: 'High', 
      category: 'Meeting',
      description: 'Sync with brand team',
      assignedTo: 'David Brown',
      state: 'done',
      comments: 0, 
      attachments: 1, 
      warnings: 1 
    },
    { 
      id: '6', 
      name: 'LP mini-site', 
      priority: 'High', 
      category: 'Website',
      description: 'Create landing page mini-site',
      assignedTo: 'Emily Davis',
      state: 'done',
      comments: 0, 
      attachments: 1, 
      warnings: 1 
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    }
  };

  const handleStateChange = (taskId: string, newState: Task['state']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, state: newState } : task
    ));
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, state: newState });
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div 
      onClick={() => handleTaskClick(task)}
      className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
        task.state === 'pending' ? 'border-yellow-400' :
        task.state === 'in-progress' ? 'border-blue-400' :
        'border-green-400'
      }`}
    >
      <h4 className="font-medium text-gray-800 mb-2">{task.name}</h4>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
          {task.category}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px]">
            {task.comments}
          </span>
          <span>○</span>
          <span>{task.attachments}</span>
        </span>
        {task.warnings > 0 && (
          <span className="flex items-center gap-1 text-yellow-600">
            <WarningIcon fontSize="small" className="text-sm" />
            <span>{task.warnings}</span>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <div className="bg-indigo-600 -mt-8 -mx-8 p-8 mb-6">
          <h1 className="text-3xl font-bold text-white">Task Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Kanban Board */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">This week</h2>
            
            <div className="space-y-6">
              {/* Pending Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  To do
                </h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.state === 'pending').map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>

              {/* In Progress Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                  In progress
                </h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.state === 'in-progress').map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>

              {/* Done Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                  Done
                </h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.state === 'done').map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                    <AddIcon fontSize="small" />
                    Add new subitem...
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Task Details (API Tasks style) */}
          <div className="lg:col-span-1">
            {selectedTask ? (
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Task Details</h3>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Task Name */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-gray-600">Task name</div>
                    <div className="font-medium text-gray-600">Task name</div>
                    <div className="col-span-2 text-gray-800 font-medium">{selectedTask.name}</div>
                  </div>
                </div>

                {/* State */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">State</div>
                  <select
                    value={selectedTask.state}
                    onChange={(e) => handleStateChange(selectedTask.id, e.target.value as Task['state'])}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Details */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Details:</h4>
                  <div className="space-y-3">
                    {/* Description */}
                    <div className="flex items-start gap-2">
                      <DescriptionIcon fontSize="small" className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">description</div>
                        <div className="text-sm text-gray-800">{selectedTask.description}</div>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="flex items-start gap-2">
                      <CategoryIcon fontSize="small" className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">category</div>
                        <div className="text-sm text-gray-800">{selectedTask.category}</div>
                      </div>
                    </div>

                    {/* Assigned To */}
                    <div className="flex items-start gap-2">
                      <PersonIcon fontSize="small" className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">By...</div>
                        <div className="text-sm text-gray-800">{selectedTask.assignedTo}</div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-sm">⚠️</span>
                      <div>
                        <div className="text-xs text-gray-500">Priority</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-4 space-y-2">
                  <button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <DeleteIcon fontSize="small" />
                    delete task
                  </button>
                  
                  <button
                    onClick={() => handleStateChange(selectedTask.id, 
                      selectedTask.state === 'done' ? 'pending' : 
                      selectedTask.state === 'pending' ? 'in-progress' : 'done'
                    )}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <EditIcon fontSize="small" />
                    change state
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setShowAddModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <AddIcon fontSize="small" />
                    add task
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-4 text-xs text-gray-400 border-t pt-2">
                  © Task
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8 text-center text-gray-500">
                <p className="mb-2">Select a task to view details</p>
                <p className="text-sm">Click on any task from the list</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}