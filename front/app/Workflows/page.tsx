import React from 'react';
import Link from 'next/link';
import { Plus, Eye, Play, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// Mock Data
const workflows = [
    { id: '1', name: 'Expense Validation', description: 'Expense reports validation process', status: 'Active' },
    { id: '2', name: 'Employee Onboarding', description: 'New employee integration process', status: 'Draft' },
];

const instances = [
    { id: 'inst-1', workflowName: 'Expense Validation', status: 'In Progress', date: '17/02/2026' },
    { id: 'inst-2', workflowName: 'Employee Onboarding', status: 'Completed', date: '16/02/2026' },
];

const WorkflowsPage = () => {
    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
                    <p className="text-muted-foreground">Manage your processes and track their execution.</p>
                </div>
                <Link href="/User/create_workflows">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Workflow
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                    <Card key={workflow.id}>
                        <CardHeader>
                            <CardTitle>{workflow.name}</CardTitle>
                            <CardDescription>{workflow.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${workflow.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {workflow.status}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" size="sm">
                                <Settings className="mr-2 h-4 w-4" /> Configure
                            </Button>
                            <Button size="sm">
                                <Play className="mr-2 h-4 w-4" /> Run
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Latest Instances</h2>
                <div className="border rounded-md">
                    <div className="p-4 bg-muted/50 border-b font-medium grid grid-cols-4">
                        <span>ID</span>
                        <span>Workflow</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>
                    <div className="divide-y">
                        {instances.map((inst) => (
                            <div key={inst.id} className="p-4 grid grid-cols-4 items-center hover:bg-muted/10">
                                <span className="font-mono text-xs">{inst.id}</span>
                                <span>{inst.workflowName}</span>
                                <span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${inst.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {inst.status}
                                    </span>
                                </span>
                                <div>
                                    <Link href={`/Workflows/instances/${inst.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="mr-2 h-4 w-4" /> Track
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