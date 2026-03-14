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
import ParallelJoinNode from './nodes/ParallelJoinNode';
import ParallelSplitNode from './nodes/ParallelSplitNode';
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
    parallel_split: ParallelSplitNode,
    parallel_join: ParallelJoinNode,
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
    const designerNodeId = searchParams.get('designerNodeId');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [workflowDomain, setWorkflowDomain] = useState('HR');
    const [workflowProjectId, setWorkflowProjectId] = useState<string>('');
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(workflowId);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false); // tracks unsaved changes
    const lastSavedMetaRef = useRef<{ name: string; domain: string; projectId?: string } | null>(null);

    // Default domain from user if available
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.domain) setWorkflowDomain(parsedUser.domain);
        }
    }, []);

    // Draft Persistence Logic & Double-firing Mitigation
    const draftKey = workflowId ? `workflow_draft_${workflowId}` : 'workflow_draft_new';
    const isInitialLoad = useRef(true);

    // 1. Initial Load (Draft or Server)
    useEffect(() => {
        if (!isInitialLoad.current) return;
        isInitialLoad.current = false;

        const loadWorkflow = async () => {
            const draftKey = `workflow_draft_${workflowId || 'new'}`;
            const draftData = localStorage.getItem(draftKey);
            let draft = null;
            if (draftData) {
                try {
                    draft = JSON.parse(draftData);
                } catch (e) {
                    console.error('Failed to parse draft:', e);
                }
            }

            if (workflowId) {
                try {
                    const response = await apiService.request(`/workflows/${workflowId}`);
                    if (response.success && response.data) {
                        const { name, nodes: loadedNodes, edges: loadedEdges, domain, projectId, updatedAt } = response.data;
                        
                        // If draft is newer than what's on server, use draft
                        if (draft && draft.savedAt > (new Date(updatedAt || 0).getTime())) {
                            console.log('[Draft] Loading newer local draft');
                            setWorkflowName(draft.name || name);
                            setWorkflowDomain(draft.domain || domain || 'HR');
                            setWorkflowProjectId(draft.projectId || projectId || '');
                            setNodes(draft.nodes || []);
                            setEdges(draft.edges || []);
                            setIsDirty(true);
                            toast.info('Newer local draft resumed');
                        } else {
                            setWorkflowName(name);
                            setWorkflowDomain(domain || 'HR');
                            setWorkflowProjectId(projectId || '');
                            setNodes(loadedNodes || []);
                            setEdges(loadedEdges || []);
                        }
                    }
                } catch (error) {
                    console.error('Failed to load workflow:', error);
                    toast.error('Error loading workflow');
                }
            } else if (draft && (draft.nodes?.length > 1 || draft.edges?.length > 0)) {
                // Loading "new" workflow but have a meaningful draft
                console.log('[Draft] Loading unsaved "new" workflow draft');
                setWorkflowName(draft.name || 'New Workflow');
                setWorkflowDomain(draft.domain || 'HR');
                setWorkflowProjectId(draft.projectId || '');
                setNodes(draft.nodes || initialNodes);
                setEdges(draft.edges || []);
                setIsDirty(true);
                toast.info('Draft resumed from previous session');
            }
        };
        loadWorkflow();
    }, [workflowId, setNodes, setEdges]);

    // 2. Auto-select Node Return Logic
    useEffect(() => {
        if (designerNodeId && nodes.length > 0) {
            const nodeToSelect = nodes.find(n => n.id === designerNodeId);
            if (nodeToSelect) {
                console.log('[Designer] Auto-selecting node from redirect:', designerNodeId);
                setSelectedNode(nodeToSelect);
                // Optionally remove the query param so refresh doesn't keep selecting it
                window.history.replaceState({}, '', `/create-workflow?id=${workflowId || ''}`);
            }
        }
    }, [designerNodeId, nodes.length]);

    // Mark as dirty when nodes/edges change (after initial load) + persist draft to localStorage
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            // Skip first render to avoid marking dirty on initial load
            const timer = setTimeout(() => { isFirstRender.current = false; }, 1500);
            return () => clearTimeout(timer);
        }
        setIsDirty(true);
        // Persist draft to localStorage so navigation doesn't lose changes
        const draftKey = `workflow_draft_${currentWorkflowId || 'new'}`;
        localStorage.setItem(draftKey, JSON.stringify({
            nodes,
            edges,
            name: workflowName,
            domain: workflowDomain,
            savedAt: Date.now()
        }));
    }, [nodes, edges]);

    // Auto-save every 30 seconds if dirty and workflow already exists
    useEffect(() => {
        const interval = setInterval(async () => {
            if (isDirty && currentWorkflowId && lastSavedMetaRef.current) {
                console.log('[AutoSave] Saving workflow...');
                await handleSave(lastSavedMetaRef.current);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [isDirty, currentWorkflowId]);

    // Save before page unload / navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

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
                            type === 'start' ? 'Start' :
                                type === 'parallel_split' ? 'Start Parallel' :
                                    type === 'parallel_join' ? 'Sync Join' : 'End Workflow'
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

    const handleSave = useCallback(async (meta: { name: string; domain: string; projectId?: string; status?: string }) => {
        try {
            setIsSaving(true);
            lastSavedMetaRef.current = meta;

            const payload = {
                name: meta.name,
                domain: meta.domain || 'HR',
                projectId: meta.projectId,
                description: "Workflow created via visual editor",
                nodes: nodes,
                edges: edges,
                status: meta.status || 'draft'
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
                setIsDirty(false);
                // Clear draft on successful save
                const draftKey = `workflow_draft_${currentWorkflowId || 'new'}`;
                localStorage.removeItem(draftKey);
                
                toast.success(currentWorkflowId ? 'Workflow updated!' : 'Workflow created!');
                setWorkflowName(meta.name);
                // SUCCESS: Remove current draft
                localStorage.removeItem(draftKey);
                // Also remove generic draft if it was a new creation that just got an ID
                if (!workflowId) localStorage.removeItem('workflow_draft_new');
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

    const [isLocked, setIsLocked] = useState(false);

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
                    panOnScroll={!isLocked}
                    panOnDrag={!isLocked}
                    zoomOnScroll={!isLocked}
                    zoomOnPinch={!isLocked}
                >
                    <Controls onInteractiveChange={(interactive) => setIsLocked(!interactive)} />
                    <MiniMap />
                    <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
                </ReactFlow>
            </div>
            {selectedNode && (
                <NodeDetailsPanel
                    selectedNode={selectedNode}
                    workflowId={currentWorkflowId}
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
