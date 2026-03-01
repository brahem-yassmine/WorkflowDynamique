// front/app/Workflows/_components/WorkflowEditor.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,  // Important: import from @xyflow/react
    useReactFlow,        // Hook used in the content
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Sidebar from './Sidebar';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import SaveButton from './SaveButton';
import NodeDetailsPanel from './NodeDetailsPanel';
import { apiService } from '@/service/api.service';

import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Node types (defined outside the component to avoid unnecessary re-renders)
const nodeTypes = {
    start: StartNode,
    end: EndNode,
    action: ActionNode,
    condition: ConditionNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'start',
        data: { label: 'Start' },
        position: { x: 250, y: 5 },
    },
];

const getId = (type: string) => `node_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// Internal component using useReactFlow
function WorkflowEditorContent() {
    const searchParams = useSearchParams();
    const workflowId = searchParams.get('id');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [workflowDomain, setWorkflowDomain] = useState('HR');
    const [workflowProjectId, setWorkflowProjectId] = useState<string>('');
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(workflowId);
    const [isSaving, setIsSaving] = useState(false);

    // Initial load
    useEffect(() => {
        if (workflowId) {
            const loadWorkflow = async () => {
                try {
                    const response = await apiService.request(`/workflows/${workflowId}`);
                    if (response.success && response.data) {
                        const { name, nodes: loadedNodes, edges: loadedEdges, domain, projectId } = response.data;
                        setWorkflowName(name);
                        setWorkflowDomain(domain || 'HR');
                        setWorkflowProjectId(projectId || '');
                        setNodes(loadedNodes || []);
                        setEdges(loadedEdges || []);
                    }
                } catch (error) {
                    console.error('Failed to load workflow:', error);
                    alert('Error loading workflow');
                }
            };
            loadWorkflow();
        }
    }, [workflowId, setNodes, setEdges]);

    // useReactFlow is used here, inside ReactFlowProvider
    const { screenToFlowPosition } = useReactFlow();

    const onConnect = useCallback(
        (params: Connection) => {
            const newEdge: Edge = {
                ...params,
                id: `edge_${Date.now()}`,
                animated: true,
                style: { strokeWidth: 2 },
            };
            // Logic for condition nodes handles
            if (params.sourceHandle === 'yes') {
                newEdge.style = { stroke: '#10b981', strokeWidth: 3 };
                newEdge.label = 'Yes';
            } else if (params.sourceHandle === 'no') {
                newEdge.style = { stroke: '#ef4444', strokeWidth: 3 };
                newEdge.label = 'No';
            }

            setEdges((eds) => addEdge(newEdge, eds));
        },
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: getId(type),
                type,
                position,
                data: {
                    label: type === 'condition' ? 'New Condition' :
                        type === 'action' ? 'New Task' :
                            type === 'start' ? 'Start' : 'End'
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const onNodeUpdate = useCallback((id: string, data: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            })
        );
        setSelectedNode((prev) => prev && prev.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev);
    }, [setNodes]);

    const onNodeDelete = useCallback((id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        setSelectedNode(null);
    }, [setNodes, setEdges]);

    const handleSave = useCallback(async (meta: { name: string; domain: string; projectId?: string }) => {
        try {
            setIsSaving(true);

            const payload = {
                name: meta.name,
                domain: meta.domain || 'HR',
                projectId: meta.projectId,
                description: "Workflow created via visual editor",
                nodes: nodes,
                edges: edges,
                status: 'draft'
            };

            let response;
            if (currentWorkflowId) {
                response = await apiService.updateWorkflow(currentWorkflowId, payload);
            } else {
                response = await apiService.createWorkflow(payload);
                if (response.success && response.data?._id) {
                    setCurrentWorkflowId(response.data._id);
                }
            }

            if (response.success) {
                toast.success(currentWorkflowId ? 'Workflow updated successfully!' : 'Workflow created successfully!');
                setWorkflowName(meta.name);
            } else {
                toast.error('Save error: ' + (response.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Workflow save error:', error);
            toast.error('Server connection error: ' + error.message);
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [nodes, edges, currentWorkflowId]);

    return (
        <div className="flex flex-row h-full w-full relative">
            <Sidebar />
            <SaveButton
                onSave={handleSave}
                isSaving={isSaving}
                initialName={workflowName}
                initialDomain={workflowDomain}
                initialProjectId={workflowProjectId}
            />
            <div
                className="flex-grow h-full bg-slate-50"
                ref={reactFlowWrapper}
                onDrop={onDrop}
                onDragOver={onDragOver}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    minZoom={0.2}
                    maxZoom={2}
                    fitView
                    fitViewOptions={{ maxZoom: 1 }}
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                >
                    <Controls />
                    <MiniMap />
                    <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
                </ReactFlow>
            </div>
            {selectedNode && (
                <NodeDetailsPanel
                    selectedNode={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={onNodeUpdate}
                    onDelete={onNodeDelete}
                />
            )}
        </div>
    );
}

// Main component with Provider on the outside
export default function WorkflowEditor() {
    return (
        <ReactFlowProvider>
            <React.Suspense fallback={<div>Loading editor...</div>}>
                <WorkflowEditorContent />
            </React.Suspense>
        </ReactFlowProvider>
    );
}
