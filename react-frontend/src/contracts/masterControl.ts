import { Contract } from 'ethers';

/**
 * Minimal typed interface for MasterControl contract methods used by the frontend.
 * This provides a narrow, explicit surface so other code can avoid `any` casts.
 *
 * NOTE: This is intentionally minimal and only types the methods this frontend uses:
 *  - estimateGas.setCommands(...)
 *  - estimateGas.applyBlocksToPool(...)
 *  - setCommands(...)
 *  - applyBlocksToPool(...)
 *
 * If you add more calls, expand this interface accordingly.
 */

export const MASTER_CONTROL_ADMIN_ABI = [
  'function setCommands(uint256 poolId, bytes32 hookPath, tuple(address target, bytes4 selector, uint8 callType, uint32 feeBips, uint256 provenanceBlockId)[] cmds)',
  'function applyBlocksToPool(uint256 poolId, uint256[] blockIds)',
] as const;

export type MasterControlContract = Contract & {
  // estimateGas namespace
  estimateGas: {
    setCommands: (poolId: number | string, hookPath: string, cmds: any[]) => Promise<bigint>;
    applyBlocksToPool: (poolId: number | string, blockIds: (number | string)[]) => Promise<bigint>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };

  // transaction methods
  setCommands: (poolId: number | string, hookPath: string, cmds: any[]) => Promise<any>;
  applyBlocksToPool: (poolId: number | string, blockIds: (number | string)[]) => Promise<any>;

  // allow indexed access for other runtime properties (e.g., .on)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function wrapAsMasterControlContract(c: Contract): MasterControlContract {
  return c as MasterControlContract;
}