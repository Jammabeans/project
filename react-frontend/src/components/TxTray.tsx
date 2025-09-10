import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { getChainSettings } from '../config/chainSettings';

/**
 * TxTray
 * - Small component that lists recent txs from txs slice and links to explorer.
 * - Shows status (pending/success/failed) and short link to explorer if chain known.
 */

export default function TxTray() {
  const txs = useSelector((s: RootState) => s.txs);
  const walletChainId = useSelector((s: RootState) => s.wallet.chainId);
  const chain = getChainSettings(walletChainId ?? 1);
  const explorer = chain?.explorerUrl ?? 'https://etherscan.io';

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, width: 360, maxWidth: '90%', zIndex: 60 }}>
      <div style={{ padding: 8, borderRadius: 8, background: '#071018', border: '1px solid #222', color: '#ddd' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Activity</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {txs.allIds.length === 0 && <div style={{ color: '#777' }}>No recent transactions</div>}
          {txs.allIds.map(id => {
            const tx = txs.byId[id];
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 10, background: tx.status === 'pending' ? '#f0ad4e' : tx.status === 'success' ? '#7ee787' : '#ff8b8b' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9em', color: '#fff' }}>{tx.type ?? 'tx'} <small style={{ color: '#999' }}>#{tx.id.slice(3, 10)}</small></div>
                  <div style={{ fontSize: '0.8em', color: '#bbb' }}>{tx.meta ? JSON.stringify(tx.meta) : ''}</div>
                </div>
                <div>
                  {tx.hash ? <a href={`${explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ color: '#9ad' }}>view</a> : <span style={{ color: '#777' }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}