import React, { useEffect, useState } from 'react';
import { useWallet } from '../hooks';
import useBonding from '../hooks/useBonding';
import useDegen from '../hooks/useDegen';

/**
 * AccountPage
 * - Shows user balances, bonding status, bids placeholder, prize boxes/claims.
 * - Lightweight, uses existing hooks defensively (no provider -> asks user to connect).
 */

const sectionStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: '#0f1113',
  border: '1px solid #222',
  color: '#ddd',
  marginBottom: 12,
};

function BalancesPanel() {
  const { provider, account } = useWallet();
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchBalance() {
      setLoading(true);
      try {
        if (!provider || !account) {
          setEthBalance(null);
          return;
        }
        const bal = await provider.getBalance(account);
        if (!mounted) return;
        setEthBalance(bal?.toString ? bal.toString() : String(bal));
      } catch {
        if (mounted) setEthBalance(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchBalance();
    return () => { mounted = false; };
  }, [provider, account]);

  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Balances</div>
      {!account ? (
        <div style={{ color: '#999' }}>Connect wallet to view balances.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ color: '#bbb', fontSize: '0.9rem' }}>ETH</div>
              <div style={{ fontWeight: 700 }}>{loading ? 'Loading…' : ethBalance ? `${ethBalance} (wei)` : 'n/a'}</div>
            </div>
            <div style={{ color: '#999', fontSize: '0.85rem' }}>
              (ERC20 balances not displayed — integrate token list later)
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BondsPanel() {
  const { account } = useWallet();
  const [target, setTarget] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  const bonding = useBonding(target || null, currency || null, { pollIntervalMs: null });

  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Bonding</div>
      {!account ? (
        <div style={{ color: '#999' }}>Connect wallet to view your bonds.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input placeholder="Target address" value={target} onChange={e => setTarget(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
            <input placeholder="Currency address" value={currency} onChange={e => setCurrency(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
            <button onClick={() => bonding.refetch()} style={{ padding: '0.4em 0.8em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Refresh</button>
          </div>
          {bonding.loading ? <div style={{ color: '#999' }}>Loading bonding data…</div> : (
            bonding.data ? (
              <div style={{ color: '#ddd' }}>
                <div>Bonded Amount: <strong style={{ color: '#fff' }}>{bonding.data.bondedAmount ?? 'n/a'}</strong></div>
                <div>Pending Reward: <strong style={{ color: '#fff' }}>{bonding.data.pendingReward ?? 'n/a'}</strong></div>
                <div>Total Bonded (target/currency): <strong style={{ color: '#fff' }}>{bonding.data.totalBonded ?? 'n/a'}</strong></div>
              </div>
            ) : <div style={{ color: '#999' }}>Enter target & currency above and press Refresh to load bonding info.</div>
          )}
        </>
      )}
    </div>
  );
}

function BidsPanel() {
  const { account } = useWallet();
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Bids</div>
      {!account ? (
        <div style={{ color: '#999' }}>Connect wallet to view bids.</div>
      ) : (
        <div style={{ color: '#999' }}>Bids UI not yet implemented — placeholder.</div>
      )}
    </div>
  );
}

function PrizeBoxesPanel() {
  const { account } = useWallet();
  const [poolAddr, setPoolAddr] = useState('');
  const degen = useDegen(poolAddr || null, { pollIntervalMs: null });

  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Prize Boxes / Shaker</div>
      {!account ? (
        <div style={{ color: '#999' }}>Connect wallet to view prize boxes and claims.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input placeholder="Degen pool address" value={poolAddr} onChange={e => setPoolAddr(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071018', color: '#eee' }} />
            <button onClick={() => degen.refetch()} style={{ padding: '0.4em 0.8em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Refresh</button>
          </div>
          {degen.loading ? <div style={{ color: '#999' }}>Loading degen data…</div> : (
            degen.data ? (
              <div style={{ color: '#ddd' }}>
                <div>Total Points: <strong style={{ color: '#fff' }}>{degen.data.totalPoints ?? 'n/a'}</strong></div>
                <div>Cumulative Reward/Point: <strong style={{ color: '#fff' }}>{degen.data.cumulativeRewardPerPoint ?? 'n/a'}</strong></div>
                <div>Your Points: <strong style={{ color: '#fff' }}>{degen.data.userPoints ?? 'n/a'}</strong></div>
                <div>Pending Rewards: <strong style={{ color: '#fff' }}>{degen.data.pendingRewards ?? 'n/a'}</strong></div>
              </div>
            ) : <div style={{ color: '#999' }}>Enter a degen pool address above and press Refresh to load stats.</div>
          )}
        </>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Account</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, marginTop: 12 }}>
        <div>
          <BalancesPanel />
          <BondsPanel />
          <BidsPanel />
        </div>
        <aside>
          <PrizeBoxesPanel />
        </aside>
      </div>
    </div>
  );
}