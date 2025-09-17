import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useWallet } from './hooks';
import Pages from './pages/Pages';
import PoolAdmin from './components/PoolAdmin';
import PoolHooksPanel from './components/PoolHooksPanel';
import PoolDetailsTest from './components/PoolDetailsTest';
import TxTray from './components/TxTray';
import ResolverTest from './pages/ResolverTest';

/**
 * Simplified App shell wired with react-router routes.
 * - Provides page-level routes for the skeleton pages created in
 *   [`react-frontend/src/pages/Pages.tsx`](react-frontend/src/pages/Pages.tsx:1).
 * - Keeps header + wallet connect in place and delegates to page components.
 *
 * Later: we can re-introduce the DnD editor UI as a dedicated route (e.g., /editor)
 * or keep it behind a feature flag for developers.
 */

function App(): JSX.Element {
  const { connect, disconnect, account } = useWallet();

  return (
    <BrowserRouter>
      <div style={{ background: '#071018', minHeight: '100vh', color: '#e6eef8' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #222', background: '#0b0d10' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1976d2' }} />
            <strong style={{ color: '#fff', fontSize: '1.1rem' }}>Bonded Hooks</strong>
          </div>

          <nav style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
            <Link to="/" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Landing</Link>
            <Link to="/pools" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Pools</Link>
            <Link to="/launch" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Launch</Link>
            <Link to="/bonding" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Bonding</Link>
            <Link to="/bidding" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Bidding</Link>
            <Link to="/degen" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Degen</Link>
            <Link to="/hooks-admin" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Hooks Admin</Link>
            <Link to="/pool-admin" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Pool Admin</Link>
            <Link to="/account" style={{ color: '#cfd6e3', textDecoration: 'none' }}>Account</Link>
            <Link to="/resolver-test" style={{ color: '#f2b90b', textDecoration: 'underline' }}>Resolver Test</Link>
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            {account ? (
              <>
                <div style={{ color: '#ddd', fontSize: '0.9rem', wordBreak: 'break-all', maxWidth: 320 }}>{account}</div>
                <button onClick={() => disconnect()} style={{ padding: '0.45em 0.8em' }}>Logout</button>
              </>
            ) : (
              <button onClick={() => connect()} style={{ padding: '0.45em 0.8em' }}>Connect Wallet</button>
            )}
          </div>
          <TxTray />
        </header>

        <main style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<Pages.LandingPage />} />
            <Route path="/pools" element={<Pages.PoolsPage />} />
            <Route path="/pool/:id" element={<Pages.PoolDetailPage />} />
            <Route path="/pool-admin" element={<PoolAdmin />} />
            <Route path="/hooks-admin" element={<Pages.HooksAdminPage />} />
            <Route path="/account" element={<Pages.AccountPage />} />
            <Route path="/bonding" element={<Pages.BondingPage />} />
            <Route path="/bidding" element={<Pages.BiddingPage />} />
            <Route path="/degen" element={<Pages.DegenPage />} />
            <Route path="/launch" element={<Pages.LaunchPage />} />
            <Route path="/prizebox" element={<Pages.PrizeBoxPage />} />
            <Route path="/gas-rebate" element={<Pages.GasRebatePage />} />

            {/* Development/testing routes */}
            <Route path="/dev/pool-hooks" element={<PoolHooksPanel />} />
            <Route path="/dev/pool-details-test" element={<PoolDetailsTest />} />
            <Route path="/resolver-test" element={<ResolverTest />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
