import React, { useMemo, useState } from 'react';
import { useWallet, usePools } from '../hooks';
import useDegen from '../hooks/useDegen';
import TxModal from './TxModal';

/**
 * DegenPage
 * - Leaderboard and join/claim flows for a Degen pool.
 * - Uses useDegen to fetch pool stats and per-user points/pending rewards.
 *
 * This is UI-first; join/claim actions are simulated and can be wired to on-chain
 * calls later (using txs slice + contract helpers).
 */

const container: React.CSSProperties = { padding: 20 };
const panel: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd', marginBottom: 12 };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 };

export default function DegenPage() {
  const { account, signer } = useWallet();
  const { pools } = usePools({ first: 12 });
  const poolOptions = useMemo(() => pools.map(p => ({ id: p.id, label: `${p.token0.symbol}/${p.token1.symbol}` })), [pools]);

  const [poolAddress, setPoolAddress] = useState<string>(poolOptions[0]?.id ?? '');
  const degen = useDegen(poolAddress || null, { pollIntervalMs: null });

  const [joinAmount, setJoinAmount] = useState<string>('');
  const [txOpen, setTxOpen] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const validationJoin = useMemo(() => {
    const errs: string[] = [];
    if (!poolAddress) errs.push('Select a degen pool to join.');
    if (!joinAmount || isNaN(Number(joinAmount)) || Number(joinAmount) <= 0) errs.push('Join amount must be a positive number.');
    if (!account) errs.push('Connect wallet to join.');
    return errs;
  }, [poolAddress, joinAmount, account]);

  function onAttemptJoin() {
    setOpError(null);
    if (validationJoin.length > 0) {
      setOpError(validationJoin.join(' '));
      return;
    }
    if (!signer) {
      setOpError('Connect a wallet (signer required) to join.');
      return;
    }
    setTxOpen(true);
  }

  async function handleConfirmJoin() {
    setTxOpen(false);
    try {
      // Simulate tx
      await new Promise((res) => setTimeout(res, 800));
      setConfirmed(true);
      // trigger refetch if hook exposes refetch; useDegen returns refetch
      degen.refetch();
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }

  async function handleConfirmClaim() {
    setClaimOpen(false);
    try {
      await new Promise((res) => setTimeout(res, 700));
      setClaimed(true);
      degen.refetch();
    } catch (err: any) {
      setOpError(err?.message ?? String(err));
    }
  }

  return (
    <div style={container}>
      <h1>Degen Pool — Leaderboard & Claims</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 12 }}>
        <div>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Select Pool</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={poolAddress} onChange={e => setPoolAddress(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }}>
                <option value="">-- select pool --</option>
                {poolOptions.map(p => <option key={p.id} value={p.id}>{p.label} ({p.id.slice(0,8)})</option>)}
              </select>
              <button onClick={() => degen.refetch()} style={{ padding: '0.4em 0.8em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Refresh</button>
            </div>
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Pool Stats</div>
            {!poolAddress ? (
              <div style={{ color: '#999' }}>Select a pool to view leaderboard & stats.</div>
            ) : degen.loading ? (
              <div style={{ color: '#999' }}>Loading degen data…</div>
            ) : degen.data ? (
              <div style={{ color: '#ddd' }}>
                <div>Total Points: <strong style={{ color: '#fff' }}>{degen.data.totalPoints ?? 'n/a'}</strong></div>
                <div>Cumulative Reward/Point: <strong style={{ color: '#fff' }}>{degen.data.cumulativeRewardPerPoint ?? 'n/a'}</strong></div>
                <div>Your Points: <strong style={{ color: '#fff' }}>{degen.data.userPoints ?? 'n/a'}</strong></div>
                <div>Pending Rewards: <strong style={{ color: '#fff' }}>{degen.data.pendingRewards ?? 'n/a'}</strong></div>
              </div>
            ) : (
              <div style={{ color: '#999' }}>No degen data available for this pool.</div>
            )}
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Join Pool (simulate)</div>
            <div style={row}>
              <input value={joinAmount} onChange={e => setJoinAmount(e.target.value)} placeholder="Points to join (numeric)" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onAttemptJoin} style={{ padding: '0.45em 0.9em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>Join</button>
                <button onClick={() => { setJoinAmount(''); setOpError(null); setConfirmed(false); }} style={{ padding: '0.35em 0.6em', background: '#333', color: '#fff', borderRadius: 6 }}>Reset</button>
              </div>
            </div>
            {opError && <div style={{ color: '#ff8b8b', marginTop: 8 }}>Error: {opError}</div>}
            {confirmed && <div style={{ color: '#9ad', marginTop: 8 }}>Join simulated — points added (UI only).</div>}
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Leaderboard (simulated)</div>
            {/* Placeholder leaderboard — in a real implementation this would come from subgraph or contract */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#bbb' }}>
                <div># Rank</div><div>Account</div><div>Points</div>
              </div>
              <div style={{ padding: 8, borderRadius: 6, background: '#071018', border: '1px solid #101214' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>1</div><div style={{ color: '#fff' }}>{(account ?? '0xabc...').slice(0,12)}</div><div style={{ color: '#fff' }}>{degen.data?.totalPoints ? Math.max(1, Math.floor(Number(degen.data.totalPoints) / 10)) : '—'}</div>
                </div>
              </div>
              <div style={{ padding: 8, borderRadius: 6, background: '#071018', border: '1px solid #101214' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>2</div><div style={{ color: '#9ad' }}>0xfeed...abcd</div><div style={{ color: '#fff' }}>120</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside>
          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Claim Rewards</div>
            <div style={{ color: '#bbb', marginBottom: 8 }}>If you have pending rewards, claim them here (simulated).</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setClaimOpen(true)} disabled={!degen.data?.pendingRewards || Number(degen.data.pendingRewards) <= 0} style={{ padding: '0.4em 0.8em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>
                Claim Rewards
              </button>
              <button onClick={() => { setClaimed(false); setOpError(null); }} style={{ padding: '0.4em 0.8em', background: '#333', color: '#fff', borderRadius: 6 }}>Reset</button>
            </div>
            {claimed && <div style={{ color: '#9ad', marginTop: 8 }}>Claim simulated — rewards moved to your account (UI only).</div>}
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>About Degen Pools</div>
            <div style={{ color: '#bbb' }}>
              Degen pools track user points and distribute rewards. This page is a scaffold — real join/claim actions require on-chain contract calls and proper token approvals.
            </div>
          </div>
        </aside>
      </div>

      <TxModal
        open={txOpen}
        title="Confirm Join"
        message={`Join pool ${poolAddress} with amount ${joinAmount}`}
        confirmLabel="Confirm Join"
        cancelLabel="Cancel"
        onConfirm={handleConfirmJoin}
        onCancel={() => setTxOpen(false)}
      />

      <TxModal
        open={claimOpen}
        title="Confirm Claim"
        message={`Claim pending rewards from pool ${poolAddress}`}
        confirmLabel="Claim Rewards"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClaim}
        onCancel={() => setClaimOpen(false)}
      />
    </div>
  );
}