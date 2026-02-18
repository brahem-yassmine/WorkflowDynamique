import React from 'react';
import { Play, Square, Settings, Users } from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string, payload?: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        if (payload) {
            event.dataTransfer.setData('application/reactflow-payload', JSON.stringify(payload));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 h-full overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Boîte à outils</h3>
            <div className="text-sm text-gray-500 mb-4">Glissez les éléments sur le canvas</div>

            <div
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded cursor-grab hover:bg-green-100 transition-colors"
                onDragStart={(event) => onDragStart(event, 'start')}
                draggable
            >
                <Play className="text-green-600" size={16} />
                <span className="font-medium text-gray-700">Début</span>
            </div>

            <div
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded cursor-grab hover:bg-blue-100 transition-colors"
                onDragStart={(event) => onDragStart(event, 'action', { label: 'Nouvelle Tâche', responsibleDomain: 'RH' })}
                draggable
            >
                <Users className="text-blue-600" size={16} />
                <span className="font-medium text-gray-700">Tâche / Validation</span>
            </div>

            <div
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded cursor-grab hover:bg-red-100 transition-colors"
                onDragStart={(event) => onDragStart(event, 'end')}
                draggable
            >
                <Square className="text-red-600" size={16} />
                <span className="font-medium text-gray-700">Fin</span>
            </div>
        </aside>
    );
}
