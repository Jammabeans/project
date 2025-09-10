import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePools } from '../hooks';
import useShaker from '../hooks/useShaker';

/**
 * LandingParts
 * - Small collection of components used by the Landing page:
 *   - LandingHero
 *   - ShakerWidget
 *   - FeaturedPoolsGrid
 *   - QuickActionsStrip
 *
 * These are lightweight placeholders wired to existing hooks and designed
 * to be iterated on with full styles / interactions later.
 */

/* ---------------- LandingHero ---------------- */
export const LandingHero: React.FC = () => {
  return (
    <section style={{ display: 'block', marginBottom: 28 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.2rem', lineHeight: 1.05, color: '#fff' }}>Bonded Hooks — Composable on-chain behavior</h1>
            <p style={{ color: '#cfd6e3', marginTop: 12, maxWidth: 720 }}>
              Compose, preview, and safely deploy hook-based command sets that route fees, mint points, and integrate with bonding, bidding and on-chain games.
            </p>
            <div style={{ marginTop: 18, display: 'flex', gap: 12', flexWrap: 'wrap' }}>
              <Link to="/launch"><button style={{ padding: '0.6em 1em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>Create a Pool</button></Link>
              <Link to="/pools"><button style={{ padding: '0.6em 1em', background: '#333', color: '#fff', borderRadius: 6 }}>Browse Pools</button></Link>
              <Link to="/hooks-admin"><button style={{ padding: '0.6em 1em', background: '#2e7d32', color: '#fff', borderRadius: 6 }}>Hooks Admin</button></Link>
            </div>
            <div style={{ marginTop: 14, color: '#9ad' }}>
              <small style={{ color: '#bbb' }}>Quick stats: TVL: — · Active Pools: —</small>
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: '#071018', border: '1px solid #1f2428' }}>
            <h3 style={{ marginTop: 0, color: '#fff' }}>Quick Swap Preview</h3>
            <div style={{ color: '#bbb' }}>Preview a swap on a sample pool — open pool detail to execute or simulate trades.</div>
            <div style={{ marginTop: 12 }}>
              <Link to="/pools" style={{ color: '#9ad' }}>Browse Pools →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------------- ShakerWidget ---------------- */
export const ShakerWidget: React.FC = () => {
  const { round, loading, error, shakerAddress } = useShaker(process.env.REACT_APP_SHAKER_ADDRESS ?? null);

  // compute remaining time display
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = round ? Math.max(0, round.deadline - now) : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div style={{ padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Shaker</strong>
        <span style={{ color: '#999' }}>{round ? `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : (loading ? 'loading...' : '--:--')}</span>
      </div>

      {error && <div style={{ color: '#ff8b8b', marginTop: 8 }}>Error: {String(error)}</div>}

      <div style={{ marginTop: 8, color: '#bbb' }}>
        {round ? (
          <>
            Currently shaking: <code style={{ color: '#9ad' }}>{`Pool ${round.poolId}`}</code>
            <div style={{ marginTop: 6 }}>Leader: <span style={{ color: '#fff' }}>{round.leader}</span></div>
            <div style={{ marginTop: 6 }}>Pot: <span style={{ color: '#9ad' }}>{round.pot}</span></div>
            <div style={{ marginTop: 6 }}>Tickets sold: <span style={{ color: '#9ad' }}>{round.ticketCount}</span></div>
          </>
        ) : (
          <div>No active round</div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <Link to={round ? `/pool/${round.poolId}` : '/prizebox'}>
          <button style={{ padding: '0.45em 0.9em', background: '#1976d2', color: '#fff', borderRadius: 6 }}>
            {round ? 'Buy Ticket' : 'View PrizeBoxes'}
          </button>
        </Link>
        <Link to="/prizebox" style={{ marginLeft: 12, color: '#9ad' }}>Open PrizeBox</Link>
      </div>

      <div style={{ marginTop: 8, color: '#777', fontSize: '0.85em' }}>
        {shakerAddress ? <span>Shaker: <code style={{ color: '#9ad' }}>{shakerAddress}</code></span> : 'Shaker not configured'}
      </div>
    </div>
  );
};

/* ---------------- FeaturedPoolsGrid ---------------- */
export const FeaturedPoolsGrid: React.FC = () => {
  const { pools = [], loading } = usePools({ first: 12, pollIntervalMs: null } as any);

  return (
    <section style={{ marginTop: 12 }}>
      <h3 style={{ color: '#fff' }}>Featured Pools</h3>
      {loading && <div style={{ color: '#aaa' }}>Loading pools...</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        {pools.slice(0, 8).map((p: any) => (
          <Link to={`/pool/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#071018', border: '1px solid #23272a', color: '#ddd', transition: 'transform .12s, box-shadow .12s', boxShadow: '0 1px 0 rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: '#fff' }}>{p.token0?.symbol}/{p.token1?.symbol}</div>
                <div style={{ color: '#9ad', fontSize: '0.9em' }}>{p.liquidity ?? '—'}</div>
              </div>
              <div style={{ color: '#bbb', fontSize: '0.85em', marginTop: 6 }}><code style={{ color: '#9ad' }}>{p.id}</code></div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* ---------------- QuickActionsStrip ---------------- */
export const QuickActionsStrip: React.FC = () => (
  <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
    <Link to="/launch"><div style={{ padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' }}>Create a Pool</div></Link>
    <Link to="/bonding"><div style={{ padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' }}>Bond a Hook</div></Link>
    <Link to="/bidding"><div style={{ padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' }}>Place a Bid</div></Link>
    <Link to="/degen"><div style={{ padding: 12, borderRadius: 8, background: '#0f1113', border: '1px solid #222', color: '#ddd' }}>Degen Pool</div></Link>
  </div>
);

export default { LandingHero, ShakerWidget, FeaturedPoolsGrid, QuickActionsStrip };