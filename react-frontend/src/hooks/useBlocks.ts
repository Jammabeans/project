import { useCallback, useEffect, useState } from 'react';
import { Contract } from 'ethers';
import useWallet from './useWallet';
import { MASTER_CONTROL_ADMIN_ABI } from '../contracts/masterControl';
import { getChainSettings } from '../config/chainSettings';

/**
 * useBlocks
 * Lightweight hook to fetch block metadata (whitelisted blocks) from MasterControl.
 * Falls back to a small mocked list if the MasterControl view is not available.
 *
 * Returns:
 * - loading, error
 * - blocks: array of { id, representativeHook, enabled, immutable, description }
 * - refetch(): re-run the listing
 * - fetchBlockCommands(blockId): best-effort fetch of block.commands array (or null if unavailable)
 *
 * Notes:
 * - MasterControl in this repo does not expose a single getBlockMeta view; this hook
 *   attempts best-effort reads and otherwise returns a small mock set so the admin UI
 *   can be developed without full on-chain helpers.
 */

export type BlockMeta = {
  id: number;
  representativeHook: string;
  enabled: boolean;
  immutable: boolean;
  description?: string;
};

export type BlockDetail = BlockMeta & {
  commands?: any[] | null;
};

const MOCK_BLOCKS: BlockMeta[] = [
  { id: 101, representativeHook: 'beforeSwap', enabled: true, immutable: false, description: 'Mint points block' },
  { id: 102, representativeHook: 'afterSwap', enabled: true, immutable: true, description: 'Fee routing (immutable)' },
  { id: 103, representativeHook: 'beforeMint', enabled: true, immutable: false, description: 'Airdrop helper' },
];

export default function useBlocks(masterControlAddress?: string | null) {
  const { provider } = useWallet();
  const [blocks, setBlocks] = useState<BlockMeta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const addr = masterControlAddress ?? process.env.REACT_APP_MASTER_CONTROL_ADDRESS ?? null;
      if (!provider || !addr) {
        // no provider or address -> return mock list
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      const c = new Contract(addr, MASTER_CONTROL_ADMIN_ABI, provider);
      // Best-effort: try to read a public blocks count / iterate a small range if helpers exist.
      // Many MasterControl deployments do not expose consolidated block metadata view; fallback to mock.
      if (typeof (c as any).getBlockCount === 'function') {
        try {
          const count = await (c as any).getBlockCount();
          const n = Number(count?.toString?.() ?? count ?? 0);
          const results: BlockMeta[] = [];
          for (let i = 1; i <= Math.min(n, 50); i++) {
            try {
              const meta = await (c as any).getBlockMeta(i);
              results.push({
                id: i,
                representativeHook: meta.representativeHook ?? 'beforeSwap',
                enabled: !!meta.enabled,
                immutable: !!meta.immutable,
                description: meta.description ?? undefined,
              });
            } catch {
              // skip
            }
          }
          if (results.length > 0) {
            setBlocks(results);
            setLoading(false);
            return;
          }
        } catch {
          // fall through to mock
        }
      }

      // Fallback: no view helpers available — return mock
      setBlocks(MOCK_BLOCKS);
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setBlocks(MOCK_BLOCKS);
    } finally {
      setLoading(false);
    }
  }, [provider, masterControlAddress]);

  // Best-effort fetch of commands for a specific block id.
  // Returns an array of commands or null if the on-chain view is not available.
  const fetchBlockCommands = useCallback(async (blockId: number | string) => {
    const addr =
      masterControlAddress ??
      process.env.REACT_APP_MASTER_CONTROL_ADDRESS ??
      getChainSettings(31337)?.masterControlAddress ??
      null;
    if (!provider || !addr) {
      // no provider/address -> cannot fetch on-chain commands
      return null;
    }
    const c = new Contract(addr, MASTER_CONTROL_ADMIN_ABI, provider);

    // Try a few possible view method names that different deployments might expose.
    const candidates = [
      'getBlockCommands',
      'getBlock',
      'blocks', // fallback mapping accessor
      'blockCommands',
    ];

    for (const name of candidates) {
      try {
        const fn = (c as any)[name];
        if (typeof fn === 'function') {
          const raw = await fn(blockId);
          // Attempt to normalize different return shapes:
          // - array of command tuples
          // - object { commands: [...] }
          if (Array.isArray(raw)) {
            return raw;
          }
          if (raw && Array.isArray(raw.commands)) {
            return raw.commands;
          }
          // If returned object looks like a block meta with .commands, try that
          if (raw && (raw.commands !== undefined)) {
            return raw.commands ?? null;
          }
        }
      } catch {
        // ignore and try next candidate
      }
    }

    // No method found or all calls failed -> return null so caller can fallback to placeholder
    return null;
  }, [provider, masterControlAddress]);

  useEffect(() => {
    fetchBlocks().catch(() => {});
  }, [fetchBlocks]);

  return { blocks, loading, error, refetch: fetchBlocks, fetchBlockCommands } as const;
}