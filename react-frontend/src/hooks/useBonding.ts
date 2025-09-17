import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import useContracts from './useContracts';
import { getChainSettings } from '../config/chainSettings';

/**
 * useBonding
 * Lightweight hook to read bonding-related values for a target and currency.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useBonding(targetAddress, currencyAddress, { pollIntervalMs: 15000 });
 *
 * Returned data:
 *   {
 *     bondedAmount: string,      // user's bonded amount (if account connected)
 *     pendingReward: string,     // user's pending reward for (target, currency)
 *     totalBonded: string,       // total bonded to target for currency (if view available)
 *   }
 *
 * Notes:
 * - This is defensive: contract methods may differ across deployments. Failures to read optional getters are tolerated.
 * - For production use multicall/RTK Query for batching and caching.
 */

const BONDING_ABI = [
  // Commonly used views (names taken from design doc); some may be named differently on-chain.
  'function bondedAmount(address target, address user, address currency) view returns (uint256)',
  'function pendingReward(address target, address user, address currency) view returns (uint256)',
  // optional helper: totalBonded(target, currency) - not guaranteed to exist in all contracts
  'function totalBonded(address target, address currency) view returns (uint256)',
];

type Options = {
  provider?: BrowserProvider | null;
  pollIntervalMs?: number | null;
};

export default function useBonding(target?: string | null, currency?: string | null, opts?: Options) {
  const account = useSelector((s: RootState) => s.wallet.account);
  const provider = opts?.provider ?? ((window as any).ethereum ? new BrowserProvider((window as any).ethereum) : null);
  const pollInterval = opts?.pollIntervalMs ?? null;
  // Read resolved addresses at top-level so React Hooks rules are satisfied
  const { resolvedAddresses } = useContracts(provider ?? null);

  const [data, setData] = useState<{ bondedAmount?: string; pendingReward?: string; totalBonded?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async (t?: string | null, c?: string | null) => {
    // allow using an explicit target (t) or fall back to configured bonding address
    const bondingAddr = t ?? process.env.REACT_APP_BONDING_ADDRESS ?? resolvedAddresses?.bondingAddress ?? getChainSettings(31337)?.bondingAddress;
    if (!bondingAddr) return null;
  
    setLoading(true);
    setError(null);
    try {
      if (!provider) throw new Error('No provider available (connect wallet or pass provider).');
      const bonding = new Contract(bondingAddr, BONDING_ABI, provider);
  
      const out: any = {};
  
      // totalBonded (optional)
      try {
        if (c) {
          const tb = await bonding.totalBonded(bondingAddr, c);
          out.totalBonded = tb?.toString?.() ?? String(tb);
        }
      } catch {
        // ignore if not present
      }
  
      if (account && c) {
        try {
          const [bondedAmt, pending] = await Promise.all([
            bonding.bondedAmount(bondingAddr, account, c),
            bonding.pendingReward(bondingAddr, account, c),
          ]);
          out.bondedAmount = bondedAmt?.toString?.() ?? String(bondedAmt);
          out.pendingReward = pending?.toString?.() ?? String(pending);
        } catch {
          // ignore per-user failures
        }
      }
  
      setData(out);
      return out;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, account]);

  const refetch = useCallback(() => fetchOne(target, currency), [fetchOne, target, currency]);

  useEffect(() => {
    let timer: any = null;
    if (target) {
      fetchOne(target, currency);
      if (pollInterval && pollInterval > 0) {
        timer = setInterval(() => fetchOne(target, currency), pollInterval);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [target, currency, fetchOne, pollInterval]);

  return {
    data,
    loading,
    error,
    refetch,
  } as const;
}