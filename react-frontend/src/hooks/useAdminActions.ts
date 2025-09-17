import { useCallback, useState } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import useWallet from './useWallet';
import { MASTER_CONTROL_ADMIN_ABI, wrapAsMasterControlContract, MasterControlContract } from '../contracts/masterControl';
import { getChainSettings } from '../config/chainSettings';

/**
 * useAdminActions
 * - Provides helpers to call MasterControl admin functions: setCommands, applyBlocksToPool
 * - Uses connected wallet signer via useWallet()
 *
 * Returned:
 *  - sendSetCommands(poolId, hookPathBytes32, commandsArray) -> tx response
 *  - sendApplyBlocks(poolId, blockIds) -> tx response
 *  - estimateSetCommands(...)
 *  - estimateApplyBlocks(...)
 *  - loading / error for the last operation
 *
 * NOTE: This hook expects REACT_APP_MASTER_CONTROL_ADDRESS to be set to the MasterControl contract address.
 * Use bytes32 hookPath (e.g., keccak256 or padded ascii) when calling setCommands.
 */


export default function useAdminActions() {
  const { provider, signer, account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const masterControlAddress =
    process.env.REACT_APP_MASTER_CONTROL_ADDRESS ??
    getChainSettings(31337)?.masterControlAddress ??
    undefined;

  const getContract = useCallback((): MasterControlContract => {
    if (!masterControlAddress) throw new Error('REACT_APP_MASTER_CONTROL_ADDRESS not set');
    if (!provider) throw new Error('No provider available (connect wallet)');
    const p: any = provider ?? new BrowserProvider((window as any).ethereum);
    const signerOrProvider = signer ?? p.getSigner();
    // Return a typed MasterControlContract wrapper to avoid any-casts elsewhere
    // NOTE: import is at top of file
    const raw = new Contract(masterControlAddress, MASTER_CONTROL_ADMIN_ABI, signerOrProvider);
    return wrapAsMasterControlContract(raw);
  }, [provider, signer, masterControlAddress]);

  const estimateSetCommands = useCallback(async (poolId: number | string, hookPath: string, cmds: any[]) => {
    try {
      const mc = getContract();
      if (!mc.estimateGas || !signer) throw new Error('Cannot estimate gas without signer');
      // access estimateGas method via indexed access to satisfy differing ethers typings
      const est = await (mc.estimateGas as any)['setCommands'](poolId, hookPath, cmds);
      return est;
    } catch (err: any) {
      throw err;
    }
  }, [getContract, signer]);

  const sendSetCommands = useCallback(async (poolId: number | string, hookPath: string, cmds: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const mc = getContract();
      if (!mc.setCommands) throw new Error('setCommands not available on MasterControl contract ABI');
      const tx = await mc.setCommands(poolId, hookPath, cmds);
      await tx.wait?.();
      setLoading(false);
      return tx;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setLoading(false);
      throw err;
    }
  }, [getContract]);

  const estimateApplyBlocks = useCallback(async (poolId: number | string, blockIds: (number | string)[]) => {
    try {
      const mc = getContract();
      if (!mc.estimateGas || !signer) throw new Error('Cannot estimate gas without signer');
      const est = await (mc.estimateGas as any)['applyBlocksToPool'](poolId, blockIds);
      return est;
    } catch (err: any) {
      throw err;
    }
  }, [getContract, signer]);

  const sendApplyBlocks = useCallback(async (poolId: number | string, blockIds: (number | string)[]) => {
    setLoading(true);
    setError(null);
    try {
      const mc = getContract();
      if (!mc.applyBlocksToPool) throw new Error('applyBlocksToPool not available on MasterControl contract ABI');
      const tx = await mc.applyBlocksToPool(poolId, blockIds);
      await tx.wait?.();
      setLoading(false);
      return tx;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setLoading(false);
      throw err;
    }
  }, [getContract]);

  return {
    sendSetCommands,
    estimateSetCommands,
    sendApplyBlocks,
    estimateApplyBlocks,
    loading,
    error,
  } as const;
}