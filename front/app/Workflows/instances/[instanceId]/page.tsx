'use client';

import React, { useState, useEffect, use } from 'react';
import WorkflowMonitor from '../../_components/WorkflowMonitor';
import TaskExecutionPanel from '../../_components/TaskExecutionPanel';
import { apiService } from '@/service/api.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, ShieldCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function InstancePage({ params }: { params: Promise<{ instanceId: string }> }) {
    const resolvedParams = use(params);
    const instanceId = resolvedParams.instanceId;
    const searchParams = useSearchParams();
    const workflowId = searchParams.get('workflowId');

    const [instance, setInstance] = useState<any>(null);
    const [workflow, setWorkflow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    const fetchData = async () => {
        try {
            if (instanceId === 'new') {
                if (workflowId) {
                    const res = await apiService.getWorkflowById(workflowId);
                    if (res.success) {
                        setWorkflow(res.data);
                    }
                }
                setLoading(false);
                return;
            }
            const res = await apiService.getInstance(instanceId);
            if (res.success) {
                setInstance(res.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [instanceId, workflowId]);

    const handleNodeClick = (event: React.MouseEvent, node: any) => {
        setSelectedNode(node);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Determine nodes and edges based on whether it's an existing instance or a new one from a workflow
    const displayNodes = instance?.workflowId?.nodes || workflow?.nodes || [
        { id: '1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } }
    ];
    const displayEdges = instance?.workflowId?.edges || workflow?.edges || [];
    const currentNodes = instance?.currentNodes?.map((n: any) => n.nodeId) || (instanceId === 'new' ? [displayNodes.find((n: any) => n.type === 'start')?.id].filter(Boolean) : []);
    const history = instance?.executionPath || [];

    return (
        <div className="flex flex-col h-full w-full space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">
                                {instance?.title || workflow?.name || "Instance Tracking"}
                            </h1>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${instance?.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                }`}>
                                {instance?.status || (instanceId === 'new' ? 'Draft' : 'Active')}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={10} /> {instanceId === 'new' ? `Template: ${workflow?.name || 'Loading...'}` : `Node Registry ID: ${instanceId}`}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flow Integrity</p>
                        <p className="text-sm font-black text-emerald-500 flex items-center gap-1 justify-end">
                            <ShieldCheck size={14} /> Synchronized
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow h-[700px]">
                <div className="lg:col-span-3 border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 bg-white overflow-hidden relative">
                    <WorkflowMonitor
                        initialNodes={displayNodes}
                        initialEdges={displayEdges}
                        currentNodeIds={currentNodes}
                        executionHistory={history}
                        onNodeClick={handleNodeClick}
                    />
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <Clock size={16} className="text-indigo-500" /> Event Timeline
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {instance?.history?.length > 0 ? (
                            instance.history.map((evt: any, idx: number) => (
                                <div key={idx} className="relative pl-6 border-l-2 border-slate-50">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full"></div>
                                    <p className="text-xs font-black text-slate-800 leading-none">{evt.title || evt.action}</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">{evt.comments}</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{new Date(evt.timestamp || instance.createdAt).toLocaleTimeString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-30">
                                <Activity size={32} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Events Logged</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedNode && (
                    <TaskExecutionPanel
                        instance={instance}
                        node={selectedNode}
                        workflowId={workflowId}
                        onClose={() => setSelectedNode(null)}
                        onRefresh={fetchData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
