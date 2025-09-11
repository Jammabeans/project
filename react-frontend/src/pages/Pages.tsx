import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PoolOverview from '../components/PoolOverview';
import LandingParts from '../components/LandingParts';
import HooksEditor from '../components/HooksEditor';
import AccountPage from '../components/AccountPage';
import LaunchComponent from '../components/LaunchPage';
import BondingComponent from '../components/BondingPage';

/**
 * Centralized page skeletons to bootstrap routing quickly.
 * Each page is a minimal placeholder to be expanded per design docs.
 */

export const LandingPage: React.FC = () => (
  <div style={{ padding: 20 }}>
    <LandingParts.LandingHero />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      <div>
        <LandingParts.FeaturedPoolsGrid />
        <LandingParts.QuickActionsStrip />
      </div>
      <aside>
        <LandingParts.ShakerWidget />
      </aside>
    </div>
  </div>
);

import PoolsList from '../components/PoolsList';

export const PoolsPage: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h1>Pools</h1>
    <PoolsList />
  </div>
);

export const PoolDetailPage: React.FC = () => {
  const params = useParams();
  const id = params?.id ?? null;
  return (
    <div style={{ padding: 20 }}>
      <h1>Pool Detail</h1>
      <p>PoolHeader, PriceChart, TradeWidget, HooksPanel (placeholder)</p>
      <div style={{ marginTop: 12 }}>
        <PoolOverview initialPoolAddress={id} />
      </div>
    </div>
  );
};

export const PoolAdminPage: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h1>Pool Admin</h1>
    <p>AdminIdentity, SettingsPanel, Hooks editor entry (placeholder)</p>
  </div>
);

export const HooksAdminPage: React.FC = () => {
  // Simple entry: allow admins to edit a pool's hooks. In future, detect poolId/hookPath from route or UI.
  return (
    <div style={{ padding: 20 }}>
      <h1>Hooks Admin</h1>
      <p style={{ color: '#bbb' }}>Read-only preview and editor for pool hooks (dry-run + submit).</p>
      <div style={{ marginTop: 12 }}>
        <HooksEditor poolId={null} hookPath={null} />
      </div>
    </div>
  );
};

/* Account page implemented in components/AccountPage.tsx */

export const BondingPage: React.FC = BondingComponent;

export const BiddingPage: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h1>Bidding</h1>
    <p>Bid UI and epoch flows (placeholder)</p>
  </div>
);

export const DegenPage: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h1>Degen Pool</h1>
    <p>Leaderboard, join/claim flows (placeholder)</p>
  </div>
);

export const LaunchPage: React.FC = LaunchComponent;

export const PrizeBoxPage: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h1>PrizeBox / Shaker</h1>
    <p>Prize boxes and shaker interactions (placeholder)</p>
  </div>
);

export const GasRebatePage: React.FC = () => (
  <div style={{ padding: 20 }}>
    <h1>Gas Rebate</h1>
    <p>Gas rebate overview and withdraws (placeholder)</p>
  </div>
);

export default {
  LandingPage,
  PoolsPage,
  PoolDetailPage,
  PoolAdminPage,
  HooksAdminPage,
  AccountPage,
  BondingPage,
  BiddingPage,
  DegenPage,
  LaunchPage,
  PrizeBoxPage,
  GasRebatePage,
};