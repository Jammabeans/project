import { useCallback, useEffect, useState } from 'react';
import { urqlClient } from '../urqlClient';
import type { PoolInfo } from '../store';

/**
 * usePools
 * - Fetches a list of pools from the configured Uniswap V4 subgraph (using urqlClient)
 * - Returns pools, loading, error, and a refetch function
 *
 * Keep this simple and read-only; callers can opt to replace with RTK Query or urql hooks later.
 */

type UsePoolsOptions = {
  first?: number;
  pollIntervalMs?: number | null;
};

export function usePools(opts?: UsePoolsOptions) {
  const first = opts?.first ?? 20;
  const pollInterval = opts?.pollIntervalMs ?? null;

  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    const QUERY = `
      query Pools($first: Int!) {
        pools(first: $first, orderBy: liquidity, orderDirection: desc) {
          id
          feeTier
          liquidity
          token0 { id symbol }
          token1 { id symbol }
        }
      }
    `;
    try {
      const result = await urqlClient.query(QUERY, { first }).toPromise();
      if (result.error) {
        setError(result.error.message || 'GraphQL error');
        setPools([]);
      } else {
        const raw = result.data?.pools ?? [];
        const mapped: PoolInfo[] = raw.map((r: any) => ({
          id: r.id,
          feeTier: Number(r.feeTier ?? r.fee ?? 0),
          liquidity: String(r.liquidity ?? '0'),
          token0: { id: r.token0?.id ?? '', symbol: r.token0?.symbol ?? '' },
          token1: { id: r.token1?.id ?? '', symbol: r.token1?.symbol ?? '' },
        }));
        setPools(mapped);
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, [first]);

  useEffect(() => {
    fetchPools();
    if (pollInterval && pollInterval > 0) {
      const t = setInterval(fetchPools, pollInterval);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPools, pollInterval]);

  return {
    pools,
    loading,
    error,
    refetch: fetchPools,
  } as const;
}

export default usePools;