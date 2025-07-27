import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MintPointsHookBlock from './hooks/MintPointsHookBlock';
import AddFeeHookBlock from './hooks/AddFeeHookBlock';
import CallContractHookBlock from './hooks/CallContractHookBlock';
import CallContractWithValueHookBlock from './hooks/CallContractWithValueHookBlock';
import ViewContractHookBlock from './hooks/ViewContractHookBlock';

export interface SortableBlockProps {
  id: string;
  label: string;
  index: number;
  isOverlay?: boolean;
  isGhost?: boolean;
  typeId?: string;
  expanded?: boolean;
  value?: any;
  onChange?: (value: any) => void;
}

const hookBlockComponents: Record<string, React.FC<any>> = {
  'mint-points': MintPointsHookBlock,
  'add-fee': AddFeeHookBlock,
  'call-contract': CallContractHookBlock,
  'call-contract-value': CallContractWithValueHookBlock,
  'view-contract': ViewContractHookBlock,
  // Add more mappings as you create more hook blocks
};

const SortableBlock: React.FC<SortableBlockProps> = ({
  id,
  label,
  index,
  isOverlay = false,
  isGhost = false,
  typeId,
  expanded = false,
  value,
  onChange,
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    pointerEvents: isOverlay ? 'none' : undefined,
  };

  // Always render the condensed block for dnd-kit animation
  return (
    <div ref={isOverlay ? undefined : setNodeRef} style={style} {...(isOverlay ? {} : { ...attributes, ...listeners })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#aaa', fontSize: '0.9em' }}>#{index + 1}</span>
      </div>
      {/* Render custom options component inside the block when expanded and not dragging/ghosting */}
      {expanded && !isOverlay && !isGhost && typeId && hookBlockComponents[typeId] && (
        <div style={{ width: '100%', marginTop: 8 }}>
          {React.createElement(hookBlockComponents[typeId], { value, onChange })}
        </div>
      )}
    </div>
  );
};

export default SortableBlock;