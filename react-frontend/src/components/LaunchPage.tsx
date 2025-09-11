import React, { useMemo, useState } from 'react';
import { useWallet } from '../hooks';
import TxModal from './TxModal';

/**
 * LaunchPage
 * - Pool launchpad skeleton: form to define token pair, fee tier, initial liquidity, owner.
 * - Performs client-side validation and shows a preview. On confirm it simulates a create action
 *   (placeholder for on-chain pool creation logic).
 *
 * This is intentionally UI-first so we can wire the real create-pool transaction later.
 */

const container: React.CSSProperties = { padding: 20 };
const formRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' };
const panel: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' };

function validateAddress(a?: string) {
  if (!a) return false;
  return /^0x[0-9a-fA-F]{40}$/.test(a);
}

export default function LaunchPage() {
  const { account, signer } = useWallet();

  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [feeTier, setFeeTier] = useState('3000');
  const [initialLiquidity, setInitialLiquidity] = useState('');
  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [opError, setOpError] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const feeOptions = useMemo(() => [
    { value: '500', label: '0.05%' },
    { value: '3000', label: '0.3%' },
    { value: '10000', label: '1%' },
  ], []);

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!validateAddress(tokenA)) errors.push('Token A address is invalid or missing (requires 0x... address).');
    if (!validateAddress(tokenB)) errors.push('Token B address is invalid or missing (requires 0x... address).');
    if (tokenA && tokenB && tokenA.toLowerCase() === tokenB.toLowerCase()) errors.push('Token A and Token B must be different.');
    if (!initialLiquidity || isNaN(Number(initialLiquidity)) || Number(initialLiquidity) <= 0) errors.push('Initial liquidity must be a positive number.');
    if (!validateAddress(owner) && owner.length > 0) errors.push('Owner address is invalid.');
    if (!owner) errors.push('Owner address is required (who will receive pool admin privileges).');
    return errors;
  }, [tokenA, tokenB, initialLiquidity, owner]);

  const preview = useMemo(() => ({
    name: name || `${tokenA.slice(0, 6)}... / ${tokenB.slice(0, 6)}...`,
    tokenA,
    tokenB,
    feeTier,
    initialLiquidity,
    owner,
  }), [name, tokenA, tokenB, feeTier, initialLiquidity, owner]);

  function onAttemptCreate() {
    setOpError(null);
    if (validation.length > 0) {
      setOpError(validation.join(' '));
      return;
    }
    if (!signer) {
      setOpError('Connect a wallet / signer before creating a pool.');
      return;
    }
    setTxOpen(true);
  }

  async function handleConfirmCreate() {
    setTxOpen(false);
    // Placeholder: real create logic will call the PoolFactory / launchpad contract
    // For now we simulate success after a short delay and show a confirmation UI state.
    try {
      // simulate async
      await new Promise((res) => setTimeout(res, 700));
      setConfirmed(true);
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }

  return (
    <div style={container}>
      <h1>Launch — Create a Pool</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 12 }}>
        <div>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Pool Details</div>

            <div style={formRow}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Token A (address)</div>
                <input value={tokenA} onChange={e => setTokenA(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Token B (address)</div>
                <input value={tokenB} onChange={e => setTokenB(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
            </div>

            <div style={formRow}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Fee Tier</div>
                <select value={feeTier} onChange={e => setFeeTier(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }}>
                  {feeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Initial Liquidity (human)</div>
                <input value={initialLiquidity} onChange={e => setInitialLiquidity(e.target.value)} placeholder="e.g., 1000" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
            </div>

            <div style={formRow}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Owner (admin) address</div>
                <input value={owner} onChange={e => setOwner(e.target.value)} placeholder={account ?? '0x...'} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Friendly name (optional)</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="My Pool" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={onAttemptCreate} style={{ padding: '0.45em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>Create Pool</button>
              <button onClick={() => { setTokenA(''); setTokenB(''); setFeeTier('3000'); setInitialLiquidity(''); setOwner(''); setName(''); setOpError(null); setConfirmed(false); }} style={{ padding: '0.45em 0.9em', background: '#333', color: '#fff', borderRadius: 6 }}>Reset</button>
              <div style={{ marginLeft: 'auto', color: '#999' }}>{confirmed ? <span style={{ color: '#9ad' }}>Pool created (simulated)</span> : null}</div>
            </div>

            {opError && <div style={{ color: '#ff8b8b', marginTop: 8 }}>Error: {opError}</div>}
            <div style={{ marginTop: 12, color: '#999' }}>
              This is a UI-first implementation — actual on-chain pool creation will be wired to the PoolFactory contract later.
            </div>
          </div>
        </div>

        <aside>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview</div>
            <pre style={{ background: '#071018', padding: 8, borderRadius: 6, color: '#ddd', maxHeight: 360, overflow: 'auto' }}>
              {JSON.stringify(preview, null, 2)}
            </pre>
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#bbb', marginBottom: 6 }}>Validation</div>
              {validation.length === 0 ? <div style={{ color: '#9ad' }}>All fields look valid (preview ready).</div> : (
                <ul style={{ color: '#ffb3b3' }}>
                  {validation.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      <TxModal
        open={txOpen}
        title="Confirm Create Pool"
        message={`Create pool: ${preview.name}\nTokenA: ${tokenA}\nTokenB: ${tokenB}\nFee: ${feeTier}\nInitial liquidity: ${initialLiquidity}\nOwner: ${owner}`}
        confirmLabel="Create Pool"
        cancelLabel="Cancel"
        onConfirm={handleConfirmCreate}
        onCancel={() => setTxOpen(false)}
      />
    </div>
  );
}