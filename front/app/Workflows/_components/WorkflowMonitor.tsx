"use client";

import React, { useEffect } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Node,
    Edge,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import ActionNode from './nodes/ActionNode';

const nodeTypes = {
    start: StartNode,
    end: EndNode,
    action: ActionNode,
};

interface WorkflowMonitorProps {
    initialNodes: Node[];
    initialEdges: Edge[];
    currentNodeIds: string[];
    executionHistory: any[];
}

const WorkflowMonitor = ({ initialNodes, initialEdges, currentNodeIds, executionHistory }: WorkflowMonitorProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Mettre à jour les styles des noeuds en fonction du statut
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const isActive = currentNodeIds.includes(node.id);
                const isCompleted = executionHistory.some(h => h.nodeId === node.id && h.action === 'approved');
                const isRejected = executionHistory.some(h => h.nodeId === node.id && h.action === 'rejected');

                let style = {};
                if (isActive) {
                    style = { border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' };
                } else if (isCompleted) {
                    style = { opacity: 1 };
                } else if (isRejected) {
                    style = { border: '2px solid #ef4444' };
                } else {
                    style = { opacity: 0.5 }; // Griser les noeuds non visités
                }

                return {
                    ...node,
                    style: { ...node.style, ...style },
                };
            })
        );
    }, [currentNodeIds, executionHistory, setNodes]);

    return (
        <div className="flex flex-row h-full w-full min-h-[500px]">
            <ReactFlowProvider>
                <div className="flex-grow h-full bg-gray-50">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={true}
                    >
                        <Controls showInteractive={false} />
                        <MiniMap />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    </ReactFlow>
                </div>
            </ReactFlowProvider>
        </div>
    );
};

export default WorkflowMonitor;
