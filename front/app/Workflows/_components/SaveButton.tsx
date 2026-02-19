// front/app/Workflows/_components/SaveButton.tsx
"use client"
import React, { useState } from 'react';

interface SaveButtonProps {
  nodes: any[];
  edges: any[];
  workflowName?: string;
  onSave?: (data: any) => void;
}

const SaveButton = ({ nodes, edges, workflowName = 'Workflow', onSave }: SaveButtonProps) => {
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState(workflowName);

  const handleSave = () => {
    if (!name.trim()) return;
    
    const data = {
      name,
      nodes,
      edges,
      date: new Date().toISOString()
    };
    
    console.log('Sauvegarde:', data);
    onSave?.(data);
    alert('Workflow sauvegardé!');
    setShowInput(false);
  };

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
      {showInput ? (
        <div style={{ display: 'flex', gap: '5px', background: 'white', padding: '10px', borderRadius: '5px' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du workflow"
            style={{ padding: '5px' }}
          />
          <button onClick={handleSave} style={{ padding: '5px 10px', background: 'green', color: 'white' }}>
            OK
          </button>
          <button onClick={() => setShowInput(false)} style={{ padding: '5px 10px' }}>
            Annuler
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setShowInput(true)}
          style={{ padding: '10px 20px', background: 'blue', color: 'white', borderRadius: '5px' }}
        >
          Sauvegarder
        </button>
      )}
    </div>
  );
};

export default SaveButton;