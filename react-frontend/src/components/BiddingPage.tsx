import React, { useMemo, useState } from 'react';
import { useWallet, usePools } from '../hooks';
import TxModal from './TxModal';

/**
 * BiddingPage
 * - Minimal bidding UI and epoch/bid simulation.
 * - Lists sample pools as bid targets, allows placing a bid (simulated).
 *
 * Notes:
 * - This is UI-first. Real bidding transactions should be wired to the bidding contract
 *   and integrated with the txs slice / TxTray in a later step.
 */

const container: React.CSSProperties = { padding: 20 };
const panel: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd', marginBottom: 12 };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 };

export default function BiddingPage() {
  const { account, signer } = useWallet();
  const { pools } = usePools({ first: 12 });
  const poolOptions = useMemo(() => pools.map(p => ({ id: p.id, label: `${p.token0.symbol}/${p.token1.symbol}` })), [pools]);

  const [selectedPool, setSelectedPool] = useState<string>(poolOptions[0]?.id ?? '');
  const [bidAmount, setBidAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [txOpen, setTxOpen] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Local in-memory bids for UI demonstration
  const [bids, setBids] = useState<{ poolId: string; bidder: string; amount: string; note?: string }[]>([]);

  const validation = useMemo(() => {
    const errs: string[] = [];
    if (!selectedPool) errs.push('Select a pool to bid on.');
    if (!bidAmount || isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) errs.push('Bid amount must be a positive number.');
    if (!account) errs.push('Connect wallet to place a bid.');
    return errs;
  }, [selectedPool, bidAmount, account]);

  function onAttemptBid() {
    setOpError(null);
    if (validation.length > 0) {
      setOpError(validation.join(' '));
      return;
    }
    if (!signer) {
      setOpError('Connect a wallet (signer required) to submit bids.');
      return;
    }
    setTxOpen(true);
  }

  async function handleConfirmBid() {
    setTxOpen(false);
    try {
      // Simulate a tx delay and then record the bid in local state
      await new Promise(res => setTimeout(res, 700));
      setBids(prev => [{ poolId: selectedPool, bidder: account ?? 'unknown', amount: bidAmount, note }, ...prev]);
      setConfirmed(true);
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }

  return (
    <div style={container}>
      <h1>Bidding</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 12 }}>
        <div>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Place a Bid</div>

            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Pool</div>
                <select value={selectedPool} onChange={e => setSelectedPool(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }}>
                  <option value="">-- select pool --</option>
                  {poolOptions.map(p => <option key={p.id} value={p.id}>{p.label} ({p.id.slice(0,6)})</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Amount</div>
                <input value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="e.g., 1.25" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
            </div>

            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Note (optional)</div>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Why you're bidding..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={onAttemptBid} style={{ padding: '0.45em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>Submit Bid</button>
                <button onClick={() => { setBidAmount(''); setNote(''); setConfirmed(false); setOpError(null); }} style={{ padding: '0.35em 0.6em', background: '#333', color: '#fff', borderRadius: 6 }}>Reset</button>
              </div>
            </div>

            {opError && <div style={{ color: '#ff8b8b', marginTop: 8 }}>Error: {opError}</div>}
            {confirmed && <div style={{ color: '#9ad', marginTop: 8 }}>Bid simulated — recorded locally.</div>}
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Bids (local)</div>
            {bids.length === 0 ? <div style={{ color: '#999' }}>No bids placed yet.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bids.map((b, idx) => (
                  <div key={idx} style={{ padding: 8, borderRadius: 6, background: '#071018', border: '1px solid #101214' }}>
                    <div style={{ color: '#bbb' }}>{b.poolId.slice ? b.poolId.slice(0,12) : b.poolId} · <strong style={{ color: '#fff' }}>{b.amount}</strong></div>
                    <div style={{ color: '#999', fontSize: '0.9em' }}>{b.note}</div>
                    <div style={{ color: '#666', fontSize: '0.8em' }}>by {b.bidder}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>How Bidding Works</div>
            <div style={{ color: '#bbb' }}>
              This is a simplified bidding UI for demo purposes. Real bidding requires epoch handling, bid aggregation,
              and on-chain transactions wired to the bidding contract. We'll wire the full flow next.
            </div>
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { setBids([]); }} style={{ padding: '0.4em 0.8em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Clear Local Bids</button>
              <button onClick={() => { setConfirmed(false); setOpError(null); }} style={{ padding: '0.4em 0.8em', background: '#333', color: '#fff', borderRadius: 6 }}>Reset Status</button>
            </div>
          </div>
        </aside>
      </div>

      <TxModal
        open={txOpen}
        title="Confirm Bid"
        message={`Submit bid of ${bidAmount} to pool ${selectedPool}${note ? `\nNote: ${note}` : ''}`}
        confirmLabel="Confirm Bid"
        cancelLabel="Cancel"
        onConfirm={handleConfirmBid}
        onCancel={() => setTxOpen(false)}
      />
    </div>
  );
}