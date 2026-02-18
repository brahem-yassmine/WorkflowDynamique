"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Controls,
    Background,
    MiniMap,
    Connection,
    Edge,
    Node,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Sidebar from './Sidebar';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import ActionNode from './nodes/ActionNode';

const nodeTypes = {
    start: StartNode,
    end: EndNode,
    action: ActionNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'start',
        data: { label: 'Début' },
        position: { x: 250, y: 5 },
    },
];

import NodeDetailsPanel from './NodeDetailsPanel';

let id = 0;
const getId = () => `dndnode_${id++}`;

const WorkflowEditorContent = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { screenToFlowPosition } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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
            const payloadString = event.dataTransfer.getData('application/reactflow-payload');
            const payload = payloadString ? JSON.parse(payloadString) : {};

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: getId(),
                type,
                position,
                data: { label: `${type}`, ...payload },
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
                    return { ...node, data };
                }
                return node;
            })
        );
        // Mettre à jour le noeud sélectionné également pour refléter les changements dans le panneau
        setSelectedNode((prev) => prev && prev.id === id ? { ...prev, data } : prev);
    }, [setNodes]);

    return (
        <div className="flex flex-row h-full w-full relative">
            <Sidebar />
            <div
                className="flex-grow w-full h-full bg-slate-50 border-2 border-dashed border-slate-300 relative"
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
                    snapGrid={[20, 20]}
                >
                    <Controls />
                    <MiniMap />
                    <Background color="#ccc" variant={BackgroundVariant.Dots} gap={20} size={1} />
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
};

const WorkflowEditor = () => {
    return (
        <div className="h-full w-full">
            <ReactFlowProvider>
                <WorkflowEditorContent />
            </ReactFlowProvider>
        </div>
    );
};

export default WorkflowEditor;
