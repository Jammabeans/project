import React from 'react';
import { Link } from 'react-router-dom';

type PoolCardProps = {
  pool: {
    id: string;
    token0?: { symbol?: string; address?: string };
    token1?: { symbol?: string; address?: string };
    liquidity?: string | number | null;
    feeTier?: number | string | null;
    token0Price?: string | null;
    token1Price?: string | null;
    tvlUSD?: string | null;
    volume24hUSD?: string | null;
  };
};

/**
 * PoolCard — small reusable card for pool lists
 * Lightweight, presentational, links to /pool/:id
 */
export default function PoolCard({ pool }: PoolCardProps) {
  const token0 = pool.token0?.symbol ?? 'Token0';
  const token1 = pool.token1?.symbol ?? 'Token1';

  const token0Addr = pool.token0?.address ?? '';
  const token1Addr = pool.token1?.address ?? '';

  const feeBips = Number(pool.feeTier ?? 0);
  const feePct = feeBips > 0 ? `${(feeBips / 10_000).toFixed(2)}%` : '—';

  const money = (v?: string | number | null) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n) || n <= 0) return '—';
    return `$${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n)}`;
  };

  const price = (() => {
    const p = Number(pool.token0Price ?? 0);
    if (!Number.isFinite(p) || p <= 0) return '—';
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toPrecision(3)}`;
  })();

  const tvlLabel = money(pool.tvlUSD);
  const volLabel = money(pool.volume24hUSD);

  const short = (v?: string | null) => (v ? `${v.slice(0, 6)}...${v.slice(-4)}` : '—');

  return (
    <Link to={`/pool/${pool.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: 14,
        borderRadius: 12,
        background: '#11151b',
        border: '1px solid #2a313c',
        color: '#e5edf8',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 122,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1f2a38' }} />
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a3647', marginLeft: -10, border: '2px solid #11151b' }} />
            <div style={{ fontWeight: 700, color: '#fff', marginLeft: 2 }}>{token0}/{token1}</div>
          </div>
          <div style={{ color: '#9ad', fontSize: '0.85em', border: '1px solid #3a4453', borderRadius: 999, padding: '2px 8px' }}>
            {feePct}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ color: '#8ea1b8', fontSize: '0.75rem' }}>Price ({token0})</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{price}</div>
          </div>
          <div>
            <div style={{ color: '#8ea1b8', fontSize: '0.75rem' }}>24h Volume</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{volLabel}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ color: '#8ea1b8', fontSize: '0.75rem' }}>TVL</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{tvlLabel}</div>
          </div>
          <div>
            <div style={{ color: '#8ea1b8', fontSize: '0.75rem' }}>Pool ID</div>
            <div style={{ color: '#d6e2f4', fontFamily: 'monospace', fontSize: '0.86rem' }}>{short(pool.id)}</div>
          </div>
        </div>

        <div style={{ color: '#8ea1b8', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span>{short(token0Addr)}</span>
          <span>{short(token1Addr)}</span>
        </div>
      </div>
    </Link>
  );
}
