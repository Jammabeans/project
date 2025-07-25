import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableBlockProps {
  id: string;
  label: string;
  index: number;
  isOverlay?: boolean;
  isGhost?: boolean;
}

const SortableBlock: React.FC<SortableBlockProps> = ({
  id,
  label,
  index,
  isOverlay = false,
  isGhost = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: isOverlay ? undefined : CSS.Transform.toString(transform),
    transition: isOverlay ? undefined : transition,
    opacity: isOverlay ? 0.9 : isDragging ? 0.5 : isGhost ? 0.4 : 1,
    background: isGhost ? '#4caf50' : '#23283a',
    borderRadius: 8,
    padding: '1.2rem 1.5rem',
    marginBottom: 24,
    border: isGhost ? '2px dashed #4caf50' : '2px solid #4caf50',
    color: '#fff',
    cursor: isGhost ? 'pointer' : 'grab',
    position: 'relative',
    zIndex: isOverlay ? 1000 : isDragging ? 2 : 1,
    boxShadow: isOverlay ? '0 8px 32px #000a' : isDragging ? '0 4px 16px #0008' : undefined,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    pointerEvents: isOverlay ? 'none' : undefined,
  };
  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#aaa', fontSize: '0.9em' }}>#{index + 1}</span>
    </div>
  );
};

export default SortableBlock;