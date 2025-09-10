import { useCallback, useEffect, useState } from 'react';
import { urqlClient } from '../urqlClient';

export type PoolSwap = {
  sender: string;
  amount0: string;
  amount1: string;
  timestamp: string;
  poolId: string;
};

type Options = {
  first?: number;
  pollIntervalMs?: number | null;
};

/**
 * usePoolSwaps
 * - Fetches recent swaps for a given poolId from the Uniswap V4 subgraph via urqlClient.
 * - Returns swaps[], loading, error, refetch.
 *
 * Note: Subgraph schema may differ; this implementation uses a commonly used "swaps" entity with a "pool" relation.
 * If your subgraph uses a different shape, we'll adapt the query later.
 */
export default function usePoolSwaps(poolId?: string | null, opts?: Options) {
  const first = opts?.first ?? 25;
  const pollInterval = opts?.pollIntervalMs ?? null;

  const [swaps, setSwaps] = useState<PoolSwap[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSwaps = useCallback(async () => {
    if (!poolId) {
      setSwaps([]);
      return;
    }
    setLoading(true);
    setError(null);
    const QUERY = `
      query PoolSwaps($poolId: ID!, $first: Int!) {
        swaps(first: $first, where: { pool: $poolId }, orderBy: timestamp, orderDirection: desc) {
          sender
          amount0
          amount1
          timestamp
          pool { id }
        }
      }
    `;
    try {
      const res = await urqlClient.query(QUERY, { poolId, first }).toPromise();
      if (res.error) {
        setError(res.error.message || 'GraphQL error');
        setSwaps([]);
      } else {
        const raw = res.data?.swaps ?? [];
        const mapped: PoolSwap[] = raw.map((s: any) => ({
          sender: s.sender ?? '',
          amount0: s.amount0 ?? '0',
          amount1: s.amount1 ?? '0',
          timestamp: String(s.timestamp ?? ''),
          poolId: s.pool?.id ?? poolId,
        }));
        setSwaps(mapped);
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setSwaps([]);
    } finally {
      setLoading(false);
    }
  }, [poolId, first]);

  useEffect(() => {
    fetchSwaps();
    if (pollInterval && pollInterval > 0) {
      const t = setInterval(fetchSwaps, pollInterval);
      return () => clearInterval(t);
    }
  }, [fetchSwaps, pollInterval]);

  return { swaps, loading, error, refetch: fetchSwaps } as const;
}