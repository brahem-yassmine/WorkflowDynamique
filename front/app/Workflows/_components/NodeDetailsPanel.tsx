"use client"

import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { X, Plus, Trash2, ListChecks, Clock, ShieldAlert, GraduationCap } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiService } from '@/service/api.service';

interface NodeDetailsPanelProps {
    selectedNode: Node | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

const NodeDetailsPanel = ({ selectedNode, onClose, onUpdate, onDelete }: NodeDetailsPanelProps) => {
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [responsibleDomain, setResponsibleDomain] = useState('');
    const [taskType, setTaskType] = useState('checklist');
    const [priority, setPriority] = useState('medium');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [condition, setCondition] = useState('');
    const [checklist, setChecklist] = useState<string[]>([]);
    const [domains, setDomains] = useState<any[]>([]);

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const res = await apiService.getDomains();
                if (res.success) setDomains(res.data);
            } catch (err) {
                console.error('Error fetching domains:', err);
            }
        };
        fetchDomains();
    }, []);

    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label as string || '');
            setDescription(selectedNode.data.description as string || '');
            setResponsibleDomain(selectedNode.data.responsibleDomain as string || '');
            setTaskType(selectedNode.data.taskType as string || 'checklist');
            setPriority(selectedNode.data.priority as string || 'medium');
            setEstimatedDuration(selectedNode.data.estimatedDuration as string || '');
            setCondition(selectedNode.data.condition as string || '');
            setChecklist(Array.isArray(selectedNode.data.checklist) ? selectedNode.data.checklist : []);
        }
    }, [selectedNode]);

    const handleSave = () => {
        if (selectedNode) {
            onUpdate(selectedNode.id, {
                ...selectedNode.data,
                label,
                description,
                responsibleDomain,
                taskType,
                priority,
                estimatedDuration,
                condition,
                checklist
            });
        }
    };

    const addChecklistItem = () => {
        setChecklist([...checklist, '']);
    };

    const updateChecklistItem = (index: number, value: string) => {
        const newChecklist = [...checklist];
        newChecklist[index] = value;
        setChecklist(newChecklist);
    };

    const removeChecklistItem = (index: number) => {
        setChecklist(checklist.filter((_, i) => i !== index));
    };

    const handleDelete = () => {
        if (selectedNode && window.confirm('Are you sure you want to delete this node?')) {
            onDelete(selectedNode.id);
        }
    }

    if (!selectedNode) return null;

    return (
        <div className="w-96 bg-white border-l border-gray-100 p-0 h-full shadow-2xl absolute right-0 top-0 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Node Logic</h3>
                    <p className="text-xl font-black tracking-tight">{label || 'Untitled Step'}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* Basic Identification */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <ShieldAlert size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Base Configuration</h4>
                    </div>
                    <div>
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Step Label</Label>
                        <Input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g., Quality Review"
                            className="h-11 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus-visible:ring-indigo-100"
                        />
                    </div>
                    {selectedNode.type !== 'condition' && (
                        <div>
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Instructions</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what needs to be done..."
                                className="bg-slate-50 border-none rounded-xl font-medium text-slate-600 focus-visible:ring-indigo-100 min-h-[100px]"
                            />
                        </div>
                    )}
                </section>

                {/* Specific Action Meta */}
                {selectedNode.type === 'action' && (
                    <>
                        <section className="space-y-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                <GraduationCap size={16} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Responsibility & Priority</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Department</Label>
                                    <select
                                        className="w-full h-11 px-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-700 outline-none hover:bg-slate-100 transition-colors"
                                        value={responsibleDomain}
                                        onChange={(e) => setResponsibleDomain(e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        {domains.map(d => (
                                            <option key={d._id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Priority</Label>
                                    <select
                                        className="w-full h-11 px-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-700 outline-none hover:bg-slate-100 transition-colors"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">EST. Duration (Hours/Days)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <Input
                                        value={estimatedDuration}
                                        onChange={(e) => setEstimatedDuration(e.target.value)}
                                        placeholder="e.g., 2 hours"
                                        className="h-11 pl-9 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus-visible:ring-indigo-100"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <ListChecks size={16} />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Checklist / Sub-tasks</h4>
                                </div>
                                <button
                                    onClick={addChecklistItem}
                                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {checklist.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => updateChecklistItem(index, e.target.value)}
                                            placeholder={`Requirement #${index + 1}`}
                                            className="h-10 bg-slate-50 border-none rounded-xl font-medium text-sm text-slate-600 focus-visible:ring-indigo-100"
                                        />
                                        <button
                                            onClick={() => removeChecklistItem(index)}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {checklist.length === 0 && (
                                    <p className="text-[10px] text-slate-300 font-bold uppercase text-center py-4 border-2 border-dashed border-slate-50 rounded-2xl">No sub-tasks defined</p>
                                )}
                            </div>
                        </section>
                    </>
                )}

                {/* Condition Logic */}
                {selectedNode.type === 'condition' && (
                    <section className="space-y-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <ShieldAlert size={16} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Routing Logic</h4>
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">If/Else Rule</Label>
                            <Input
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                placeholder="e.g., invoice_amount > 1000"
                                className="h-11 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus-visible:ring-indigo-100"
                            />
                        </div>
                    </section>
                )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-50 bg-white grid grid-cols-5 gap-3">
                <Button
                    onClick={handleSave}
                    className="col-span-4 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    Apply Logic Changes
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="ghost"
                    className="h-12 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl flex items-center justify-center transition-all"
                >
                    <Trash2 size={18} />
                </Button>
            </div>
        </div>
    );
};

export default NodeDetailsPanel;
