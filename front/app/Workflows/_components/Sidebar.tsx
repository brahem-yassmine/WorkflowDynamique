// front/app/Workflows/_components/Sidebar.tsx
"use client"
import React from 'react';
import { Play, Square, Users, GitFork } from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-3 h-full overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Boîte à outils</h3>
            <p className="text-sm text-gray-500 mb-2">Glissez sur le canvas</p>

            {/* Début */}
            <div
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded cursor-grab hover:bg-green-100"
                onDragStart={(e) => onDragStart(e, 'start')}
                draggable
            >
                <Play size={18} className="text-green-600" />
                <span className="font-medium">Début</span>
            </div>

            {/* Tâche */}
            <div
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded cursor-grab hover:bg-blue-100"
                onDragStart={(e) => onDragStart(e, 'action')}
                draggable
            >
                <Users size={18} className="text-blue-600" />
                <span className="font-medium">Tâche</span>
            </div>

            {/* Condition - NOUVEAU */}
            <div
                className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded cursor-grab hover:bg-amber-100"
                onDragStart={(e) => onDragStart(e, 'condition')}
                draggable
            >
                <GitFork size={18} className="text-amber-600" />
                <span className="font-medium">Condition (Si/Non)</span>
            </div>

            {/* Fin */}
            <div
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded cursor-grab hover:bg-red-100"
                onDragStart={(e) => onDragStart(e, 'end')}
                draggable
            >
                <Square size={18} className="text-red-600" />
                <span className="font-medium">Fin</span>
            </div>

            {/* Info */}
            <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <p className="font-medium mb-1">💡 Condition:</p>
                <p>Deux sorties: OUI (vert) et NON (rouge)</p>
            </div>
        </aside>
    );
}