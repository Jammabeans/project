import React from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import SortableBlock from './SortableBlock';

export interface PathDropzoneProps {
  pathBlocks: { id: string; typeId: string; label: string; value?: any }[];
  onBlockChange?: (id: string, value: any) => void;
}

const PathDropzone: React.FC<PathDropzoneProps> = ({ pathBlocks, onBlockChange }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'path-dropzone',
  });

  // Use dnd-kit context to get current over and active
  const { over, active } = useDndContext();

  // Calculate ghost index and label for drop preview
  let ghostIndex: number | null = null;
  let ghostLabel: string = '';
  const isDraggingFromOptions = active?.data?.current?.from === 'options';
  if (isDraggingFromOptions && over?.id) {
    if (over.id === 'path-dropzone') {
      ghostIndex = pathBlocks.length;
    } else {
      const idx = pathBlocks.findIndex(b => b.id === over.id.toString());
      if (idx !== -1) ghostIndex = idx;
    }
    ghostLabel = active?.data?.current?.label || '';
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 120,
        height: 'auto',
        background: isOver ? '#263238' : '#181c24',
        border: isOver ? '2.5px solid #81c784' : '2px dashed #4caf50',
        borderRadius: 8,
        padding: '1.2rem 1rem',
        marginBottom: 16,
        position: 'relative',
        transition: 'background 0.2s, border 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        flexGrow: 1,
        zIndex: 2,
      }}
    >
      {pathBlocks.length === 0 && (
        <div style={{ color: '#aaa', textAlign: 'center' }}>
          Drag hook blocks here
        </div>
      )}
      {pathBlocks.map((block, idx) => (
        <React.Fragment key={block.id}>
          {ghostIndex === idx && isDraggingFromOptions && (
            <div
              style={{
                opacity: 0.4,
                background: '#4caf50',
                border: '2px dashed #4caf50',
                borderRadius: 8,
                padding: '1.2rem 1.5rem',
                marginBottom: 24,
                color: '#fff',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                pointerEvents: 'none',
              }}
            >
              <span>{ghostLabel}</span>
              <span style={{ color: '#aaa', fontSize: '0.9em' }}>#{idx + 1}</span>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <SortableBlock
              id={block.id}
              label={block.label}
              index={idx}
              typeId={block.typeId}
              expanded={true}
              value={block.value}
              onChange={val => onBlockChange?.(block.id, val)}
            />
            {/* Draw connecting line */}
            {idx < pathBlocks.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '50%',
                bottom: -6,
                width: 2,
                height: 24,
                background: '#4caf50',
                transform: 'translateX(-50%)',
                zIndex: 0,
              }} />
            )}
          </div>
        </React.Fragment>
      ))}
      {/* Ghost at end if dropping at end */}
      {ghostIndex === pathBlocks.length && isDraggingFromOptions && (
        <div
          style={{
            opacity: 0.4,
            background: '#4caf50',
            border: '2px dashed #4caf50',
            borderRadius: 8,
            padding: '1.2rem 1.5rem',
            marginBottom: 24,
            color: '#fff',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            pointerEvents: 'none',
          }}
        >
          <span>{ghostLabel}</span>
          <span style={{ color: '#aaa', fontSize: '0.9em' }}>#{pathBlocks.length + 1}</span>
        </div>
      )}
      {/* Phantom drop area at the end for easy dropping */}
      <div
        style={{
          minHeight: 80,
          marginTop: 8,
          border: isOver ? '3px solid #81c784' : '2.5px dashed #4caf50',
          borderRadius: 8,
          background: isOver ? '#263238' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOver ? '#81c784' : '#aaa',
          fontSize: '1.1em',
          fontWeight: 600,
          letterSpacing: 0.5,
          transition: 'background 0.2s, border 0.2s, color 0.2s',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>+</span>
          Drop here to add to end
        </span>
      </div>
    </div>
  );
};

export default PathDropzone;