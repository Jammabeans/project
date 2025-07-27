import React, { useState } from 'react';
import './App.css';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store';
import { setAccount, addImplementedPath, removeImplementedPath } from './store';

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

// List of hook entry points
const HOOK_PATHS = [
  "beforeInitialize",
  "afterInitialize",
  "beforeAddLiquidity",
  "beforeRemoveLiquidity",
  "afterAddLiquidity",
  "afterRemoveLiquidity",
  "beforeSwap",
  "afterSwap",
  "beforeDonate",
  "afterDonate",
  "beforeSwapReturnDelta",
  "afterSwapReturnDelta",
  "afterAddLiquidityReturnDelta",
  "afterRemoveLiquidityReturnDelta"
];

// Static placeholder hook options (right panel)
const HOOK_OPTIONS = [
  { id: 'mint-points', label: 'Mint points' },
  { id: 'add-fee', label: 'Add Fee' },
  { id: 'call-contract', label: 'Call contract' },
  { id: 'call-contract-value', label: 'Call contract with Value' },
  { id: 'view-contract', label: 'View contract' },
];

// Helper to generate unique ids for path blocks
function generateBlockId(typeId: string) {
  return `${typeId}-${Math.random().toString(36).substr(2, 9)}`;
}

function App() {
  const account = useSelector((state: RootState) => state.wallet.account);
  const implementedPaths = useSelector((state: RootState) => state.implementedPaths.implementedPaths);
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Persisted state: blocks per path (now includes value for each block)
  const [pathBlocks, setPathBlocks] = useState<Record<string, { id: string; typeId: string; label: string; value?: any }[]>>({});

  // Drag state
  const [activeDrag, setActiveDrag] = useState<null | { id: string; from: 'options' | 'path'; typeId?: string; label?: string; uniqueId?: string }>(null);

  // Wallet connect logic (unchanged)
  const connectWallet = async () => {
    setError(null);
    if (!(window as any).ethereum) {
      setError('MetaMask is not installed. Please install it to use this app.');
      return;
    }
    try {
      // @ts-ignore
      const provider = new window.ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      dispatch(setAccount(accounts[0]));
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const logout = () => {
    dispatch(setAccount(null));
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

  return (
    <div style={appContainerStyle}>
      {/* Left nav */}
      <nav style={navStyle}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.2rem', letterSpacing: 1 }}>Menu</h2>
        <div style={{ width: '100%' }}>
          <h3 style={{ marginBottom: 16, fontSize: '1.25rem' }}>Hook Paths</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {HOOK_PATHS.map(path => (
              <li key={path} style={{ marginBottom: 16 }}>
                <button
                  style={{
                    width: '100%',
                    background:
                      selectedPath === path
                        ? '#4caf50' // Green: selected
                        : implementedPaths.includes(path)
                        ? '#1976d2' // Blue: implemented
                        : (pathBlocks[path] && pathBlocks[path].length > 0)
                        ? '#ff9800' // Orange: staged
                        : '#23283a', // Black: default
                    color:
                      selectedPath === path
                        ? '#fff'
                        : implementedPaths.includes(path)
                        ? '#fff'
                        : (pathBlocks[path] && pathBlocks[path].length > 0)
                        ? '#23283a'
                        : '#aaa',
                    border: '1px solid #333',
                    borderRadius: 6,
                    padding: '1.1em 1.2em',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    letterSpacing: 0.5,
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onClick={() => setSelectedPath(path)}
                >
                  {path}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {account ? (
          <>
            <div style={{ wordBreak: 'break-all', fontSize: '0.9em', marginBottom: 16, marginTop: 24 }}>
              {account}
            </div>
            <button onClick={logout} style={{ marginBottom: 24 }}>Logout</button>
          </>
        ) : (
          <button onClick={connectWallet} style={{ marginBottom: 24, marginTop: 24 }}>Connect Wallet</button>
        )}
        <div style={{ marginTop: 'auto', fontSize: '0.8em', color: '#aaa' }}>
          Hooks Master Control
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
          {/* Center: Path editor + trash */}
          <div style={centerColumnStyle}>
            <div style={pathEditorStyle}>
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
            </div>
            {/* Trash dropzone is now below the scrollable path area */}
            <div style={{ width: '100%', marginTop: 12 }}>
              <TrashDropzone isActive={!!activeDrag} />
            </div>
          </div>
          {/* Right: Hook options */}
          <div style={rightPanelStyle}>
            <h3 style={{ marginBottom: 22, fontSize: '1.15rem' }}>Available Hooks</h3>
            <div>
              {HOOK_OPTIONS.map(opt => (
                <DraggableHookOption key={opt.id} typeId={opt.id} label={opt.label} />
              ))}
            </div>
          </div>
        </main>
        {/* Drag overlay for blocks */}
        <DragOverlay dropAnimation={null}>
          {dragOverlayBlock}
        </DragOverlay>
      </DndContext>
      {error && <p style={{ color: 'red', marginTop: 24 }}>{error}</p>}
    </div>
  );
}

export default App;
