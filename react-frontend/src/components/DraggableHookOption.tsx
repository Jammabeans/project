import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export interface DraggableHookOptionProps {
  typeId: string;
  label: string;
}

const DraggableHookOption: React.FC<DraggableHookOptionProps> = ({ typeId, label }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: typeId,
    data: { from: 'options', typeId, label },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        background: isDragging ? '#1976d2' : '#181c24',
        borderRadius: 8,
        padding: '1.2rem 1.2rem',
        marginBottom: 18,
        border: '2px solid #2196f3',
        color: '#fff',
        fontWeight: 600,
        cursor: 'grab',
        userSelect: 'none',
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        minHeight: 56,
      }}
    >
      {label}
    </div>
  );
};

export default DraggableHookOption;