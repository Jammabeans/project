import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider } from 'ethers';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setAccount, setChainId } from '../store';

/**
 * useWallet
 * - Connects to injected provider (e.g. MetaMask) via ethers BrowserProvider
 * - Keeps Redux wallet slice (account, chainId) in sync
 * - Provides connect / disconnect and convenience helpers
 */

export function useWallet() {
  const dispatch = useDispatch();
  const account = useSelector((s: RootState) => s.wallet.account);
  const chainId = useSelector((s: RootState) => s.wallet.chainId);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const connect = useCallback(async () => {
    setProvider(null);
    if (!(window as any).ethereum) {
      throw new Error('No injected wallet found (MetaMask / compatible wallet required).');
    }
    const p = new BrowserProvider((window as any).ethereum);
    setProvider(p);
    // Request accounts
    const accounts: string[] = await p.send('eth_requestAccounts', []);
    if (accounts && accounts.length > 0) {
      dispatch(setAccount(accounts[0]));
    } else {
      dispatch(setAccount(null));
    }
    // Read chain id
    let cid: number | null = null;
    try {
      if ((window as any).ethereum?.chainId) {
        cid = parseInt((window as any).ethereum.chainId, 16);
      } else if ((window as any).ethereum?.request) {
        const hex = await (window as any).ethereum.request({ method: 'eth_chainId' });
        cid = parseInt(hex, 16);
      }
    } catch (err) {
      // ignore
    }
    dispatch(setChainId(cid));
    return { provider: p, account: accounts?.[0] ?? null, chainId: cid };
  }, [dispatch]);

  const disconnect = useCallback(() => {
    setProvider(null);
    dispatch(setAccount(null));
    dispatch(setChainId(null));
  }, [dispatch]);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth || !eth.on) return;

    const handleAccountsChanged = (accounts: string[] | string) => {
      const a = Array.isArray(accounts) ? accounts : [accounts];
      if (a.length === 0) {
        dispatch(setAccount(null));
      } else {
        dispatch(setAccount(a[0]));
      }
    };
    const handleChainChanged = (hexChainId: string) => {
      try {
        const parsed = parseInt(hexChainId, 16);
        dispatch(setChainId(parsed));
      } catch (err) {
        dispatch(setChainId(null));
      }
    };

    eth.on && eth.on('accountsChanged', handleAccountsChanged);
    eth.on && eth.on('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener && eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener && eth.removeListener('chainChanged', handleChainChanged);
    };
  }, [dispatch]);

  const getSigner = useCallback(() => {
    if (!provider) return null;
    try {
      return provider.getSigner();
    } catch {
      return null;
    }
  }, [provider]);

  return {
    connect,
    disconnect,
    provider,
    signer: getSigner(),
    account,
    chainId,
    isConnected: !!account,
  } as const;
}

export default useWallet;