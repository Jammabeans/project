import React from 'react';
import PoolHooksPanel from './PoolHooksPanel';

/**
 * PoolAdmin
 * Simple admin page scaffold that mounts the read-only Hooks Admin panel.
 * Later we will expand this to include PoolOverview, AdminIdentity, SettingsPanel, etc.
 *
 * Usage: route to /pool/:id/admin and render this component (or embed in existing admin layout).
 */

const container: React.CSSProperties = {
  padding: 24,
  background: '#0f1115',
  minHeight: '100vh',
  color: '#fff',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 18,
};

const PoolAdmin: React.FC = () => {
  return (
    <div style={container}>
      <div style={header}>
        <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Pool Admin</h1>
        <div style={{ color: '#aaa', fontSize: '0.95rem' }}>
          Admin tools (read-only Hooks preview included)
        </div>
      </div>

      <div>
        <PoolHooksPanel />
      </div>
    </div>
  );
};

export default PoolAdmin;