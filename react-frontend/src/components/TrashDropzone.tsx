import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export interface TrashDropzoneProps {
  isActive: boolean;
}

const TrashDropzone: React.FC<TrashDropzoneProps> = ({ isActive }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash-dropzone' });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 48,
        background: isOver ? '#b71c1c' : '#23283a',
        border: isOver ? '2.5px solid #f44336' : '2px dashed #f44336',
        borderRadius: 8,
        marginTop: 20,
        color: '#f44336',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1.1em',
        opacity: isActive ? 1 : 0.7,
        transition: 'background 0.2s, border 0.2s, opacity 0.2s',
      }}
    >
      🗑️ Drag here to remove
    </div>
  );
};

export default TrashDropzone;