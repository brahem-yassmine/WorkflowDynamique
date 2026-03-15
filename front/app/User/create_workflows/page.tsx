'use client';

import React, { Suspense } from 'react'
import WorkflowEditor from '../../Workflows/_components/WorkflowEditor';
import { useSearchParams } from 'next/navigation';

const CreateWorkflowsPageContent = () => {
  const searchParams = useSearchParams();
  const isEdit = !!searchParams.get('id');

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{isEdit ? 'Refine Operational Design' : 'Create a New Workflow'}</h1>
        <p className="text-gray-500">{isEdit ? 'Update your process mapping and node configurations.' : 'Drag and drop elements to build your process.'}</p>
      </div>
      <div className="border rounded-lg shadow-sm h-[calc(100vh-140px)] min-h-150 bg-white overflow-hidden">
        <WorkflowEditor />
      </div>
    </div>
  )
};

export default function CreateWorkflowsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateWorkflowsPageContent />
    </Suspense>
  );
}
