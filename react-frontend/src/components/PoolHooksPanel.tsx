import React, { useState } from 'react';
import { usePoolHooks, useCommandFees, useContracts, useWallet, useAdminActions } from '../hooks';
import { useDispatch } from 'react-redux';
import { addTx, setTxHash, setTxSuccess, setTxFailed } from '../features/txs/txsSlice';
import HooksDryRunPanel from './HooksDryRunPanel';
import TxModal from './TxModal';

/**
 * PoolHooksPanel (read-only)
 * - Simple admin/read-only panel that shows MasterControl commands and pool targets for a given poolId + hookPath.
 * - Designed for the Hooks Admin read-only UI (drill-in preview + refresh).
 *
 * Usage: mount on a pool admin page (e.g., /pool/:id/admin) or render in dev shell.
 */

const PanelContainer: React.CSSProperties = {
  background: '#121318',
  color: '#fff',
  padding: 16,
  borderRadius: 8,
  border: '1px solid #222',
  maxWidth: 740,
};

const Row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 };

const SmallNote: React.CSSProperties = { color: '#bbb', fontSize: '0.85em' };

const Table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };

const Th: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #222', color: '#ddd' };
const Td: React.CSSProperties = { padding: '8px 6px', borderBottom: '1px solid #1a1a1a', color: '#ccc' };

const PoolHooksPanel: React.FC = () => {
  const [poolInput, setPoolInput] = useState<string>('');
  const [hookPathInput, setHookPathInput] = useState<string>('');
  const [submittedPool, setSubmittedPool] = useState<string | number | null>(null);
  const [submittedHookPath, setSubmittedHookPath] = useState<string | null>(null);

  // Hook expects poolId (number|string|null) and hookPath (string|null)
  const { commands, targets, locks, loading, error, refetch } = usePoolHooks(
    submittedPool,
    submittedHookPath ?? null,
    { pollIntervalMs: null }
  );

  // Fetch COMMAND_FEE_BIPS for known targets (optional; some targets may not expose it)
  const { fees: targetFees, loading: feesLoading, error: feesError, refetch: refetchFees } =
    useCommandFees(targets ?? null);

  const onFetch = () => {
    // prefer numeric id if the user entered a number, else pass as string/hex
    const trimmed = poolInput.trim();
    const numeric = /^\d+$/.test(trimmed);
    setSubmittedPool(numeric ? Number(trimmed) : (trimmed || null));
    setSubmittedHookPath(hookPathInput.trim() || null);
  };

  return (
    <div style={PanelContainer}>
      <h3 style={{ marginTop: 0 }}>Hooks Admin — Read Only</h3>

      <div style={Row}>
        <label style={{ minWidth: 80 }}>Pool Id:</label>
        <input
          value={poolInput}
          onChange={e => setPoolInput(e.target.value)}
          placeholder="numeric poolId or hex"
          style={{ padding: '0.45em', width: 220 }}
        />
        <label style={{ minWidth: 80 }}>Hook Path:</label>
        <input
          value={hookPathInput}
          onChange={e => setHookPathInput(e.target.value)}
          placeholder="e.g. beforeSwap or bytes32 hash"
          style={{ padding: '0.45em', width: 240 }}
        />
        <button
          onClick={onFetch}
          disabled={!poolInput}
          style={{ marginLeft: 8, padding: '0.45em 0.9em', background: '#1976d2', color: '#fff', borderRadius: 6 }}
        >
          Fetch
        </button>

        <button
          onClick={() => refetch()}
          disabled={loading || !submittedPool}
          style={{ marginLeft: 8, padding: '0.35em 0.8em', background: '#333', color: '#fff', borderRadius: 6 }}
        >
          Refresh
        </button>
      </div>

      {loading && <div style={SmallNote}>Loading commands/targets...</div>}
      {error && <div style={{ color: '#ff6b6b', marginTop: 8 }}>Error: {String(error)}</div>}

      {targets && targets.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.95em', marginBottom: 6 }}>Pool Command Targets</div>
          <ul style={{ margin: 0, paddingLeft: 14 }}>
            {targets.map(t => (
              <li key={t} style={{ color: '#ccc', marginBottom: 6 }}>
                <code style={{ color: '#9ad' }}>{t}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {commands && commands.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.95em', marginBottom: 6 }}>Commands ({commands.length})</div>
          <table style={Table}>
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
                    <td style={Td}><code>{String(c.selector)}</code></td>
                    <td style={Td}>{String(c.callType)}</td>
                    <td style={Td}>{String(c.feeBips)}</td>
                    <td style={Td}>{String(c.provenanceBlockId ?? '')}</td>
                    <td style={Td}>{locked ? 'Yes' : 'No'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !commands && !targets && (
        <div style={{ marginTop: 12, color: '#999' }}>
          No data loaded — enter a Pool Id and (optionally) a Hook Path then click Fetch.
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div style={SmallNote}>
          This is a read-only preview for Hooks Admin. Full admin actions (applyBlocks, setCommands) belong in the admin workflow and require confirmations.
        </div>
      </div>

      {/* Dry-run panel: allow admins to paste a draft Command[] and preview fee delta + locked commands */}
      <div style={{ marginTop: 16 }}>
        <HooksDryRunPanel existingTargetFees={targetFees ?? null} existingLocks={locks ?? null} onValidate={(valid) => { /* optional callback */ }} />
      </div>

      {/* Admin submit area: paste a draft Command[] JSON to estimate and submit on-chain */}
      <div style={{ marginTop: 18, padding: 12, border: '1px solid #1b1b1b', borderRadius: 8, background: '#0b0b0d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <strong style={{ color: '#ddd' }}>Admin Submit (setCommands)</strong>
          <span style={{ color: '#888', fontSize: '0.9em' }}>Paste Command[] JSON and click Estimate / Submit</span>
        </div>

        <AdminSubmitArea
          poolId={submittedPool}
          hookPath={submittedHookPath ?? null}
          existingTargetFees={targetFees ?? null}
          existingLocks={locks ?? null}
        />
      </div>
    </div>
  );
};


/* ----------------- AdminSubmitArea (inline) ----------------- */
/* Small inline component to keep admin submit UX colocated */
type AdminSubmitProps = {
  poolId?: string | number | null;
  hookPath?: string | null;
  existingTargetFees?: Record<string, number | null> | null;
  existingLocks?: Record<string, boolean> | null;
};

const AdminSubmitArea: React.FC<AdminSubmitProps> = ({ poolId, hookPath, existingTargetFees, existingLocks }) => {
  const [submitJson, setSubmitJson] = React.useState<string>('[]');
  const [parsed, setParsed] = React.useState<any[] | null>(null);
  const [gasEstimate, setGasEstimate] = React.useState<string | null>(null);
  const [txHash, setTxHashLocal] = React.useState<string | null>(null);
  const [opLoading, setOpLoading] = React.useState(false);
  const [opError, setOpError] = React.useState<string | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMsg, setModalMsg] = React.useState<string>('');

  const { signer, account } = useWallet();
  const { estimateSetCommands, sendSetCommands } = useAdminActions();
  const dispatch = useDispatch();

  const tryParse = React.useCallback(() => {
    try {
      const p = JSON.parse(submitJson);
      if (!Array.isArray(p)) throw new Error('JSON must be an array of commands');
      setParsed(p);
      setOpError(null);
    } catch (err: any) {
      setParsed(null);
      setOpError(err?.message ?? String(err));
    }
  }, [submitJson]);

  React.useEffect(() => { tryParse(); }, [submitJson, tryParse]);

  const onEstimate = React.useCallback(async () => {
    setGasEstimate(null);
    setOpError(null);
    if (!parsed) { setOpError('No valid commands parsed'); return; }
    if (!poolId) { setOpError('No poolId selected'); return; }
    if (!hookPath) { setOpError('No hookPath selected'); return; }
    try {
      const est = await estimateSetCommands(Number(poolId), hookPath, parsed);
      setGasEstimate(est ? est.toString() : 'n/a');
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }, [parsed, poolId, hookPath, estimateSetCommands]);

  const createLocalId = () => `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const handleConfirmSubmit = React.useCallback(async () => {
    // close modal
    setModalOpen(false);

    const id = createLocalId();
    dispatch(addTx({ id, type: 'setCommands', meta: { poolId, hookPath, cmdCount: parsed?.length ?? 0 } }));

    setOpLoading(true);
    setOpError(null);
    try {
      const tx = await sendSetCommands(Number(poolId), hookPath!, parsed!);
      const hash = (tx && (tx.hash ?? tx.transactionHash)) ?? null;
      if (hash) {
        dispatch(setTxHash({ id, hash }));
        setTxHashLocal(hash);
      }
      dispatch(setTxSuccess({ id }));
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      dispatch(setTxFailed({ id, error: msg }));
      setOpError(msg);
    } finally {
      setOpLoading(false);
    }
  }, [dispatch, parsed, poolId, hookPath, sendSetCommands]);

  const onSubmit = React.useCallback(() => {
    setOpError(null);
    if (!parsed) { setOpError('No valid commands parsed'); return; }
    if (!poolId) { setOpError('No poolId selected'); return; }
    if (!hookPath) { setOpError('No hookPath selected'); return; }
    if (!signer) { setOpError('No signer available (connect wallet)'); return; }

    const message = `Call setCommands on pool ${poolId}\nhookPath: ${hookPath}\ncommands: ${parsed.length}\n\nThis will create an on-chain transaction. Proceed?`;
    setModalMsg(message);
    setModalOpen(true);
  }, [parsed, poolId, hookPath, signer]);

  return (
    <div>
      <TxModal
        open={modalOpen}
        title="Confirm setCommands"
        message={modalMsg}
        confirmLabel="Send Transaction"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setModalOpen(false)}
      />

      <textarea
        value={submitJson}
        onChange={(e) => setSubmitJson(e.target.value)}
        style={{ width: '100%', minHeight: 120, background: '#071018', color: '#eee', padding: 8, borderRadius: 6, border: '1px solid #222' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <button onClick={onEstimate} disabled={!parsed || !poolId || !hookPath} style={{ padding: '0.45em 0.9em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>
          Estimate Gas
        </button>
        <button onClick={onSubmit} disabled={!parsed || !poolId || !hookPath || opLoading} style={{ padding: '0.45em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>
          Submit setCommands
        </button>
        <div style={{ marginLeft: 'auto', color: '#999' }}>
          {gasEstimate && <span>Estimated gas: <strong style={{ color: '#fff' }}>{gasEstimate}</strong></span>}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {opError && <div style={{ color: '#ff6b6b' }}>Error: {String(opError)}</div>}
        {txHash && <div style={{ color: '#7ee787' }}>Tx submitted: <code>{txHash}</code></div>}
      </div>
    </div>
  );
};

export default PoolHooksPanel;