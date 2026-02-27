//front/app/Workflows/_components/WorkflowMonitor.tsx

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
import ConditionNode from './nodes/ConditionNode';

const nodeTypes = {
    start: StartNode,
    end: EndNode,
    action: ActionNode,
    condition: ConditionNode,
};

interface WorkflowMonitorProps {
    initialNodes: Node[];
    initialEdges: Edge[];
    currentNodeIds: string[];
    executionHistory: any[];
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

const WorkflowMonitor = ({ initialNodes, initialEdges, currentNodeIds, executionHistory, onNodeClick }: WorkflowMonitorProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update node styles based on status
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const isActive = currentNodeIds.includes(node.id);
                const isCompleted = executionHistory.some(h => h.nodeId === node.id && h.action === 'approved');
                const isRejected = executionHistory.some(h => h.nodeId === node.id && h.action === 'rejected');

                let style = {};
                if (isActive) {
                    style = { border: '3px solid #6366f1', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' };
                } else if (isCompleted) {
                    style = { opacity: 1 };
                } else if (isRejected) {
                    style = { border: '3px solid #ef4444' };
                } else {
                    style = { opacity: 0.8 }; // Less transparent for unvisited nodes
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
                        onNodeClick={onNodeClick}
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
