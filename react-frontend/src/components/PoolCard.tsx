import React from 'react';
import { Link } from 'react-router-dom';

type PoolCardProps = {
  pool: {
    id: string;
    token0?: { symbol?: string; address?: string };
    token1?: { symbol?: string; address?: string };
    liquidity?: string | number | null;
  };
};

/**
 * PoolCard — small reusable card for pool lists
 * Lightweight, presentational, links to /pool/:id
 */
export default function PoolCard({ pool }: PoolCardProps) {
  const token0 = pool.token0?.symbol ?? pool.token0?.address ?? 'T0';
  const token1 = pool.token1?.symbol ?? pool.token1?.address ?? 'T1';

  return (
    <Link to={`/pool/${pool.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: 12,
        borderRadius: 8,
        background: '#0f1113',
        border: '1px solid #222',
        color: '#ddd',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 84,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: '#fff' }}>{token0}/{token1}</div>
          <div style={{ color: '#9ad', fontSize: '0.9em' }}>{String(pool.liquidity ?? '—')}</div>
        </div>
        <div style={{ color: '#bbb', fontSize: '0.85em', wordBreak: 'break-all' }}>
          <code style={{ color: '#9ad' }}>{pool.id}</code>
        </div>
      </div>
    </Link>
  );
}