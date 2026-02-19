// front/app/Workflows/_components/WorkflowEditor.tsx
"use client";

import React, { useState, useCallback, useRef } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,  // Important: import depuis @xyflow/react
    useReactFlow,        // Hook utilisé dans le contenu
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

// Types de nœuds (définis à l'extérieur du composant pour éviter les re-rendus inutiles)
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
        data: { label: 'Début' },
        position: { x: 250, y: 5 },
    },
];

let nodeId = 2;
const getId = () => `node_${nodeId++}`;

// Composant interne qui utilise useReactFlow
function WorkflowEditorContent() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [workflowName, setWorkflowName] = useState('Nouveau workflow');
    
    // ✅ useReactFlow est utilisé ici, à l'intérieur du ReactFlowProvider
    const { screenToFlowPosition } = useReactFlow();

    const onConnect = useCallback(
        (params: Connection) => {
            const newEdge: Edge = {
                ...params,
                id: `edge_${Date.now()}`,
                animated: true,
            };
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
                id: getId(),
                type,
                position,
                data: { 
                    label: type === 'condition' ? 'Nouvelle condition' : 
                           type === 'action' ? 'Nouvelle tâche' : 
                           type === 'start' ? 'Début' : 'Fin'
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

    const handleSave = useCallback((workflowData: any) => {
        console.log('Workflow sauvegardé:', workflowData);
        setWorkflowName(workflowData.name);
    }, []);

    return (
        <div className="flex flex-row h-full w-full relative">
            <Sidebar />
            <SaveButton 
                nodes={nodes}
                edges={edges}
                workflowName={workflowName}
                onSave={handleSave}
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
                    fitView
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
                />
            )}
        </div>
    );
}

// Composant principal avec le Provider à l'extérieur
export default function WorkflowEditor() {
    return (
        <ReactFlowProvider>
            <WorkflowEditorContent />
        </ReactFlowProvider>
    );
}