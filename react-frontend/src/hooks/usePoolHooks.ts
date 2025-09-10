import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';

/**
 * usePoolHooks
 * Small, defensive hook to read MasterControl-related views for a pool.
 *
 * - getCommands(poolId, hookPath) => Command[] (if available)
 * - poolCommandTargets(poolId) => address[] (if available)
 *
 * This implementation is intentionally conservative: it tolerates missing methods
 * and returns partial data. For production, add ABI/type generation and multicall batching.
 */

const MASTERC_CONTROL_ABI = [
  // Expected public views on MasterControl (may differ by deployment)
  'function getCommands(uint256 poolId, bytes32 hookPath) view returns (tuple(address target, bytes4 selector, uint8 callType, uint32 feeBips, uint256 provenanceBlockId)[])',
  'function poolCommandTargets(uint256 poolId) view returns (address[])',
  // Optional helper to check per-command lock for a pool/hookPath/target/selector
  'function commandLockedForPool(uint256 poolId, bytes32 hookPath, address target, bytes4 selector) view returns (bool)',
];

type Options = {
  provider?: BrowserProvider | null;
  pollIntervalMs?: number | null;
};

export default function usePoolHooks(poolId?: number | string | null, hookPath?: string | null, opts?: Options) {
  const [commands, setCommands] = useState<any[] | null>(null);
  const [targets, setTargets] = useState<string[] | null>(null);
  const [locks, setLocks] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only use an explicitly provided provider. Do NOT auto-create a BrowserProvider from
  // window.ethereum to avoid repeated re-creation which causes effects to re-run in a loop.
  // Callers should pass a provider via opts if they want on-chain reads.
  const provider = opts?.provider ?? null;
  const pollInterval = opts?.pollIntervalMs ?? null;

  const fetchOne = useCallback(async (pId?: number | string | null, hp?: string | null) => {
    if (!pId) return null;
    setLoading(true);
    setError(null);

    try {
      // If no provider was supplied, skip on-chain reads gracefully rather than throwing.
      // The UI will remain usable in read-only/dry-run mode without a connected wallet.
      if (!provider) {
        setCommands(null);
        setTargets(null);
        return null;
      }

      // MasterControl address should be set in env for on-chain reads
      const masterControlAddress = process.env.REACT_APP_MASTER_CONTROL_ADDRESS;
      if (!masterControlAddress) {
        // If masterControlAddress not set, don't throw — return null and keep UI stable.
        setCommands(null);
        setTargets(null);
        return null;
      }

      const mc = new Contract(masterControlAddress, MASTERC_CONTROL_ABI, provider);

      // Normalize hookPath into bytes32 if provided
      let hpBytes: string | null = null;
      if (hp) {
        // If already a 32-byte hex string, use it; otherwise attempt utf8->hex pad (best-effort)
        if (hp.startsWith('0x') && hp.length === 66) {
          hpBytes = hp;
        } else {
          const enc = Buffer.from(hp, 'utf8');
          hpBytes = '0x' + enc.toString('hex').padEnd(64, '0');
        }
      }

      // Fetch commands
      let cmds: any[] | null = null;
      if (hpBytes) {
        try {
          const raw = await mc.getCommands(Number(pId), hpBytes);
          cmds = (raw as any[]).map((c: any) => ({
            target: String(c.target),
            selector: c.selector,
            callType: Number(c.callType),
            feeBips: Number(c.feeBips),
            provenanceBlockId: c.provenanceBlockId?.toString?.() ?? String(c.provenanceBlockId),
            // placeholders to be enriched below
            originBlock: null,
            originImmutable: false,
          }));
          // Try to enrich commands with origin provenance and immutability where available
          for (let i = 0; i < cmds.length; i++) {
            const cmd = cmds[i];
            try {
              // commandOriginBlock(poolId, hookPath, target, selector)
              if (mc.commandOriginBlock) {
                const origin = await mc.commandOriginBlock(Number(pId), hpBytes, cmd.target, cmd.selector);
                cmd.originBlock = origin?.toString?.() ?? String(origin);
              }
            } catch {
              // ignore if missing
              cmd.originBlock = cmd.provenanceBlockId ?? null;
            }
            try {
              // blockImmutable(uint256) -> bool (optional helper)
              if (cmd.originBlock && mc.blockImmutable) {
                const originNum = Number(cmd.originBlock);
                const imm = await mc.blockImmutable(originNum);
                cmd.originImmutable = !!imm;
              }
            } catch {
              cmd.originImmutable = false;
            }
          }
          setCommands(cmds);
        } catch (e: any) {
          // method not present or call failed — keep commands null
          setCommands(null);
        }
      } else {
        setCommands(null);
      }

      // Fetch targets
      try {
        const t = await mc.poolCommandTargets(Number(pId));
        setTargets(Array.isArray(t) ? t.map((a: any) => String(a)) : null);
      } catch {
        setTargets(null);
      }

      return { commands: cmds, targets };
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setCommands(null);
      setTargets(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const refetch = useCallback(() => fetchOne(poolId, hookPath), [fetchOne, poolId, hookPath]);

  useEffect(() => {
    let timer: any = null;
    if (poolId) {
      fetchOne(poolId, hookPath);
      if (pollInterval && pollInterval > 0) {
        timer = setInterval(() => fetchOne(poolId, hookPath), pollInterval);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [poolId, hookPath, fetchOne, pollInterval]);

  return {
    commands,
    targets,
    locks,
    loading,
    error,
    refetch,
  } as const;
}