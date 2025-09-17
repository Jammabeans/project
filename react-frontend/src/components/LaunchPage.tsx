import React, { useMemo, useState, useEffect } from 'react';
import { useWallet } from '../hooks';
import TxModal from './TxModal';
import useLaunchPadActions from '../hooks/useLaunchPadActions';
import { BrowserProvider } from 'ethers';
import { getChainSettings } from '../config/chainSettings';

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
  const { account, signer, connect } = useWallet();

  // Mode: choose which launch flow the user wants
  // - 'new-native' -> create a new ERC20 and init pool with native ETH
  // - 'supplied-native' -> use an existing token address and init pool with native ETH
  // - 'token-token' -> token-token pool (not implemented here, simulated)
  const [mode, setMode] = useState<'new-native' | 'supplied-native' | 'token-token'>('new-native');

  // For supplied-token flows (existing address fields)
  const [tokenA, setTokenA] = useState(''); // used for supplied token address when mode = supplied-native or token-token
  const [tokenB, setTokenB] = useState(''); // used for token-token supplied flows

  // For new-token flows (name/symbol/supply)
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('1000000');

  const [feeTier, setFeeTier] = useState('3000');
  const [initialLiquidity, setInitialLiquidity] = useState('');
  const [name, setName] = useState('');
  const [opError, setOpError] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  // sensible defaults aligned with on-chain tests
  const DEFAULT_TICK_SPACING = 60;
  const DEFAULT_SQRT_PRICE_X96 = 0; // leave 0 so hook uses 1<<96
  const [tickSpacingInput, setTickSpacingInput] = useState(String(DEFAULT_TICK_SPACING));
  const [sqrtPriceInput, setSqrtPriceInput] = useState(String(DEFAULT_SQRT_PRICE_X96));

  // LaunchPad actions (wrappers for on-chain write calls)
  const launchpad = useLaunchPadActions();

  const feeOptions = useMemo(() => [
    { value: '500', label: '0.05%' },
    { value: '3000', label: '0.3%' },
    { value: '10000', label: '1%' },
  ], []);

  const validation = useMemo(() => {
    const errors: string[] = [];

    // Mode-specific validation
    if (mode === 'new-native') {
      if (!tokenName) errors.push('Token name is required for new-token flow.');
      if (!tokenSymbol) errors.push('Token symbol is required for new-token flow.');
      if (!tokenSupply || isNaN(Number(tokenSupply)) || Number(tokenSupply) <= 0) errors.push('Token supply must be a positive number.');
    }

    if (mode === 'supplied-native') {
      if (!validateAddress(tokenA)) errors.push('Existing token address is invalid or missing (requires 0x... address).');
    }

    // initialLiquidity is optional at pool creation (Add LP is a separate step).
    return errors;
  }, [mode, tokenA, tokenB, tokenName, tokenSymbol, tokenSupply]);

  const preview = useMemo(() => {
    if (mode === 'new-native') {
      return {
        name: name || `${tokenName || tokenSymbol} (new) / ETH`,
        tokenName,
        tokenSymbol,
        tokenSupply,
        feeTier,
        initialLiquidity,
      };
    }
    if (mode === 'supplied-native') {
      return {
        name: name || `${tokenA.slice(0, 6)}... / ETH`,
        tokenA,
        feeTier,
        initialLiquidity,
      };
    }
    return {
      name: name || `${tokenA.slice(0, 6)}... / ${tokenB.slice(0, 6)}...`,
      tokenA,
      tokenB,
      feeTier,
      initialLiquidity,
    };
  }, [mode, name, tokenA, tokenB, tokenName, tokenSymbol, tokenSupply, feeTier, initialLiquidity]);

  async function onAttemptCreate() {
    setOpError(null);
    if (validation.length > 0) {
      setOpError(validation.join(' '));
      return;
    }
    // Ensure the app has an active signer; if not, attempt to prompt the user to connect
    if (!signer) {
      if (typeof (window as any).ethereum !== 'undefined' && connect) {
        try {
          await connect();
        } catch (err: any) {
          setOpError('Failed to connect wallet: ' + (err?.message ?? String(err)));
          return;
        }
      }
    }
    // final guard: must have at least an account
    if (!account) {
      setOpError('Connect a wallet/address before creating a pool.');
      return;
    }
    setTxOpen(true);
  }

  async function handleConfirmCreate() {
    setTxOpen(false);
    try {
      // Ensure signer available; try to prompt connect if not.
      if (!signer && typeof (window as any).ethereum !== 'undefined' && (window as any).ethereum.request) {
        try {
          await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        } catch {
          // ignore - will check below
        }
      }
      if (!launchpad) throw new Error('Launchpad actions not available');
      // Call the appropriate launchpad action depending on mode
      if (mode === 'new-native') {
        // createNewTokenAndInitWithNative(name, symbol, supply, fee, tickSpacing, sqrtPriceX96)
        // hooks (masterControl) is resolved and injected inside the action; do not pass it from UI.
        const tx = await launchpad.createNewTokenAndInitWithNative({
          tokenName: tokenName || tokenSymbol,
          tokenSymbol: tokenSymbol || tokenName,
          tokenSupply: tokenSupply || '1000000',
          fee: Number(feeTier),
          // Use the same defaults as tests / on-chain expectations
          tickSpacing: 60,
          // Let the action default to the canonical 1<<96 when passed 0
          sqrtPriceX96: 0
        });
        // wait for confirmation if tx returned
        if (tx && tx.wait) await tx.wait();
        setConfirmed(true);
        return;
      } else if (mode === 'supplied-native') {
        const tx = await launchpad.createSuppliedTokenAndInitWithNative({
          existingTokenAddr: tokenA,
          fee: Number(feeTier),
          // use canonical tick spacing used in tests
          tickSpacing: 60,
          sqrtPriceX96: 0
        });
        if (tx && tx.wait) await tx.wait();
        setConfirmed(true);
        return;
      } else {
        // token-token and other flows are simulated for now
        await new Promise((res) => setTimeout(res, 700));
        setConfirmed(true);
        return;
      }
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }

  // Debug info for wallet/provider/signature availability
  const [debug, setDebug] = useState<{ selectedAddress?: string | null; chainId?: string | null; signerAddress?: string | null; network?: any; error?: string | null }>({ selectedAddress: null, chainId: null, signerAddress: null, network: null, error: null });
  useEffect(() => {
    (async () => {
      try {
        const eth: any = (window as any).ethereum;
        const selected = eth?.selectedAddress ?? null;
        const cid = eth?.chainId ?? null;
        if (!eth) {
          setDebug(d => ({ ...d, error: 'No injected ethereum provider detected (window.ethereum missing).' }));
          return;
        }
        const p = new BrowserProvider(eth);
        let signerAddr: string | null = null;
        try {
          // BrowserProvider.getSigner() returns a Promise; await it to obtain the signer instance
          const s = await p.getSigner();
          signerAddr = await s.getAddress();
        } catch {
          signerAddr = null;
        }
        let network = null;
        try {
          network = await p.getNetwork();
        } catch {
          network = null;
        }
        setDebug({ selectedAddress: selected, chainId: cid, signerAddress: signerAddr, network, error: null });
      } catch (e: any) {
        setDebug(d => ({ ...d, error: e?.message ?? String(e) }));
      }
    })();
  // refresh debug when account/chain changes
  }, [account]);
  
  return (
    <div style={container}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>Launch — Create a Pool</span>
        <small style={{ color: '#9ad', fontSize: '0.9rem' }}>{account ? account : 'No wallet connected'}</small>
      </h1>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#bbb', fontSize: '0.9rem' }}>
          Debug: selectedAddress: <code style={{ color: '#9ad' }}>{debug.selectedAddress ?? '—'}</code> |
          chainId: <code style={{ color: '#9ad' }}>{debug.chainId ?? '—'}</code> |
          signer: <code style={{ color: '#9ad' }}>{debug.signerAddress ?? 'no signer'}</code>
        </div>
        {debug.error && <div style={{ color: '#ff8b8b' }}>Debug error: {String(debug.error)}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 12 }}>
        <div>
          <div style={panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Pool Details</div>
              {account ? (
                <div style={{ color: '#9ad', fontSize: '0.9rem' }}>{account}</div>
              ) : (
                <button
                  onClick={async () => {
                    setOpError(null);
                    try {
                      await connect();
                    } catch (err: any) {
                      setOpError(err?.message ?? String(err));
                    }
                  }}
                  style={{ padding: '0.35em 0.6em', background: '#1976d2', color: '#fff', borderRadius: 6 }}
                >
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Mode selector — show only the fields required for the chosen flow */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <label style={{ color: mode === 'new-native' ? '#fff' : '#bbb', cursor: 'pointer' }}>
                <input type="radio" checked={mode === 'new-native'} onChange={() => setMode('new-native')} /> New token + ETH
              </label>
              <label style={{ color: mode === 'supplied-native' ? '#fff' : '#bbb', cursor: 'pointer' }}>
                <input type="radio" checked={mode === 'supplied-native'} onChange={() => setMode('supplied-native')} /> Use existing token + ETH
              </label>
              <label style={{ color: mode === 'token-token' ? '#fff' : '#bbb', cursor: 'pointer' }}>
                <input type="radio" checked={mode === 'token-token'} onChange={() => setMode('token-token')} /> Token + Token
              </label>
            </div>

            {/* New token flow: ask only for name/symbol/supply */}
            {mode === 'new-native' && (
              <div style={formRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Token name</div>
                  <input value={tokenName} onChange={e => setTokenName(e.target.value)} placeholder="MyToken" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Token symbol</div>
                  <input value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} placeholder="MTK" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Token supply</div>
                  <input value={tokenSupply} onChange={e => setTokenSupply(e.target.value)} placeholder="1000000" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
                </div>
              </div>
            )}

            {/* Supplied token + ETH: only ask for existing token address */}
            {mode === 'supplied-native' && (
              <div style={formRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Existing token address</div>
                  <input value={tokenA} onChange={e => setTokenA(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
                </div>
                <div style={{ flex: 1 }} />
              </div>
            )}

            {/* Token-token flow: ask for both token addresses */}
            {mode === 'token-token' && (
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
            )}

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
                <div style={{ color: '#bbb', fontSize: '0.9rem' }}>Friendly name (optional)</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="My Pool" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={onAttemptCreate} style={{ padding: '0.45em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>Create Pool</button>
              <button onClick={() => {
                setMode('new-native');
                setTokenA(''); setTokenB(''); setTokenName(''); setTokenSymbol(''); setTokenSupply('1000000');
                setFeeTier('3000'); setInitialLiquidity(''); setName(''); setOpError(null); setConfirmed(false);
              }} style={{ padding: '0.45em 0.9em', background: '#333', color: '#fff', borderRadius: 6 }}>Reset</button>

              <button onClick={() => { /* placeholder: add LP flow */ }} style={{ padding: '0.45em 0.9em', background: '#1565c0', color: '#fff', borderRadius: 6 }}>Add LP</button>

              <div style={{ marginLeft: 'auto', color: '#999' }}>{confirmed ? <span style={{ color: '#9ad' }}>Pool created</span> : null}</div>
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
        message={`Create pool: ${preview.name}\nTokenA: ${tokenA}\nTokenB: ${tokenB}\nFee: ${feeTier}\nInitial liquidity: ${initialLiquidity}`}
        confirmLabel="Create Pool"
        cancelLabel="Cancel"
        onConfirm={handleConfirmCreate}
        onCancel={() => setTxOpen(false)}
      />
    </div>
  );
}