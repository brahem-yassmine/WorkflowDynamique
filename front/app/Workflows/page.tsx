"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Play, Settings, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';

const WorkflowsPage = () => {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [instances, setInstances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPageData = async () => {
            try {
                setLoading(true);
                const [workflowsRes, instancesRes] = await Promise.all([
                    apiService.getWorkflows(),
                    apiService.getInstances()
                ]);

                if (workflowsRes.success) setWorkflows(workflowsRes.data);
                if (instancesRes.success) setInstances(instancesRes.data);
            } catch (err: any) {
                console.error('Error loading data:', err);
                setError(err.message || 'Failed to fetch data');
                toast.error('Session error or network issue');
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, []);

    const handleRunWorkflow = async (workflowId: string) => {
        try {
            const res = await apiService.request(`/workflows/${workflowId}/execute`, {
                method: 'POST',
                body: JSON.stringify({ title: `Execution of ${new Date().toLocaleString()}` })
            });

            if (res.success) {
                toast.success('Workflow instance started!');
                // Refresh instances list
                const instancesRes = await apiService.getInstances();
                if (instancesRes.success) setInstances(instancesRes.data);
            } else {
                toast.error(res.message || 'Execution failed');
            }
        } catch (err: any) {
            toast.error(err.message || 'Execution error');
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4 p-20">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium">Synchronizing your processes...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800">Dynamic Workflows</h1>
                    <p className="text-slate-500 font-medium">Manage your enterprise processes and track real-time execution.</p>
                </div>
                <Link href="/User/create_workflows">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-indigo-200 transition-all border-none">
                        <Plus className="mr-2 h-4 w-4" /> New Model
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-600 text-sm font-medium">
                    {error}. Please verify your connection or login again.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {workflows.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No workflows found</p>
                        <p className="text-slate-300 text-sm mt-2">Create your first automated process to get started.</p>
                    </div>
                ) : workflows.map((workflow) => (
                    <Card key={workflow._id} className="border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all rounded-[32px] overflow-hidden group">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{workflow.name}</CardTitle>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${workflow.status === 'active' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'}`}>
                                    {workflow.status}
                                </span>
                            </div>
                            <CardDescription className="text-slate-400 font-medium line-clamp-2">{workflow.description || 'No description provided.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-50 text-indigo-500 rounded-md">
                                    {workflow.domain}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    {workflow.nodes?.length || 0} Steps
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between gap-3 bg-slate-50/50 p-6">
                            <Link href={`/User/create_workflows?id=${workflow._id}`} className="flex-1">
                                <Button variant="outline" className="w-full h-11 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-white hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                    <Settings className="mr-2 h-4 w-4" /> Configure
                                </Button>
                            </Link>

                            <Button
                                onClick={() => handleRunWorkflow(workflow._id)}
                                className="flex-1 h-11 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
                            >
                                <Play className="mr-2 h-4 w-4" /> Execute
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="space-y-6 pt-6 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Instances</h2>
                    <Link href="/Workflows/instances" className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
                        View All History
                    </Link>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-5 p-6 bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="col-span-1">Ref ID</span>
                        <span className="col-span-1">Workflow</span>
                        <span className="col-span-1">Initiator</span>
                        <span className="col-span-1">Progress</span>
                        <span className="col-span-1 text-right">Actions</span>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {instances.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-medium">
                                No active executions found.
                            </div>
                        ) : instances.slice(0, 10).map((inst) => (
                            <div key={inst._id} className="grid grid-cols-5 p-6 items-center hover:bg-slate-50/80 transition-all group">
                                <span className="col-span-1 font-mono text-[11px] text-indigo-400 font-bold">#{inst._id.slice(-6).toUpperCase()}</span>
                                <span className="col-span-1 font-bold text-slate-700">{inst.title || 'Untitled Instance'}</span>
                                <span className="col-span-1 text-slate-400 text-sm font-medium">You</span>
                                <span className="col-span-1">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inst.status === 'in_progress' ? 'bg-blue-50 text-blue-500 ring-1 ring-blue-100' :
                                            inst.status === 'completed' ? 'bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100' :
                                                'bg-rose-50 text-rose-500 ring-1 ring-rose-100'
                                        }`}>
                                        {inst.status}
                                    </span>
                                </span>
                                <div className="col-span-1 text-right">
                                    <Link href={`/Workflows/instances/${inst._id}`}>
                                        <Button variant="ghost" className="h-10 px-4 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold text-xs">
                                            <Eye className="mr-2 h-3.5 w-3.5" /> Monitor
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowsPage;
