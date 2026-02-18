import React from 'react';
import WorkflowMonitor from '../../_components/WorkflowMonitor';

// Mock data generation for demonstration
const mockNodes = [
    { id: '1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
    { id: '2', type: 'action', position: { x: 300, y: 100 }, data: { label: 'Validation Manager', responsibleDomain: 'Direction' } },
    { id: '3', type: 'end', position: { x: 500, y: 100 }, data: { label: 'End' } },
];

const mockEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
];

const mockExecutionHistory = [
    { nodeId: '1', action: 'approved' },
    { nodeId: '2', action: 'approved' }
];

const mockCurrentNodeIds = ['3']; // Current active node is End (completed)

export default function InstancePage({ params }: { params: { instanceId: string } }) {
    // In a real app, fetch instance data using params.instanceId
    // const instance = await fetchInstance(params.instanceId);

    return (
        <div className="flex flex-col h-full w-full p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Suivi de l'instance</h1>
                <p className="text-gray-500">ID: {params.instanceId}</p>
                <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Statut: En cours</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Priorité: Moyenne</span>
                </div>
            </div>

            <div className="flex-grow border rounded-lg shadow-sm bg-white overflow-hidden min-h-[600px]">
                <WorkflowMonitor
                    initialNodes={mockNodes}
                    initialEdges={mockEdges}
                    currentNodeIds={mockCurrentNodeIds}
                    executionHistory={mockExecutionHistory}
                />
            </div>
        </div>
    );
}
