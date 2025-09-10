import React, { useState } from "react";
import { CHAIN_SETTINGS } from "../config/chainSettings";
import { usePools, useChainSettings, usePoolDetails, usePoolSwaps } from "../hooks";

const DEFAULT_CHAIN_ID = Number(process.env.REACT_APP_DEFAULT_CHAIN_ID) || 1;
const ALL_CHAINS = Object.values(CHAIN_SETTINGS);

const PoolOverview: React.FC<{ initialPoolAddress?: string | null }> = ({ initialPoolAddress = null }) => {
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [poolAddress, setPoolAddress] = useState<string>(initialPoolAddress ? String(initialPoolAddress) : "");

  // Snapshot list for quick discovery
  const { pools, loading: snapshotLoading, error: snapshotError, refetch } = usePools({ first: 50, pollIntervalMs: null });
  const chainSettings = useChainSettings(chainId);

  // Exact on-chain details when a pool address is entered
  const { data: poolDetails, loading: detailsLoading, error: detailsError, refetch: refetchDetails } =
    usePoolDetails(poolAddress || null, { pollIntervalMs: null });

  const loading = snapshotLoading || detailsLoading;
  const error = detailsError ?? snapshotError;

  // If we have on-chain details prefer them; otherwise fall back to snapshot match
  const _pd: any = poolDetails as any;
  const matchedPool = poolDetails
    ? { id: _pd.address, token0: _pd.token0 ?? { symbol: '', address: _pd.token0?.address ?? '' }, token1: _pd.token1 ?? { symbol: '', address: _pd.token1?.address ?? '' }, feeTier: _pd.fee ?? 'N/A', liquidity: _pd.liquidity ?? 'N/A' }
    : (poolAddress ? pools.find(p => p.id.toLowerCase() === poolAddress.toLowerCase()) : null);

  return (
    <div style={{ marginBottom: 24 }}>
      <h2>Pool Overview</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Chain:
          <select
            value={chainId}
            onChange={e => setChainId(Number(e.target.value))}
            style={{ marginLeft: 8, marginRight: 16 }}
          >
            {ALL_CHAINS.map((c: any) => (
              <option key={c.chainId} value={c.chainId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pool Address:
          <input
            type="text"
            value={poolAddress}
            onChange={e => setPoolAddress(e.target.value)}
            placeholder="0x..."
            style={{ marginLeft: 8, width: 260 }}
          />
        </label>
        <button
          onClick={() => {
            if (poolAddress) {
              refetchDetails();
            } else {
              refetch();
            }
          }}
          disabled={loading}
          style={{
            marginLeft: 16,
            padding: "0.5em 1.2em",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading..." : poolAddress ? "Fetch Pool" : "Refresh Pools"}
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      {!poolAddress && pools.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3>Top Pools (snapshot)</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {pools.slice(0, 8).map(p => (
              <li key={p.id} style={{ marginBottom: 8 }}>
                <strong>{p.token0.symbol}/{p.token1.symbol}</strong> — {p.liquidity} — <span style={{ color: '#888' }}>{p.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {poolAddress && !matchedPool && !loading && (
        <div style={{ color: "#aaa", marginTop: 8 }}>
          No pool data found. Try "Fetch Pool" to perform an on-chain read.
        </div>
      )}

      {matchedPool && (
        <div style={{ marginTop: 12 }}>
          <p>
            Pool address: <span style={{ color: "#888" }}>{matchedPool.id}</span>
          </p>

          {/* Render PoolHeader and PoolStats */}
          {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
          {React.createElement(require('./PoolHeader').default, { pool: matchedPool })}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
            {React.createElement(require('./PoolStatsCard').default, {
              tvl: matchedPool.liquidity,
              feeTier: matchedPool.feeTier,
              volume24h: '—',
              hookCount: '—',
            })}
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: '#ddd' }}>Overview</h4>
              <div style={{ marginTop: 8 }}>
                <p style={{ margin: 0 }}>
                  Token 0: <span style={{ color: '#888' }}>{((matchedPool.token0 as any)?.symbol) ?? ((matchedPool.token0 as any)?.address) ?? ''}</span>
                </p>
                <p style={{ margin: 0 }}>
                  Token 1: <span style={{ color: '#888' }}>{((matchedPool.token1 as any)?.symbol) ?? ((matchedPool.token1 as any)?.address) ?? ''}</span>
                </p>
                <p style={{ margin: 0 }}>
                  Pool id: <code style={{ color: '#9ad' }}>{matchedPool.id}</code>
                </p>
              </div>
            </div>
          </div>

          {/* Hooks read-only panel */}
          <div style={{ marginTop: 12 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
            {React.createElement(require('./PoolHooksPanelReadOnly').default, { poolId: matchedPool.id })}
          </div>
        </div>
      )}

      {/* Trade widget preview */}
      {matchedPool && (
        <div style={{ marginTop: 12 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
          {React.createElement(require('./TradeWidget').default, {
            poolId: matchedPool.id,
            token0Label: ((matchedPool.token0 as any)?.symbol) ?? 'Token0',
            token1Label: ((matchedPool.token1 as any)?.symbol) ?? 'Token1',
          })}
        </div>
      )}
    </div>
  );
};

export default PoolOverview;