import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';

/**
 * useCommandFees
 * Attempts to read COMMAND_FEE_BIPS() from a list of contract targets (staticcall).
 * Returns a mapping { [address]: number | null } where null indicates read failure.
 *
 * Note: Not all targets expose COMMAND_FEE_BIPS; this hook is defensive.
 */

type Options = {
  provider?: BrowserProvider | null;
  pollIntervalMs?: number | null;
};

const FEE_ABI = ['function COMMAND_FEE_BIPS() view returns (uint256)'];

export default function useCommandFees(targets?: string[] | null, opts?: Options) {
  const [fees, setFees] = useState<Record<string, number | null> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only use an explicitly provided provider. Do NOT auto-create a BrowserProvider from
  // window.ethereum here to avoid prompting/triggering reads before the user connects.
  const provider = useMemo(() => opts?.provider ?? null, [opts?.provider]);
  const pollInterval = opts?.pollIntervalMs ?? null;

  const fetchFees = useCallback(async () => {
    if (!targets || targets.length === 0) {
      setFees(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!provider) throw new Error('No provider available (connect wallet or pass provider).');
      const out: Record<string, number | null> = {};
      await Promise.all(
        targets.map(async (t) => {
          try {
            const c = new Contract(t, FEE_ABI, provider);
            const res = await c.COMMAND_FEE_BIPS();
            out[t] = Number(res ?? 0);
          } catch {
            out[t] = null;
          }
        })
      );
      setFees(out);
      return out;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setFees(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [targets, provider]);

  useEffect(() => {
    let timer: any = null;
    // Only attempt to fetch if we have targets and a provider available.
    if (targets && targets.length > 0 && provider) {
      // initial fetch
      fetchFees();
      // optional polling (disabled by default)
      if (pollInterval && pollInterval > 0) {
        timer = setInterval(fetchFees, pollInterval);
      }
    } else {
      // ensure we don't repeatedly throw errors when no provider is present:
      setFees(null);
      setLoading(false);
      setError(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [targets, fetchFees, pollInterval, provider]);

  return { fees, loading, error, refetch: fetchFees } as const;
}