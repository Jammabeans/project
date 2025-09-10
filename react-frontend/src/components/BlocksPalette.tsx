import React, { useCallback, useState } from 'react';
import useBlocks from '../hooks/useBlocks';

/**
 * BlocksPalette
 * - Marketplace for blocks.
 */

type BlockMeta = {
  id: number | string;
  representativeHook: string;
  enabled?: boolean;
  immutable?: boolean;
  description?: string;
  commands?: any[] | null;
};

type Props = {
  available?: BlockMeta[] | null;
  onAddBlock?: (b: BlockMeta) => void;
};

const container: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' };
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #101214' };

export default function BlocksPalette({ available = null, onAddBlock }: Props) {
  const { blocks, loading: blocksLoading, fetchBlockCommands, refetch } = useBlocks();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const list = available ?? blocks ?? [];

  const handleAdd = useCallback(async (b: BlockMeta) => {
    try {
      setLoadingMap(prev => ({ ...prev, [String(b.id)]: true }));
      const cmds = await fetchBlockCommands?.(Number(b.id));
      const detail = { ...b, commands: cmds ?? null };
      onAddBlock && onAddBlock(detail);
    } catch {
      onAddBlock && onAddBlock(b);
    } finally {
      setLoadingMap(prev => ({ ...prev, [String(b.id)]: false }));
    }
  }, [onAddBlock, fetchBlockCommands]);

  return (
    <div style={container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Blocks Marketplace</div>
        <div>
          <button onClick={() => refetch?.()} style={{ padding: '0.25em 0.5em', background: '#222', color: '#9ad', borderRadius: 6, border: '1px solid #333' }}>Refresh</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map(b => (
          <div key={String(b.id)} style={row}>
            <div>
              <div style={{ fontWeight: 700 }}>{b.representativeHook} <small style={{ color: '#9ad' }}>#{b.id}</small></div>
              <div style={{ color: '#bbb', fontSize: '0.85em' }}>{b.description}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {b.immutable && <div style={{ color: '#ff8b8b', fontSize: '0.85em' }}>Immutable</div>}
              <button
                onClick={() => handleAdd(b)}
                disabled={Boolean(loadingMap[String(b.id)])}
                style={{ padding: '0.35em 0.6em', background: '#1976d2', color: '#fff', borderRadius: 6 }}
              >
                {loadingMap[String(b.id)] ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ color: '#999' }}>{blocksLoading ? 'Loading blocks…' : 'No blocks available'}</div>}
      </div>
    </div>
  );
}