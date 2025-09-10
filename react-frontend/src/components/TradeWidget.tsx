import React, { useMemo, useState, useEffect } from 'react';
import { Contract, parseUnits } from 'ethers';
import { useWallet } from '../hooks';
import { useDispatch } from 'react-redux';
import { addTx, setTxHash, setTxSuccess, setTxFailed } from '../features/txs/txsSlice';

/**
 * TradeWidget (enhanced placeholder)
 * - Read-only preview plus a simple approve + mock swap flow integrated with txs slice.
 * - If token addresses and a ROUTER/ROUTER_SPENDER address are provided via props/env,
 *   the component will attempt to read allowance and call approve using the connected signer.
 *
 * Props:
 * - poolId?: string|number for display
 * - token0Label / token1Label: labels
 * - token0Address / token1Address?: optional ERC20 address strings for allowance checks
 *
 * Behavior:
 * - If no tokenAddress or no signer, approve flow is disabled and a mock swap is used.
 * - Approve (real) will be sent when signer & spender env var available.
 */

type Props = {
  poolId?: string | number | null;
  token0Label?: string;
  token1Label?: string;
  token0Address?: string | null;
  token1Address?: string | null;
};

const container: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: '#0f1113',
  border: '1px solid #222',
  color: '#ddd',
  marginTop: 12,
};

const inputStyle: React.CSSProperties = { width: '100%', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#fff' };

// Minimal ERC20 ABI for allowance/approve
const ERC20_ABI = [
  'function allowance(address owner,address spender) view returns (uint256)',
  'function approve(address spender,uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

// max uint256 as BigInt (use string to avoid bigint literal issues)
const MAX_UINT = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export default function TradeWidget({
  poolId,
  token0Label = 'Token0',
  token1Label = 'Token1',
  token0Address = null,
  token1Address = null,
}: Props) {
  const dispatch = useDispatch();
  const { signer, account } = useWallet();
  const [inputToken, setInputToken] = useState<'token0' | 'token1'>('token0');
  const [amountIn, setAmountIn] = useState<string>('1');

  // Placeholder price / fee assumptions for preview
  const FEE_BIPS = 30; // 0.30%
  const feeFactor = useMemo(() => 1 - FEE_BIPS / 10000, []);

  // allowance state (per token)
  const [allowance, setAllowance] = useState<Record<string, string | null>>({ token0: null, token1: null });
  const [loadingAllowance, setLoadingAllowance] = useState(false);
  const [opInFlight, setOpInFlight] = useState(false);
  const ROUTER_SPENDER = process.env.REACT_APP_ROUTER_ADDRESS ?? process.env.REACT_APP_MASTER_CONTROL_ADDRESS ?? null;

  // Determine active token address
  const activeAddress = inputToken === 'token0' ? token0Address : token1Address;

  useEffect(() => {
    let mounted = true;
    async function fetchAllowance() {
      if (!signer || !account || !activeAddress || !ROUTER_SPENDER) {
        if (mounted) setAllowance(prev => ({ ...prev, [inputToken]: null }));
        return;
      }
      setLoadingAllowance(true);
      try {
        // resolve signer if it's a promise (some providers expose a promise-like signer)
        const runner = signer && (typeof (signer as any)?.then === 'function' ? await signer : signer);
        const token = new Contract(activeAddress, ERC20_ABI, runner as any);
        const a: any = await token.allowance(account, ROUTER_SPENDER);
        if (!mounted) return;
        setAllowance(prev => ({ ...prev, [inputToken]: a?.toString?.() ?? String(a) }));
      } catch {
        if (mounted) setAllowance(prev => ({ ...prev, [inputToken]: null }));
      } finally {
        if (mounted) setLoadingAllowance(false);
      }
    }
    // call helper
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchAllowance();
    return () => { mounted = false; };
  }, [signer, account, activeAddress, inputToken, ROUTER_SPENDER]);

  // Simple preview: assume 1:1 price (placeholder) and apply fee
  const preview = useMemo(() => {
    const inNum = Number(amountIn || 0);
    if (!inNum || inNum <= 0) return { amountOut: 0, feeAmount: 0 };
    const feeAmount = inNum * (FEE_BIPS / 10000);
    const amountOut = (inNum - feeAmount) * 1; // 1:1 price assumption
    return { amountOut, feeAmount };
  }, [amountIn, feeFactor]);

  const needsApprove = !!activeAddress && !!ROUTER_SPENDER && (() => {
    const a = allowance[inputToken];
    try {
      if (!a) return true;
      // treat very large allowance as fine (1e18)
      return BigInt(a) < BigInt('1000000000000000000');
    } catch {
      return true;
    }
  })();

  async function handleApprove() {
    if (!signer || !activeAddress || !ROUTER_SPENDER) {
      // not possible: show mock flow
      return;
    }
    setOpInFlight(true);
    const localId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    dispatch(addTx({ id: localId, type: 'approve', meta: { token: activeAddress } }));
    try {
      // resolve signer if it's a promise (useWallet may expose a promise-like signer)
      const runner = signer && (typeof (signer as any)?.then === 'function' ? await signer : signer);
      const token = new Contract(activeAddress, ERC20_ABI, runner as any);
      const tx = await token.approve(ROUTER_SPENDER, MAX_UINT);
      dispatch(setTxHash({ id: localId, hash: tx.hash ?? tx.transactionHash ?? String(tx.hash ?? '') }));
      await tx.wait?.();
      dispatch(setTxSuccess({ id: localId }));
      // refresh allowance
      const a: any = await token.allowance(account, ROUTER_SPENDER);
      setAllowance(prev => ({ ...prev, [inputToken]: a?.toString?.() ?? String(a) }));
    } catch (err: any) {
      dispatch(setTxFailed({ id: localId, error: err?.message ?? String(err) }));
    } finally {
      setOpInFlight(false);
    }
  }

  async function handleSwapMock() {
    // For now perform a mock swap: create tx record and mark success after timeout.
    const localId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    dispatch(addTx({ id: localId, type: 'swap', meta: { poolId, inputToken, amountIn } }));
    setOpInFlight(true);
    try {
      // Optionally: if signer and ROUTER_SPENDER available, we could attempt a real transaction.
      // For safety in this staged flow we mock the transaction.
      dispatch(setTxHash({ id: localId, hash: `0xmock${localId}` }));
      await new Promise(resolve => setTimeout(resolve, 1400));
      dispatch(setTxSuccess({ id: localId }));
    } catch (err: any) {
      dispatch(setTxFailed({ id: localId, error: err?.message ?? String(err) }));
    } finally {
      setOpInFlight(false);
    }
  }
  
  // Attempt a real swap call on a router contract (defensive)
  async function handleExecuteSwap() {
    if (!signer || !account || !activeAddress || !token0Address || !token1Address || !process.env.REACT_APP_ROUTER_ADDRESS) {
      // Fallback to mock if router or signer not configured
      return handleSwapMock();
    }
    setOpInFlight(true);
    const localId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    dispatch(addTx({ id: localId, type: 'swap', meta: { poolId, inputToken, amountIn } }));
    try {
      const runner = signer && (typeof (signer as any)?.then === 'function' ? await signer : signer);
      const routerAddr = process.env.REACT_APP_ROUTER_ADDRESS!;
      // Minimal router ABI with swapExactTokensForTokens
      const ROUTER_ABI = ['function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) returns (uint256[])'];
      const router = new Contract(routerAddr, ROUTER_ABI, runner as any);
      // parse amount using 18 decimals as safe default
      const amountInParsed = parseUnits(amountIn || '0', 18);
      const path = inputToken === 'token0' ? [token0Address!, token1Address!] : [token1Address!, token0Address!];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      // estimate gas (best-effort)
      try {
        if ((router.estimateGas as any)?.swapExactTokensForTokens) {
          await (router.estimateGas as any).swapExactTokensForTokens(amountInParsed, 0, path, account, deadline);
        }
      } catch {
        // ignore estimate errors
      }
      const tx = await router.swapExactTokensForTokens(amountInParsed, 0, path, account, deadline);
      dispatch(setTxHash({ id: localId, hash: tx.hash ?? tx.transactionHash ?? String(tx.hash ?? '') }));
      await tx.wait?.();
      dispatch(setTxSuccess({ id: localId }));
    } catch (err: any) {
      dispatch(setTxFailed({ id: localId, error: err?.message ?? String(err) }));
    } finally {
      setOpInFlight(false);
    }
  }

  return (
    <div style={container}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ color: '#fff' }}>Trade Preview</strong>
        <div style={{ marginLeft: 'auto', color: '#999' }}>{poolId ? `Pool ${String(poolId)}` : ''}</div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 6, color: '#bbb' }}>Input Token</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setInputToken('token0')}
            style={{
              flex: 1,
              padding: '0.5em',
              background: inputToken === 'token0' ? '#1976d2' : '#222',
              color: '#fff',
              borderRadius: 6,
              border: '1px solid #333',
            }}
          >
            {token0Label}
          </button>
          <button
            onClick={() => setInputToken('token1')}
            style={{
              flex: 1,
              padding: '0.5em',
              background: inputToken === 'token1' ? '#1976d2' : '#222',
              color: '#fff',
              borderRadius: 6,
              border: '1px solid #333',
            }}
          >
            {token1Label}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 6, color: '#bbb' }}>Amount In</label>
        <input
          type="number"
          min="0"
          step="any"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          style={inputStyle}
          placeholder="0.0"
        />
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid #222', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ color: '#bbb' }}>Estimated Out</div>
          <div style={{ color: '#fff' }}>{preview.amountOut.toFixed(6)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ color: '#bbb' }}>Fee ({(FEE_BIPS / 100).toFixed(2)}%)</div>
          <div style={{ color: '#fff' }}>{preview.feeAmount.toFixed(6)}</div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {activeAddress && ROUTER_SPENDER ? (
            <>
              <button
                onClick={handleApprove}
                disabled={!needsApprove || !signer || loadingAllowance || opInFlight}
                style={{ padding: '0.5em 0.9em', background: needsApprove ? '#1976d2' : '#4caf50', color: '#fff', borderRadius: 6 }}
              >
                {loadingAllowance ? 'Checking...' : needsApprove ? 'Approve Token' : 'Approved'}
              </button>
              <button
                onClick={handleExecuteSwap}
                disabled={opInFlight || (needsApprove && (!signer || needsApprove))}
                style={{ padding: '0.5em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6, marginLeft: 'auto' }}
              >
                Swap
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSwapMock} disabled={opInFlight} style={{ padding: '0.5em 0.9em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>
                Swap (mock)
              </button>
              <div style={{ marginLeft: 'auto', color: '#777' }}>Provide token/router addresses to enable approve flow</div>
            </>
          )}
        </div>

        <div style={{ color: '#777', fontSize: '0.9em', marginTop: 8 }}>
          This is a staged swap flow: approve will call token.approve when a signer and router address are configured. Swap is currently a mock integrated with the tx manager.
        </div>
      </div>
    </div>
  );
}