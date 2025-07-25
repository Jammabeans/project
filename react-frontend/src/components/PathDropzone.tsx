import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import SortableBlock, { SortableBlockProps } from './SortableBlock';

export interface PathDropzoneProps {
  pathBlocks: { id: string; typeId: string; label: string }[];
  activeDrag?: any;
  overId?: string | null;
}

const PathDropzone: React.FC<PathDropzoneProps> = ({ pathBlocks, activeDrag, overId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'path-dropzone',
  });

  // Calculate ghost index for drop preview
  let ghostIndex: number | null = null;
  if (activeDrag?.from === 'options' && overId) {
    if (overId === 'path-dropzone') {
      ghostIndex = pathBlocks.length;
    } else {
      const idx = pathBlocks.findIndex(b => b.id === overId);
      if (idx !== -1) ghostIndex = idx;
    }
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
          {ghostIndex === idx && activeDrag?.from === 'options' && (
            <SortableBlock
              id="ghost"
              label={activeDrag.label || ''}
              index={idx}
              isGhost={true}
            />
          )}
          <div style={{ position: 'relative' }}>
            <SortableBlock id={block.id} label={block.label} index={idx} />
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
      {ghostIndex === pathBlocks.length && activeDrag?.from === 'options' && (
        <SortableBlock
          id="ghost"
          label={activeDrag.label || ''}
          index={pathBlocks.length}
          isGhost={true}
        />
      )}
      {/* Phantom drop area at the end for easy dropping */}
      <div
        style={{
          minHeight: 32,
          marginTop: 8,
          border: isOver ? '2.5px dashed #81c784' : '2px dashed #4caf50',
          borderRadius: 6,
          background: isOver ? '#263238' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa',
          fontSize: '1em',
          transition: 'background 0.2s, border 0.2s',
        }}
      >
        {pathBlocks.length === 0 ? '' : 'Drop here to add to end'}
      </div>
    </div>
  );
};

export default PathDropzone;