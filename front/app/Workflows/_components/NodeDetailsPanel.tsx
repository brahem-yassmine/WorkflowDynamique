import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { X } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface NodeDetailsPanelProps {
    selectedNode: Node | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => void;
}

const NodeDetailsPanel = ({ selectedNode, onClose, onUpdate }: NodeDetailsPanelProps) => {
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [responsibleDomain, setResponsibleDomain] = useState('');

    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label as string || '');
            setDescription(selectedNode.data.description as string || '');
            setResponsibleDomain(selectedNode.data.responsibleDomain as string || '');
        }
    }, [selectedNode]);

    const handleSave = () => {
        if (selectedNode) {
            onUpdate(selectedNode.id, {
                ...selectedNode.data,
                label,
                description,
                responsibleDomain
            });
        }
    };

    if (!selectedNode) return null;

    return (
        <div className="w-80 bg-white border-l border-gray-200 p-4 h-full shadow-lg absolute right-0 top-0 z-10 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg">Configuration</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X size={18} />
                </Button>
            </div>

            <div className="space-y-4 flex-grow">
                <div>
                    <Label htmlFor="node-label">Nom de l'étape</Label>
                    <Input
                        id="node-label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ex: Validation RH"
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="node-desc">Description</Label>
                    <Textarea
                        id="node-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Instructions pour cette étape..."
                        className="mt-1 resize-none"
                        rows={4}
                    />
                </div>

                {selectedNode.type === 'action' && (
                    <div>
                        <Label htmlFor="node-domain">Département Responsable</Label>
                        <select
                            id="node-domain"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                            value={responsibleDomain}
                            onChange={(e) => setResponsibleDomain(e.target.value)}
                        >
                            <option value="">Sélectionner...</option>
                            <option value="RH">RH</option>
                            <option value="Finance">Finance</option>
                            <option value="IT">IT</option>
                            <option value="Vente">Vente</option>
                            <option value="Direction">Direction</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t">
                <Button onClick={handleSave} className="w-full">
                    Appliquer les modifications
                </Button>
            </div>
        </div>
    );
};

export default NodeDetailsPanel;
