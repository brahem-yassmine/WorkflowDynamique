import React from 'react'
import WorkflowEditor from '../../Workflows/_components/WorkflowEditor';

const CreateWorkflowsPage = () => {
  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Créer un nouveau Workflow</h1>
        <p className="text-gray-500">Glissez-déposez les éléments pour construire votre processus.</p>
      </div>
      <div className="border rounded-lg shadow-sm h-[calc(100vh-140px)] min-h-[600px] bg-white overflow-hidden">
        <WorkflowEditor />
      </div>
    </div>
  )
};

export default CreateWorkflowsPage

