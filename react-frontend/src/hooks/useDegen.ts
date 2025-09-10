import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import type { RootState } from '../store';
import { useSelector } from 'react-redux';

/**
 * useDegen
 * - Fetches basic DegenPool stats and optionally per-user balances.
 * - This is a light-weight hook using ethers static calls. For heavy usage, replace with multicall/RTK Query.
 *
 * Options:
 *  - provider?: BrowserProvider
 *  - poolAddress: address of the DegenPool contract
 *  - pollIntervalMs?: number | null
 *
 * Returned:
 *  - data: { totalPoints, cumulativeRewardPerPoint, userPoints?, pendingRewards? }
 *  - loading, error, refetch
 */

const DEGEN_ABI = [
  'function cumulativeRewardPerPoint() view returns (uint256)',
  'function totalPoints() view returns (uint256)',
  'function points(address) view returns (uint256)',
  'function pendingRewards(address) view returns (uint256)',
];

type Options = {
  provider?: BrowserProvider | null;
  pollIntervalMs?: number | null;
};

export default function useDegen(poolAddress?: string | null, opts?: Options) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is connected, read their address from Redux
  const account = useSelector((s: RootState) => s.wallet.account);
  const provider = opts?.provider ?? ((window as any).ethereum ? new BrowserProvider((window as any).ethereum) : null);
  const pollInterval = opts?.pollIntervalMs ?? null;

  const fetchOne = useCallback(async (addr?: string | null) => {
    if (!addr) return null;
    setLoading(true);
    setError(null);
    try {
      if (!provider) throw new Error('No provider available (connect wallet or pass a provider).');
      const pool = new Contract(addr, DEGEN_ABI, provider);
      const [cumulativeRewardPerPoint, totalPoints] = await Promise.all([
        pool.cumulativeRewardPerPoint(),
        pool.totalPoints(),
      ]);
      const parsed: any = {
        cumulativeRewardPerPoint: cumulativeRewardPerPoint?.toString?.() ?? String(cumulativeRewardPerPoint),
        totalPoints: totalPoints?.toString?.() ?? String(totalPoints),
      };
      if (account) {
        try {
          const [userPoints, pendingRewards] = await Promise.all([
            pool.points(account),
            pool.pendingRewards(account),
          ]);
          parsed.userPoints = userPoints?.toString?.() ?? String(userPoints);
          parsed.pendingRewards = pendingRewards?.toString?.() ?? String(pendingRewards);
        } catch {
          // ignore per-user failures
        }
      }
      setData(parsed);
      return parsed;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, account]);

  const refetch = useCallback(() => fetchOne(poolAddress), [fetchOne, poolAddress]);

  useEffect(() => {
    let timer: any = null;
    if (poolAddress) {
      fetchOne(poolAddress);
      if (pollInterval && pollInterval > 0) {
        timer = setInterval(() => fetchOne(poolAddress), pollInterval);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [poolAddress, fetchOne, pollInterval]);

  return {
    data,
    loading,
    error,
    refetch,
  } as const;
}