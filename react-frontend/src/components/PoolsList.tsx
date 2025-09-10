import React, { useMemo, useState } from 'react';
import PoolCard from './PoolCard';
import { usePools } from '../hooks';

/**
 * PoolsList
 * - Simple list/search UI for pools that consumes usePools()
 * - Renders a responsive grid of PoolCard components
 */

export default function PoolsList(): JSX.Element {
  const { pools = [], loading, error } = usePools({ first: 200, pollIntervalMs: null } as any);
  const [query, setQuery] = useState<string>('');

  const filtered = useMemo(() => {
    if (!query) return pools;
    const q = query.trim().toLowerCase();
    return pools.filter((p: any) => {
      const symbols = `${p.token0?.symbol ?? ''}/${p.token1?.symbol ?? ''}`.toLowerCase();
      return p.id.toLowerCase().includes(q) || symbols.includes(q);
    });
  }, [pools, query]);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by pool address or token symbol"
          style={{ padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#fff', flex: 1 }}
        />
        <div style={{ color: '#999' }}>{loading ? 'Loading...' : `${filtered.length} pools`}</div>
      </div>

      {error && <div style={{ color: 'salmon' }}>Error loading pools: {String(error)}</div>}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {filtered.map((p: any) => (
          <PoolCard key={p.id} pool={p} />
        ))}
      </div>
    </div>
  );
}