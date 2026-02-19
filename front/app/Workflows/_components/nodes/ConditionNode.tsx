// front/app/Workflows/_components/nodes/ConditionNode.tsx

"use client"
import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ConditionNodeProps {
  data: {
    label?: string;
    condition?: string;
  };
}

const ConditionNode = ({ data }: ConditionNodeProps) => {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '5px',
      background: '#fffbeb',
      border: '2px solid #fbbf24',
      minWidth: '200px'
    }}>
      <Handle type="target" position={Position.Top} />
      
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        {data.label || 'Condition'}
      </div>
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        {data.condition || 'Condition non définie'}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="oui" 
        style={{ left: '30%', background: '#10b981' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="non" 
        style={{ left: '70%', background: '#ef4444' }}
      />
    </div>
  );
};

export default ConditionNode;