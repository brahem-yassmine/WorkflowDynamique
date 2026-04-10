// front/app/Workflows/_components/WorkflowEditor.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight } from 'lucide-react';
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
import AIGeneratorModal from '@/components/AIGeneratorModal';

import { useSearchParams, useRouter } from 'next/navigation';
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
function WorkflowEditorContent({ onSaveSuccess }: { onSaveSuccess?: () => void }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const workflowId = searchParams.get('id');
    const designerNodeId = searchParams.get('designerNodeId');
    const designerTab = searchParams.get('designerTab');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [workflowName, setWorkflowName] = useState(searchParams.get('isTemplate') === 'true' ? 'New Template' : 'New Workflow');
    const [workflowDomainId, setWorkflowDomainId] = useState<string>('');
    const [workflowProjectId, setWorkflowProjectId] = useState<string>('');
    const [workflowModuleId, setWorkflowModuleId] = useState<string>('');
    const [workflowIsTemplate, setWorkflowIsTemplate] = useState<boolean>(searchParams.get('isTemplate') === 'true');
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(workflowId);
    
    // NEW: Capture module/domain context from URL
    const moduleIdParam = searchParams.get('moduleId');
    const domainIdParam = searchParams.get('domainId');
    const isTemplateParam = searchParams.get('isTemplate') === 'true';
    const freshParam = searchParams.get('fresh') === 'true';

    useEffect(() => {
        if (moduleIdParam) setWorkflowModuleId(moduleIdParam);
        if (domainIdParam) setWorkflowDomainId(domainIdParam);
        // Strict sync: if URL says it's a template, it's a template.
        setWorkflowIsTemplate(isTemplateParam);
    }, [moduleIdParam, domainIdParam, isTemplateParam]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false); // tracks unsaved changes
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const lastSavedMetaRef = useRef<{ 
        name: string; 
        domainId: string; 
        projectId?: string; 
        moduleId?: string; 
        isTemplate: boolean;
        status: 'draft' | 'active';
    } | null>(null);

    // Responsive Sidebar Logic
    useEffect(() => {
        const checkScreenSize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Default domain from user if available
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.domainId) setWorkflowDomainId(parsedUser.domainId);
        }
    }, []);

    // Draft Persistence Logic & Double-firing Mitigation
    const draftKey = workflowId ? `workflow_draft_${workflowId}` : 'workflow_draft_new';
    const isInitialLoad = useRef(true);
    const isInternalUpdate = useRef(false);

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
                        const { 
                            name, 
                            nodes: loadedNodes, 
                            edges: loadedEdges, 
                            domainId, 
                            projectId, 
                            moduleId,
                            isTemplate,
                            updatedAt 
                        } = response.data;
                        
                        // If draft is newer than what's on server, use draft
                        if (draft && draft.savedAt > (new Date(updatedAt || 0).getTime())) {
                            console.log('[Draft] Loading newer local draft');
                            setWorkflowName(draft.name || name);
                            setWorkflowDomainId(draft.domainId || domainId || '');
                            setWorkflowProjectId(draft.projectId || projectId || '');
                            setWorkflowModuleId(draft.moduleId || moduleId || '');
                            setWorkflowIsTemplate(draft.isTemplate ?? isTemplate ?? false);
                            setNodes(draft.nodes || []);
                            setEdges(draft.edges || []);
                            setIsDirty(true);
                            toast.info('Newer local draft resumed');
                        } else {
                            setWorkflowName(name);
                            setWorkflowDomainId(domainId || '');
                            setWorkflowProjectId(projectId || '');
                            setWorkflowModuleId(moduleId || '');
                            setWorkflowIsTemplate(isTemplate || false);
                            setNodes(loadedNodes || []);
                            setEdges(loadedEdges || []);
                        }
                    }
                } catch (error) {
                    console.error('Failed to load workflow:', error);
                    toast.error('Error loading workflow');
                }
            } else if (draft && (draft.nodes?.length > 1 || draft.edges?.length > 0)) {
                if (freshParam) {
                    console.log('[Draft] Fresh param detected. Skipping and clearing draft.');
                    localStorage.removeItem(draftKey);
                    return;
                }
                // Loading "new" workflow but have a meaningful draft
                console.log('[Draft] Loading unsaved "new" workflow draft');
                setWorkflowName(draft.name || 'New Workflow');
                setWorkflowDomainId(draft.domainId || '');
                setWorkflowProjectId(draft.projectId || '');
                setWorkflowModuleId(draft.moduleId || '');
                setWorkflowIsTemplate(draft.isTemplate || false);
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
            }
        }
    }, [designerNodeId, nodes.length]);

    // Mark as dirty when nodes/edges change (after initial load) + persist draft to localStorage
    const isFirstRender = useRef(true);
    
    // Utility to strip large data from nodes for localStorage draft
    const cleanNodesForDraft = (nds: Node[]) => {
        return nds.map(node => {
            if (!node.data || !node.data.attachments) return node;
            
            // Strip large base64 if it's over 200KB to save space in localStorage
            const cleanedAttachments = (node.data.attachments as any[]).map(att => {
                if (att.url && att.url.length > 200000) {
                    return { ...att, url: '[LARGE_DATA_STRIPPED]', isStripped: true };
                }
                return att;
            });
            
            return {
                ...node,
                data: { ...node.data, attachments: cleanedAttachments }
            };
        });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            // Skip first render to avoid marking dirty on initial load
            const timer = setTimeout(() => { isFirstRender.current = false; }, 1500);
            return () => clearTimeout(timer);
        }
        
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        setIsDirty(true);
        // Persist draft to localStorage so navigation doesn't lose changes
        const currentDraftKey = `workflow_draft_${currentWorkflowId || 'new'}`;
        
        try {
            const draftNodes = cleanNodesForDraft(nodes);
            localStorage.setItem(currentDraftKey, JSON.stringify({
                nodes: draftNodes,
                edges,
                name: workflowName,
                domainId: workflowDomainId,
                moduleId: workflowModuleId,
                projectId: workflowProjectId,
                isTemplate: workflowIsTemplate,
                savedAt: Date.now()
            }));
        } catch (e: any) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('⚠️ [Draft] LocalStorage quota exceeded. Attempting to clear old drafts to make space...');
                // Try to clear ONLY draft keys that aren't the current one
                try {
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('workflow_draft_') && key !== currentDraftKey) {
                            localStorage.removeItem(key);
                        }
                    });
                    // Try one more time
                    localStorage.setItem(currentDraftKey, JSON.stringify({
                        nodes,
                        edges,
                        name: workflowName,
                        domainId: workflowDomainId,
                        moduleId: workflowModuleId,
                        projectId: workflowProjectId,
                        isTemplate: workflowIsTemplate,
                        savedAt: Date.now()
                    }));
                } catch (retryErr) {
                    console.error('❌ [Draft] Failed to save draft even after cleanup:', retryErr);
                }
            } else {
                console.error('❌ [Draft] Unexpected localStorage error:', e);
            }
        }
    }, [nodes, edges, workflowName, workflowDomainId, workflowModuleId, workflowProjectId, workflowIsTemplate, currentWorkflowId]);

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

    const handleSave = useCallback(async (meta: { 
        name: string; 
        domainId: string; 
        projectId?: string; 
        moduleId?: string; 
        isTemplate: boolean;
        status: 'draft' | 'active';
    }) => {
        try {
            setIsSaving(true);
            lastSavedMetaRef.current = meta;

            const payload = {
                name: meta.name,
                domainId: meta.domainId,
                projectId: meta.projectId,
                moduleId: meta.moduleId,
                isTemplate: meta.isTemplate,
                description: "Workflow created via visual editor",
                nodes: nodes,
                edges: edges,
                status: meta.status
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
                isInternalUpdate.current = true;
                setIsDirty(false);
                // Clear draft on successful save
                const draftKey = `workflow_draft_${currentWorkflowId || 'new'}`;
                localStorage.removeItem(draftKey);
                
                toast.success(currentWorkflowId 
                    ? (meta.isTemplate ? 'Template updated!' : 'Workflow updated!') 
                    : (meta.isTemplate ? 'Template created!' : 'Workflow created!')
                );

                // EXIT logic: trigger callback if provided, otherwise perform internal redirect
                if (onSaveSuccess) {
                    setTimeout(() => {
                        onSaveSuccess();
                    }, 1000);
                } else {
                    // Internal context-aware redirection logic
                    const isUserContext = typeof window !== 'undefined' && window.location.pathname.startsWith('/User');
                    const savedId = currentWorkflowId || response?.data?._id;
                    
                    setTimeout(() => {
                        const moduleQuery = meta.moduleId ? `?moduleId=${meta.moduleId}` : '';
                        if (isUserContext) {
                            if (meta.domainId) {
                                router.push(`/User/MODULES?domainId=${meta.domainId}${meta.moduleId ? `&moduleId=${meta.moduleId}` : ''}`);
                            } else {
                                router.push('/User/ALL');
                            }
                        } else if (savedId) {
                            // Default Admin redirection to the specific workflow page
                            router.push(`/admin/workflows/${savedId}`);
                        } else {
                            // Fallback admin view
                            router.push('/admin/workflows' + (meta.isTemplate ? '?isTemplate=true' : ''));
                        }
                    }, 1500);
                }

                setWorkflowName(meta.name);
                setWorkflowDomainId(meta.domainId);
                setWorkflowModuleId(meta.moduleId || '');
                setWorkflowProjectId(meta.projectId || '');
                setWorkflowIsTemplate(meta.isTemplate);
                
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

    const handleAIGeneration = (data: { nodes: any[], edges: any[] }) => {
        setNodes(data.nodes);
        setEdges(data.edges);
        setIsDirty(true);
    };

    return (
        <div className="flex flex-row h-full w-full relative overflow-hidden">
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0, x: -20 }}
                        animate={{ width: 256, opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="h-full border-r border-slate-100 bg-white flex-shrink-0 relative overflow-hidden"
                    >
                        <Sidebar />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar Toggle Button - Moved outside and z-index increased */}
            <motion.button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                initial={false}
                animate={{ 
                    left: isSidebarOpen ? 240 : 16,
                }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className={`fixed top-1/2 -translate-y-1/2 z-[999] w-8 h-20 bg-white border border-slate-200 shadow-2xl rounded-2xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors group overflow-hidden pointer-events-auto`}
                title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
                <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/50 transition-colors" />
                {isSidebarOpen ? (
                    <ChevronLeft size={20} className="relative z-10" />
                ) : (
                    <ChevronRight size={20} className="relative z-10" />
                )}
            </motion.button>
            
            <div className="absolute top-4 right-[250px] z-[999]">
                <AIGeneratorModal type="workflow" isTemplate={workflowIsTemplate} onGenerate={handleAIGeneration} />
            </div>

            <SaveButton
                onSave={handleSave}
                isSaving={isSaving}
                initialName={workflowName}
                initialDomainId={workflowDomainId}
                initialProjectId={workflowProjectId}
                initialModuleId={workflowModuleId}
                initialIsTemplate={workflowIsTemplate}
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
                    allNodes={nodes}
                    workflowId={currentWorkflowId}
                    initialTab={designerTab || 'general'}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={onNodeUpdate}
                    onDelete={onNodeDelete}
                />
            )}
        </div>
    );
}

// Main component with Provider on the outside
export default function WorkflowEditor({ onSaveSuccess }: { onSaveSuccess?: () => void }) {
    return (
        <ReactFlowProvider>
            <React.Suspense fallback={<div>Loading editor...</div>}>
                <WorkflowEditorContent onSaveSuccess={onSaveSuccess} />
            </React.Suspense>
        </ReactFlowProvider>
    );
}
