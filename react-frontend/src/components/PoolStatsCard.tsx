import React from 'react';

type PoolStatsProps = {
  tvl?: string | number | null;
  volume24h?: string | number | null;
  feeTier?: number | string | null;
  hookCount?: number | null;
};

const cardStyle: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' };
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '6px 0' };

export default function PoolStatsCard({ tvl, volume24h, feeTier, hookCount }: PoolStatsProps) {
  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Pool Stats</div>
      <div style={row}>
        <div style={{ color: '#bbb' }}>TVL</div>
        <div style={{ color: '#fff' }}>{tvl ?? 'n/a'}</div>
      </div>
      <div style={row}>
        <div style={{ color: '#bbb' }}>24h Volume</div>
        <div style={{ color: '#fff' }}>{volume24h ?? 'n/a'}</div>
      </div>
      <div style={row}>
        <div style={{ color: '#bbb' }}>Fee</div>
        <div style={{ color: '#fff' }}>{feeTier ?? 'n/a'}</div>
      </div>
      <div style={row}>
        <div style={{ color: '#bbb' }}>Hooks</div>
        <div style={{ color: '#fff' }}>{hookCount ?? '0'}</div>
      </div>
    </div>
  );
}