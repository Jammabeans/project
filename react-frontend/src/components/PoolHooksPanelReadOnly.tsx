import React from 'react';
import { useWallet, usePoolHooks, useCommandFees } from '../hooks';
import { humanizeSelector } from '../utils/selectorHumanizer';

type Props = {
  poolId?: string | number | null;
  providerOverride?: any; // optional BrowserProvider passed through
};

/**
 * PoolHooksPanelReadOnly
 * - Small, focused read-only panel to show commands/targets for a given poolId.
 * - Uses usePoolHooks + useCommandFees and is safe if no provider is connected (shows message).
 */
const container: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: '#0f1113',
  border: '1px solid #222',
  color: '#ddd',
};

const Th: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #222', color: '#ddd' };
const Td: React.CSSProperties = { padding: '8px 6px', borderBottom: '1px solid #1a1a1a', color: '#ccc' };

export default function PoolHooksPanelReadOnly({ poolId, providerOverride }: Props) {
  const { provider } = useWallet();
  const effectiveProvider = providerOverride ?? provider ?? undefined;

  const { commands, targets, locks, loading, error, refetch } = usePoolHooks(
    poolId ?? null,
    null,
    { provider: effectiveProvider ?? undefined, pollIntervalMs: null }
  );

  const { fees: targetFees, loading: feesLoading } = useCommandFees(targets ?? null, {
    provider: effectiveProvider ?? undefined,
    pollIntervalMs: null,
  });

  if (!poolId) {
    return <div style={container}>No pool selected.</div>;
  }

  if (!effectiveProvider) {
    return (
      <div style={container}>
        <div style={{ color: '#bbb' }}>Connect wallet to load on-chain hook data for pool {String(poolId)}.</div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Hooks — Pool {String(poolId)}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => refetch?.()} disabled={loading} style={{ padding: '0.35em 0.6em' }}>
            Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ color: '#999' }}>Loading commands...</div>}
      {error && <div style={{ color: '#ff8b8b' }}>Error: {String(error)}</div>}

      {targets && targets.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: '#bbb', fontSize: '0.9em' }}>Targets</div>
          <ul style={{ marginTop: 6 }}>
            {targets.map(t => (
              <li key={t} style={{ color: '#ccc', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <code style={{ color: '#9ad' }}>{t}</code>
                <span style={{ color: '#ccc' }}>{targetFees && targetFees[t] != null ? String(targetFees[t]) : 'n/a'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {commands && commands.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={Th}>#</th>
              <th style={Th}>Target</th>
              <th style={Th}>Selector</th>
              <th style={Th}>CallType</th>
              <th style={Th}>FeeBips</th>
              <th style={Th}>Origin</th>
              <th style={Th}>Locked</th>
            </tr>
          </thead>
          <tbody>
            {commands.map((c: any, i: number) => {
              const key = `${c.target}-${c.selector}-${i}`;
              const lockKey = `${c.target}:${c.selector}`;
              const locked = (locks && (locks as any)[lockKey]) || false;
              return (
                <tr key={key}>
                  <td style={Td}>{i + 1}</td>
                  <td style={Td}><code style={{ color: '#9ad' }}>{c.target}</code></td>
                  <td style={Td}><code>{humanizeSelector(String(c.selector))}</code></td>
                  <td style={Td}>{String(c.callType)}</td>
                  <td style={Td}>{String(c.feeBips)}</td>
                  <td style={Td}>{String(c.provenanceBlockId ?? '')}</td>
                  <td style={Td}>{locked ? 'Yes' : 'No'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div style={{ color: '#777', marginTop: 6 }}>No commands found for this pool.</div>
      )}
    </div>
  );
}
export {};