import React, { useState } from 'react';
import './App.css';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { useWallet } from './hooks';
import PoolAdmin from './components/PoolAdmin';
import PoolHooksPanel from './components/PoolHooksPanel';

import SortableBlock from './components/SortableBlock';
import DraggableHookOption from './components/DraggableHookOption';
import TrashDropzone from './components/TrashDropzone';
import PathDropzone from './components/PathDropzone';
import {
  navStyle,
  mainStyle,
  centerColumnStyle,
  pathEditorStyle,
  rightPanelStyle,
  appContainerStyle,
} from './AppStyles';
import AllV4PoolsBlock from './components/AllV4PoolsBlock';
import PoolActionsBlock from './components/PoolActionsBlock';
import MostLiquidPools from './components/MostLiquidPools';
import PoolSearchBlock from './components/PoolSearchBlock';

// Legacy hook paths removed — modern UI uses Commands and Blocks instead (see design/*.md)

// Hook options removed - commands/palette UI lives in Hooks Admin per design

// Helper to generate unique ids for path blocks
function generateBlockId(typeId: string) {
  return `${typeId}-${Math.random().toString(36).substr(2, 9)}`;
}

function App() {
  const { connect, disconnect, provider, account, chainId, isConnected } = useWallet();
  const implementedPaths = useSelector((state: RootState) => state.implementedPaths.implementedPaths);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showAllV4Pools, setShowAllV4Pools] = useState<boolean>(false);
  const [showPoolAdmin, setShowPoolAdmin] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<string>('Landing');

  // Persisted state: blocks per path (now includes value for each block)
  const [pathBlocks, setPathBlocks] = useState<Record<string, { id: string; typeId: string; label: string; value?: any }[]>>({});

  // Drag state
  const [activeDrag, setActiveDrag] = useState<null | { id: string; from: 'options' | 'path'; typeId?: string; label?: string; uniqueId?: string }>(null);

  // Wallet connect logic (moved to useWallet hook)
  const connectWallet = async () => {
    setError(null);
    try {
      await connect();
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    }
  };

  const logout = () => {
    disconnect();
  };

  // Handler to update value for a block in the edit path
  function handleBlockChange(blockId: string, value: any) {
    if (!selectedPath) return;
    setPathBlocks(prev => ({
      ...prev,
      [selectedPath]: (prev[selectedPath] || []).map(b =>
        b.id === blockId ? { ...b, value } : b
      ),
    }));
  }

  // DnD handlers
  function handleDragStart(event: any) {
    const { active } = event;
    if (active.data?.current?.from === 'options') {
      // Generate a unique id for this drag
      const uniqueId = generateBlockId(active.data.current.typeId);
      setActiveDrag({
        id: active.id,
        from: 'options',
        typeId: active.data.current.typeId,
        label: active.data.current.label,
        uniqueId,
      });
    } else {
      // If dragging from path, set from 'path'
      setActiveDrag({ id: active.id, from: 'path' });
    }
  }

  function handleDragOver(event: any) {
    // No-op: do not set state here to avoid update loops
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!selectedPath) {
      setActiveDrag(null);
      return;
    }
    if (!over) {
      setActiveDrag(null);
      return;
    }
    // Drag from options to path: insert at drop position
    if (activeDrag?.from === 'options' && over.id) {
      const blocks = pathBlocks[selectedPath] || [];
      let insertIndex = blocks.length;
      if (over.id !== 'path-dropzone') {
        // Insert before the hovered block
        insertIndex = blocks.findIndex(b => b.id === over.id);
        if (insertIndex === -1) insertIndex = blocks.length;
      }
      const newBlock = {
        id: activeDrag.uniqueId!,
        typeId: activeDrag.typeId!,
        label: activeDrag.label!,
        value: undefined,
      };
      setPathBlocks(prev => ({
        ...prev,
        [selectedPath]: [
          ...blocks.slice(0, insertIndex),
          newBlock,
          ...blocks.slice(insertIndex),
        ]
      }));
    }
    // Reorder within path
    if (activeDrag?.from === 'path' && over.id !== active.id && over.id !== 'trash-dropzone') {
      const blocks = pathBlocks[selectedPath] || [];
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setPathBlocks(prev => ({
          ...prev,
          [selectedPath]: arrayMove(blocks, oldIndex, newIndex)
        }));
      }
    }
    // Remove from path if dropped on trash
    if (activeDrag?.from === 'path' && over.id === 'trash-dropzone') {
      setPathBlocks(prev => ({
        ...prev,
        [selectedPath]: (prev[selectedPath] || []).filter(b => b.id !== active.id)
      }));
    }
    setActiveDrag(null);
  }

  // Find the dragged block for overlay
  let dragOverlayBlock: React.ReactNode = null;
  if (activeDrag) {
    if (activeDrag.from === 'options') {
      dragOverlayBlock = (
        <SortableBlock
          id={activeDrag.uniqueId || activeDrag.id}
          label={activeDrag.label || ''}
          index={0}
          isOverlay={true}
        />
      );
    } else if (activeDrag.from === 'path' && selectedPath) {
      const block = (pathBlocks[selectedPath] || []).find(b => b.id === activeDrag.id);
      if (block) {
        dragOverlayBlock = (
          <SortableBlock
            id={block.id}
            label={block.label}
            index={0}
            isOverlay={true}
          />
        );
      }
    }
  }
      {/* Top header with primary page navigation (replaces cluttered left nav when not in legacy mode) */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #222', background: '#0b0d10' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1976d2' }} />
          <strong style={{ color: '#fff', fontSize: '1.1rem' }}>Bonded Hooks</strong>
        </div>

        {/* Primary nav links */}
        <nav style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
          {['Landing','Pools','Launch','Bonding','Bidding','DegenPool','PrizeBoxes','GasRebates','Docs','PoolAdmin','HooksAdmin','Account'].map(p => (
            <button
              key={p}
              onClick={() => {
                // Reset legacy UI flags and switch to the selected top-level page
                setShowAllV4Pools(false);
                setShowPoolAdmin(false);
                setSelectedPath(null);
                setCurrentPage(p);
              }}
              style={{
                padding: '0.5em 0.8em',
                background: currentPage === p ? '#1976d2' : 'transparent',
                color: currentPage === p ? '#fff' : '#cfd6e3',
                border: '1px solid transparent',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              {p}
            </button>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {account ? (
            <>
              <div style={{ color: '#ddd', fontSize: '0.9rem', wordBreak: 'break-all', maxWidth: 320 }}>{account}</div>
              <button onClick={logout} style={{ padding: '0.45em 0.8em' }}>Logout</button>
            </>
          ) : (
            <button onClick={connectWallet} style={{ padding: '0.45em 0.8em' }}>Connect Wallet</button>
          )}
        </div>
      </header>

  return (
    <div style={appContainerStyle}>
      {/* Left nav (simplified) */}
      <nav style={navStyle}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Menu</h2>

        {/* Account / connect */}
        <div style={{ marginBottom: 12 }}>
          {account ? (
            <>
              <div style={{ wordBreak: 'break-all', fontSize: '0.85em', marginBottom: 8 }}>{account}</div>
              <button onClick={logout} style={{ padding: '0.45em', marginBottom: 12 }}>Logout</button>
            </>
          ) : (
            <button onClick={connectWallet} style={{ padding: '0.45em', marginBottom: 12 }}>Connect Wallet</button>
          )}
        </div>

        {/* Quick links to new top-level pages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setCurrentPage('Landing')} style={{ padding: '0.6em', background: currentPage === 'Landing' ? '#1976d2' : '#23283a', color: '#fff', borderRadius: 6 }}>Landing</button>
          <button onClick={() => { setCurrentPage('Pools'); setShowAllV4Pools(true); }} style={{ padding: '0.6em', background: currentPage === 'Pools' ? '#1976d2' : '#23283a', color: '#fff', borderRadius: 6 }}>Pools</button>
          <button onClick={() => { setCurrentPage('PoolAdmin'); setShowPoolAdmin(true); }} style={{ padding: '0.6em', background: currentPage === 'PoolAdmin' ? '#1976d2' : '#23283a', color: '#fff', borderRadius: 6 }}>Pool Admin</button>
          <button onClick={() => setCurrentPage('HooksAdmin')} style={{ padding: '0.6em', background: currentPage === 'HooksAdmin' ? '#1976d2' : '#23283a', color: '#fff', borderRadius: 6 }}>Hooks Admin</button>
          <button onClick={() => setCurrentPage('Account')} style={{ padding: '0.6em', background: currentPage === 'Account' ? '#1976d2' : '#23283a', color: '#fff', borderRadius: 6 }}>Account</button>
        </div>

        <div style={{ marginTop: 'auto', fontSize: '0.8em', color: '#aaa' }}>
          Bonded Hooks
        </div>
      </nav>

      {/* Main content */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main style={mainStyle}>
          {/* Center: Path editor + trash or Admin */}
          <div style={centerColumnStyle}>
            {showPoolAdmin ? (
              <div style={{ width: '100%' }}>
                <PoolAdmin />
              </div>
            ) : (
              <div style={pathEditorStyle}>
                {showAllV4Pools ? (
                  <>
                    <PoolSearchBlock />
                    <PoolActionsBlock />
                  </>
                ) : (
                  <>
                    <h3 style={{ marginBottom: 22, fontSize: '1.2rem' }}>
                      {selectedPath ? `Edit Path: ${selectedPath}` : 'Select a Hook Path'}
                    </h3>
                    {selectedPath && (
                      <>
                        <SortableContext
                          items={(pathBlocks[selectedPath] || []).map(b => b.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <PathDropzone
                            pathBlocks={pathBlocks[selectedPath] || []}
                            onBlockChange={handleBlockChange}
                          />
                        </SortableContext>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
            {/* Trash dropzone is now below the scrollable path area */}
            <div style={{ width: '100%', marginTop: 12 }}>
              <TrashDropzone isActive={!!activeDrag} />
            </div>
          </div>
          {/* Right: Hook options */}
          <div style={rightPanelStyle}>
            {/* Contextual right panel: show pool lists or Commands palette placeholder */}
            {showAllV4Pools ? (
              <MostLiquidPools />
            ) : (
              <>
                <h3 style={{ marginBottom: 12, fontSize: '1.05rem', color: '#fff' }}>Commands</h3>
                <div style={{ color: '#bbb' }}>
                  Commands palette and Blocks marketplace will appear here. Use the Hooks Admin or Pool Admin pages to view/manipulate commands.
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setCurrentPage('HooksAdmin')} style={{ padding: '0.5em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Open Hooks Admin</button>
                </div>
              </>
            )}
          </div>
        </main>
        {/* Drag overlay for blocks */}
        <DragOverlay dropAnimation={null}>
          {dragOverlayBlock}
        </DragOverlay>
      </DndContext>
      {error && <p style={{ color: 'red', marginTop: 24 }}>{error}</p>}
  
      {/* Development test component: PoolDetailsTest */}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 50 }}>
        {/* lazy-load the test component to avoid production usage */}
        {process.env.NODE_ENV !== 'production' && (
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          React.createElement(require('./components/PoolDetailsTest').default)
        )}
      </div>
    </div>
  );
}

export default App;
