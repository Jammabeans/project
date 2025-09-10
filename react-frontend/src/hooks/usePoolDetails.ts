import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';

/**
 * usePoolDetails
 * Read-once / polling hook that fetches on-chain pool information by address.
 *
 * It performs safe staticcalls for common getters: token0(), token1(), fee(), liquidity(), slot0()
 * and also attempts to fetch token symbols for convenience. This is intentionally defensive:
 * contracts may vary; failures for individual calls are tolerated and returned in the `error` field.
 *
 * Usage:
 *   const { data, loading, error, refetch } = usePoolDetails(poolAddress, { provider, pollIntervalMs: 15000 })
 *
 * Notes:
 * - For production we should use typed ABIs and multicall batching.
 * - This is a pragmatic implementation to bootstrap the frontend.
 */

type PoolDetails = {
  address: string;
  token0?: { address: string; symbol?: string; decimals?: number };
  token1?: { address: string; symbol?: string; decimals?: number };
  fee?: number | string;
  liquidity?: string;
  slot0?: { sqrtPriceX96?: string; tick?: number } | null;
  raw?: any;
};

type Options = {
  provider?: BrowserProvider | null;
  pollIntervalMs?: number | null;
};

const POOL_ABI = [
  // minimal pool getters - many pools expose these
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
  'function liquidity() view returns (uint128)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

export default function usePoolDetails(poolAddress?: string | null, opts?: Options) {
  const [data, setData] = useState<PoolDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const provider = opts?.provider ?? ((window as any).ethereum ? new BrowserProvider((window as any).ethereum) : null);
  const pollInterval = opts?.pollIntervalMs ?? null;

  const fetchOne = useCallback(async (addr?: string | null) => {
    if (!addr) return null;
    setLoading(true);
    setError(null);
    try {
      if (!provider) throw new Error('No provider available (connect wallet or pass a provider).');
      const pool = new Contract(addr, POOL_ABI, provider);

      // Attempt calls in parallel, but tolerate missing methods via try/catch per call
      const results: any = { address: addr };

      // token0
      try {
        const t0 = await pool.token0();
        results.token0 = { address: String(t0) };
      } catch (e) {
        // ignore
      }

      // token1
      try {
        const t1 = await pool.token1();
        results.token1 = { address: String(t1) };
      } catch (e) {
        // ignore
      }

      // fee
      try {
        const f = await pool.fee();
        results.fee = Number(f);
      } catch (e) {
        // ignore
      }

      // liquidity
      try {
        const l = await pool.liquidity();
        results.liquidity = l?.toString?.() ?? String(l);
      } catch (e) {
        // ignore
      }

      // slot0
      try {
        const s0 = await pool.slot0();
        if (s0) {
          results.slot0 = {
            sqrtPriceX96: s0[0]?.toString?.(),
            tick: Number(s0[1]),
          };
        }
      } catch (e) {
        // ignore
      }

      // Try to fetch token metadata for token0/token1 if available
      const enrichToken = async (t: { address: string } | undefined) => {
        if (!t || !provider) return t;
        try {
          const token = new Contract(t.address, ERC20_ABI, provider);
          const [symbol, decimals] = await Promise.allSettled([token.symbol(), token.decimals()]);
          return {
            address: t.address,
            symbol: symbol.status === 'fulfilled' ? String(symbol.value) : undefined,
            decimals: decimals.status === 'fulfilled' ? Number(decimals.value) : undefined,
          };
        } catch {
          return t;
        }
      };

      results.token0 = await enrichToken(results.token0);
      results.token1 = await enrichToken(results.token1);

      results.raw = results.raw ?? null;
      setData(results as PoolDetails);
      return results as PoolDetails;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const refetch = useCallback(() => fetchOne(poolAddress), [fetchOne, poolAddress]);

  useEffect(() => {
    let timer: any = null;
    if (poolAddress) {
      // initial fetch
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