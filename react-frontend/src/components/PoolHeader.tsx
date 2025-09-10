import React from 'react';

type TokenInfo = { symbol?: string; address?: string; id?: string };

type PoolHeaderProps = {
  pool: {
    id: string;
    token0: TokenInfo;
    token1: TokenInfo;
    feeTier?: number | string;
  } | null;
};

const container: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 };
const pairStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const idStyle: React.CSSProperties = { color: '#888', fontSize: '0.9em' };

export default function PoolHeader({ pool }: PoolHeaderProps) {
  if (!pool) return null;
  return (
    <div style={container}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: '#16181b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ad', fontWeight: 700 }}>
        { (pool.token0?.symbol?.[0] ?? 'T') + (pool.token1?.symbol?.[0] ?? 'K') }
      </div>

      <div style={pairStyle}>
        <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
          {pool.token0?.symbol ?? pool.token0?.address ?? 'Token0'}/{pool.token1?.symbol ?? pool.token1?.address ?? 'Token1'}
        </div>
        <div style={idStyle}>
          Pool id: <code style={{ color: '#9ad' }}>{pool.id}</code>
        </div>
      </div>

      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <div style={{ color: '#bbb', fontSize: '0.9em' }}>Fee Tier</div>
        <div style={{ color: '#fff', fontWeight: 700 }}>{pool.feeTier ?? 'N/A'}</div>
      </div>
    </div>
  );
}
export {};