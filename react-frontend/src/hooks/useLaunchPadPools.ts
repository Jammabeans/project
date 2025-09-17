import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import useContracts from './useContracts';
import { getChainSettings } from '../config/chainSettings';

const POOL_LAUNCHPAD_ABI = ['function allPools() view returns (bytes32[])'];

/**
 * useLaunchPadPools
 * - Reads all pools created via the on-chain PoolLaunchPad contract (allPools()).
 * - Falls back to chainSettings or resolved addresses from the AccessControl resolver.
 *
 * Returns: { poolIds: string[], loading, error, refetch }
 *
 * Notes:
 * - PoolId is returned as bytes32 in Solidity (PoolId typed wrapper); we return the raw hex string.
 * - Consumers can call usePoolDetails on each id or adapt the display as needed.
 */
export default function useLaunchPadPools(opts?: { provider?: BrowserProvider | null; pollIntervalMs?: number | null }) {
  const provider = opts?.provider ?? ((window as any).ethereum ? new BrowserProvider((window as any).ethereum) : null);
  const pollInterval = opts?.pollIntervalMs ?? null;

  // Resolved addresses from the runtime resolver (resolver -> chainSettings)
  const { resolvedAddresses } = useContracts(provider ?? null);

  const [poolIds, setPoolIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!provider) {
        setPoolIds([]);
        return [];
      }

      // Address resolution order: env -> resolver -> chainSettings
      const launchPadAddress =
        process.env.REACT_APP_POOL_LAUNCHPAD_ADDRESS
        ?? resolvedAddresses?.poolLaunchPad
        ?? getChainSettings(31337)?.poolLaunchPadAddress;

      if (!launchPadAddress) {
        setPoolIds([]);
        return [];
      }

      const c = new Contract(launchPadAddress, POOL_LAUNCHPAD_ABI, provider);
      try {
        const arr: any[] = await c.allPools();
        const mapped = Array.isArray(arr) ? arr.map((x: any) => String(x)) : [];
        setPoolIds(mapped);
        return mapped;
      } catch (e: any) {
        // call might revert or not exist
        setPoolIds([]);
        return [];
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setPoolIds([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [provider, resolvedAddresses]);

  const refetch = useCallback(() => fetchOne(), [fetchOne]);

  useEffect(() => {
    fetchOne();
    if (pollInterval && pollInterval > 0) {
      const t = setInterval(fetchOne, pollInterval);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOne, pollInterval]);

  return { poolIds, loading, error, refetch } as const;
}