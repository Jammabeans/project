import React, { useCallback, useState } from 'react';
import { usePoolHooks, useCommandFees, useAdminActions, useWallet } from '../hooks';
import HooksDryRunPanel from './HooksDryRunPanel';
import TxModal from './TxModal';
import { useDispatch } from 'react-redux';
import { addTx, setTxHash, setTxSuccess, setTxFailed } from '../features/txs/txsSlice';
import BlocksPalette from './BlocksPalette';

/**
 * HooksEditor
 * - Minimal editor scaffold for the Hooks Admin flow (read-only first, then edit/submit).
 * - Allows pasting a Command[] JSON draft, runs dry-run (fee preview + lock detection),
 *   estimates gas and submits via useAdminActions.
 *
 * Props:
 * - poolId: number|string|null
 * - hookPath: string|null
 *
 * This is intentionally lightweight and intended to be embedded inside PoolAdmin or HooksAdmin pages.
 */

type Props = {
  poolId?: number | string | null;
  hookPath?: string | null;
};

export default function HooksEditor({ poolId, hookPath }: Props) {
  const { commands: existingCommands, locks, targets } = usePoolHooks(poolId ?? null, hookPath ?? null, { provider: undefined, pollIntervalMs: null });
  const { fees: existingFees } = useCommandFees(targets ?? null, { provider: undefined, pollIntervalMs: null });
  const { signer } = useWallet();
  const { estimateSetCommands, sendSetCommands, estimateApplyBlocks, sendApplyBlocks } = useAdminActions();
  const dispatch = useDispatch();

  const [draftText, setDraftText] = useState<string>(JSON.stringify(existingCommands ?? [], null, 2));
  const [parsed, setParsed] = useState<any[] | null>(existingCommands ?? null);
  const [opError, setOpError] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [txMsg, setTxMsg] = useState<string>('');

  const tryParse = useCallback(() => {
    try {
      const p = JSON.parse(draftText);
      if (!Array.isArray(p)) throw new Error('JSON must be an array of commands');
      setParsed(p);
      setOpError(null);
    } catch (err: any) {
      setParsed(null);
      setOpError(err?.message ?? String(err));
    }
  }, [draftText]);

  React.useEffect(() => {
    tryParse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftText]);

  const onEstimate = useCallback(async () => {
    setGasEstimate(null);
    setOpError(null);
    if (!parsed) { setOpError('No valid commands parsed'); return; }
    if (!poolId) { setOpError('No poolId selected'); return; }
    if (!hookPath) { setOpError('No hookPath selected'); return; }
    try {
      const est = await estimateSetCommands(Number(poolId), hookPath, parsed);
      setGasEstimate(est ? String(est) : 'n/a');
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }, [parsed, poolId, hookPath, estimateSetCommands]);

  const createLocalId = () => `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Local apply-blocks list (blocks selected from palette)
  const [applyList, setApplyList] = useState<{ id: number | string; representativeHook?: string; commands?: any[] | null }[]>([]);

  const addBlockToApplyList = useCallback((b: any) => {
    setApplyList(prev => [...prev, { id: b.id, representativeHook: b.representativeHook, commands: b.commands ?? null }]);
    // append block commands to the draft if available, otherwise append a placeholder
    try {
      const parsedDraft = parsed ?? [];
      const commandsToAppend = Array.isArray(b.commands) && b.commands.length > 0
        ? b.commands
        : [{ target: '0x0000000000000000000000000000000000000000', selector: '0x00000000', callType: 0 }];
      const newDraft = [...parsedDraft, ...commandsToAppend];
      setParsed(newDraft);
      setDraftText(JSON.stringify(newDraft, null, 2));
    } catch {
      // ignore
    }
  }, [parsed]);

  const handleConfirmSubmit = useCallback(async () => {
    setTxOpen(false);
    const id = createLocalId();
    dispatch(addTx({ id, type: 'setCommands', meta: { poolId, hookPath, cmdCount: parsed?.length ?? 0 } }));
    try {
      const tx = await sendSetCommands(Number(poolId), hookPath!, parsed!);
      const hash = (tx && (tx.hash ?? tx.transactionHash)) ?? null;
      if (hash) {
        dispatch(setTxHash({ id, hash }));
      }
      dispatch(setTxSuccess({ id }));
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      dispatch(setTxFailed({ id, error: msg }));
      setOpError(msg);
    }
  }, [dispatch, parsed, poolId, hookPath, sendSetCommands]);

  const onSubmit = useCallback(() => {
    setOpError(null);
    if (!parsed) { setOpError('No valid commands parsed'); return; }
    if (!poolId) { setOpError('No poolId selected'); return; }
    if (!hookPath) { setOpError('No hookPath selected'); return; }
    if (!signer) { setOpError('No signer available (connect wallet)'); return; }

    const message = `Call setCommands on pool ${poolId}\nhookPath: ${hookPath}\ncommands: ${parsed.length}\n\nThis will create an on-chain transaction. Proceed?`;
    setTxMsg(message);
    setTxOpen(true);
  }, [parsed, poolId, hookPath, signer]);

  // Apply Blocks flow
  const [applyTxOpen, setApplyTxOpen] = useState(false);
  const applyBlocksEstimate = useCallback(async () => {
    if (!poolId) { setOpError('No poolId selected'); return; }
    if (applyList.length === 0) { setOpError('No blocks selected'); return; }
    try {
      const est = await estimateApplyBlocks(Number(poolId), applyList.map(b => b.id));
      setGasEstimate(est ? String(est) : 'n/a');
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }, [applyList, poolId, estimateApplyBlocks]);

  const handleConfirmApplyBlocks = useCallback(async () => {
    setApplyTxOpen(false);
    if (!poolId) { setOpError('No poolId selected'); return; }
    const id = createLocalId();
    dispatch(addTx({ id, type: 'applyBlocks', meta: { poolId, blockCount: applyList.length } }));
    try {
      const tx = await sendApplyBlocks(Number(poolId), applyList.map(b => b.id));
      const hash = (tx && (tx.hash ?? tx.transactionHash)) ?? null;
      if (hash) dispatch(setTxHash({ id, hash }));
      dispatch(setTxSuccess({ id }));
      // clear apply list on success
      setApplyList([]);
    } catch (err: any) {
      dispatch(setTxFailed({ id, error: err?.message ?? String(err) }));
      setOpError(err?.message ?? String(err));
    }
  }, [applyList, poolId, sendApplyBlocks, dispatch]);

  return (
    <div style={{ padding: 12, borderRadius: 8, background: '#071018', border: '1px solid #222', color: '#ddd' }}>
      <h3 style={{ marginTop: 0 }}>Hooks Editor — Pool {String(poolId ?? '')} {hookPath ? `· ${hookPath}` : ''}</h3>

      <div style={{ marginBottom: 8 }}>
        <div style={{ color: '#bbb', marginBottom: 6 }}>Current Commands (read-only)</div>
        <pre style={{ background: '#0b0d10', padding: 8, borderRadius: 6, maxHeight: 160, overflow: 'auto' }}>
          {JSON.stringify(existingCommands ?? [], null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#bbb', marginBottom: 6 }}>Draft Command[] (JSON)</div>
        <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} style={{ width: '100%', minHeight: 140, background: '#071018', color: '#eee', padding: 8, borderRadius: 6, border: '1px solid #222' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button onClick={onEstimate} disabled={!parsed || !poolId || !hookPath} style={{ padding: '0.45em 0.9em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>
            Estimate Gas
          </button>
          <button onClick={onSubmit} disabled={!parsed || !poolId || !hookPath} style={{ padding: '0.45em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>
            Submit setCommands
          </button>
          <div style={{ marginLeft: 'auto', color: '#999' }}>{gasEstimate ? <>Estimated gas: <strong style={{ color: '#fff' }}>{gasEstimate}</strong></> : null}</div>
        </div>
        <div style={{ marginTop: 8 }}>
          {opError && <div style={{ color: '#ff8b8b' }}>Error: {String(opError)}</div>}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <HooksDryRunPanel existingTargetFees={existingFees ?? null} existingLocks={locks ?? null} onValidate={() => { /* noop */ }} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#bbb', marginBottom: 6 }}>Blocks Marketplace</div>
        <BlocksPalette onAddBlock={(b) => addBlockToApplyList(b)} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={() => { applyBlocksEstimate(); setApplyTxOpen(true); }} disabled={!applyList.length} style={{ padding: '0.45em 0.9em', background: '#6a1b9a', color: '#fff', borderRadius: 6 }}>
          Apply Blocks ({applyList.length})
        </button>
        <div style={{ marginLeft: 'auto', color: '#999' }}>{applyList.length > 0 ? `Selected blocks: ${applyList.map(b => b.id).join(',')}` : null}</div>
      </div>

      <TxModal open={txOpen} title="Confirm setCommands" message={txMsg} confirmLabel="Send Transaction" cancelLabel="Cancel" onConfirm={handleConfirmSubmit} onCancel={() => setTxOpen(false)} />
      <TxModal open={applyTxOpen} title="Confirm applyBlocksToPool" message={`Apply blocks: ${applyList.map(b => b.id).join(', ')} to pool ${String(poolId)}`} confirmLabel="Apply Blocks" cancelLabel="Cancel" onConfirm={handleConfirmApplyBlocks} onCancel={() => setApplyTxOpen(false)} />
    </div>
  );
}