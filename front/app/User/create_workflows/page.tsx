//front/app/User/create_workflows/page.tsx


import React from 'react'
import WorkflowEditor from '../../Workflows/_components/WorkflowEditor';

const CreateWorkflowsPage = () => {
  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Create a New Workflow</h1>
        <p className="text-gray-500">Drag and drop elements to build your process.</p>
      </div>
      <div className="border rounded-lg shadow-sm h-[calc(100vh-140px)] min-h-150 bg-white overflow-hidden">
        <WorkflowEditor />
      </div>
    </div>
  )
};

export default CreateWorkflowsPage

