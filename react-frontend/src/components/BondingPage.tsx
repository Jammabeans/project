import React, { useMemo, useState } from 'react';
import { useWallet, usePools } from '../hooks';
import useBonding from '../hooks/useBonding';
import TxModal from './TxModal';

/**
 * BondingPage
 * - Simple bonding marketplace UI.
 * - Shows a small list of candidate targets (derived from usePools) and allows
 *   the user to inspect bonding data for a chosen target & currency and "bond" (simulated).
 *
 * Notes:
 * - This is UI-first. Actual bond transactions should be wired to the real
 *   Bonding contract and integrated with the txs slice / TxTray.
 */

const container: React.CSSProperties = { padding: 20 };
const panel: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd', marginBottom: 12 };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 };

export default function BondingPage() {
  const { account, signer } = useWallet();
  const { pools } = usePools({ first: 12 });
  const poolOptions = useMemo(() => pools.map(p => ({ id: p.id, label: `${p.token0.symbol}/${p.token1.symbol} (#${p.id.slice(0,6)})` })), [pools]);

  const [target, setTarget] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  const [bondAmount, setBondAmount] = useState<string>('');
  const [opError, setOpError] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const bonding = useBonding(target || null, currency || null, { pollIntervalMs: null });

  function onSelectSample(targetAddr?: string) {
    if (targetAddr) setTarget(targetAddr);
  }

  const validation = useMemo(() => {
    const errs: string[] = [];
    if (!target) errs.push('Select a target to bond to (use the sample list or paste an address).');
    if (!currency) errs.push('Enter the currency token address you will use for bonding.');
    if (!bondAmount || isNaN(Number(bondAmount)) || Number(bondAmount) <= 0) errs.push('Bond amount must be a positive number.');
    if (!account) errs.push('Connect wallet to bond.');
    return errs;
  }, [target, currency, bondAmount, account]);

  function onAttemptBond() {
    setOpError(null);
    if (validation.length > 0) {
      setOpError(validation.join(' '));
      return;
    }
    if (!signer) {
      setOpError('Connect a wallet (signer needed) to perform bond transactions.');
      return;
    }
    setTxOpen(true);
  }

  async function handleConfirmBond() {
    setTxOpen(false);
    // Placeholder for real bond transaction wiring.
    // Simulate a successful tx after a short delay.
    try {
      await new Promise((res) => setTimeout(res, 800));
      setConfirmed(true);
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }

  return (
    <div style={container}>
      <h1>Bonding Marketplace</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 12 }}>
        <div>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Available Targets (sample)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {poolOptions.length === 0 && <div style={{ color: '#999' }}>Loading pools…</div>}
              {poolOptions.slice(0, 8).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0b0d10' }}>
                  <div style={{ color: '#ddd' }}>{p.label}</div>
                  <div>
                    <button onClick={() => onSelectSample(p.id)} style={{ padding: '0.35em 0.6em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Use</button>
                  </div>
                </div>
              ))}
              <div style={{ color: '#999', marginTop: 8 }}>Tip: these are sample targets derived from Pools list. Paste a target address below to inspect its bonding info.</div>
            </div>
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Bond Action</div>

            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Target address</div>
                <input value={target} onChange={e => setTarget(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Currency (token address)</div>
                <input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
            </div>

            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Bond amount</div>
                <input value={bondAmount} onChange={e => setBondAmount(e.target.value)} placeholder="e.g., 100" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={onAttemptBond} style={{ padding: '0.45em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>Bond</button>
                <button onClick={() => { setTarget(''); setCurrency(''); setBondAmount(''); setOpError(null); setConfirmed(false); }} style={{ padding: '0.35em 0.6em', background: '#333', color: '#fff', borderRadius: 6 }}>Reset</button>
              </div>
            </div>

            {opError && <div style={{ color: '#ff8b8b', marginTop: 8 }}>Error: {opError}</div>}
            {confirmed && <div style={{ color: '#9ad', marginTop: 8 }}>Bond transaction simulated — success (UI placeholder).</div>}
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Bonding Info (for selected target)</div>
            {!target ? (
              <div style={{ color: '#999' }}>Select or paste a target address above to view bonding data.</div>
            ) : (
              <>
                <div style={{ color: '#bbb', marginBottom: 8 }}>Inspector</div>
                {bonding.loading ? (
                  <div style={{ color: '#999' }}>Loading bonding data…</div>
                ) : bonding.data ? (
                  <div style={{ color: '#ddd' }}>
                    <div>Bonded Amount (you): <strong style={{ color: '#fff' }}>{bonding.data.bondedAmount ?? 'n/a'}</strong></div>
                    <div>Pending Reward: <strong style={{ color: '#fff' }}>{bonding.data.pendingReward ?? 'n/a'}</strong></div>
                    <div>Total Bonded: <strong style={{ color: '#fff' }}>{bonding.data.totalBonded ?? 'n/a'}</strong></div>
                  </div>
                ) : (
                  <div style={{ color: '#999' }}>No bonding data available for this target/currency combination.</div>
                )}
              </>
            )}
          </div>
        </div>

        <aside>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>How Bonding Works</div>
            <div style={{ color: '#bbb' }}>
              Bonding lets users lock tokens to earn rewards for a target (project/contract). This UI is a marketplace scaffold — actual bond transactions and approvals should be wired to the Bonding contract.
            </div>
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { setTarget(''); setCurrency(''); setBondAmount(''); }} style={{ padding: '0.4em 0.8em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Clear</button>
              <button onClick={() => bonding.refetch()} style={{ padding: '0.4em 0.8em', background: '#333', color: '#fff', borderRadius: 6 }}>Refresh Bonding Data</button>
            </div>
          </div>
        </aside>
      </div>

      <TxModal
        open={txOpen}
        title="Confirm Bond"
        message={`Bond ${bondAmount} to target ${target} using currency ${currency}`}
        confirmLabel="Confirm Bond"
        cancelLabel="Cancel"
        onConfirm={handleConfirmBond}
        onCancel={() => setTxOpen(false)}
      />
    </div>
  );
}