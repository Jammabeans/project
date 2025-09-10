import React, { useState } from 'react';
import { usePoolDetails } from '../hooks';

/**
 * PoolDetailsTest
 * Small manual test UI for usePoolDetails hook.
 * - Enter a pool address and click "Fetch" to perform on-chain reads.
 * - Shows basic fields and JSON dump.
 *
 * Mount this component in App (for dev only) to test connectivity.
 */

const PoolDetailsTest: React.FC = () => {
  const [addr, setAddr] = useState<string>('');
  const { data, loading, error, refetch } = usePoolDetails(addr || null, { pollIntervalMs: null });

  return (
    <div style={{ padding: 16, background: '#111', borderRadius: 8, color: '#fff', marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>PoolDetails Test</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Enter pool address (0x...)"
          style={{ padding: '0.5em', width: 380 }}
        />
        <button
          onClick={() => refetch()}
          disabled={loading || !addr}
          style={{ padding: '0.5em 1em', background: '#1976d2', color: '#fff', borderRadius: 6 }}
        >
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
      </div>

      {error && <div style={{ color: '#ff6b6b', marginBottom: 12 }}>Error: {String(error)}</div>}

      {data ? (
        <div style={{ fontSize: '0.9em' }}>
          <p><strong>Address:</strong> {data.address}</p>
          <p><strong>Token0:</strong> {data.token0?.symbol ?? data.token0?.address}</p>
          <p><strong>Token1:</strong> {data.token1?.symbol ?? data.token1?.address}</p>
          <p><strong>Fee:</strong> {String(data.fee)}</p>
          <p><strong>Liquidity:</strong> {String(data.liquidity)}</p>
          <details style={{ marginTop: 8, color: '#ddd' }}>
            <summary>Raw JSON</summary>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div style={{ color: '#999' }}>No data. Enter an address and click Fetch.</div>
      )}
    </div>
  );
};

export default PoolDetailsTest;