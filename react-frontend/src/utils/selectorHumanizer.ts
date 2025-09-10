import { Interface, keccak256, toUtf8Bytes } from 'ethers';

const KNOWN_SIGNATURES = [
  'function transfer(address to,uint256 amount)',
  'function approve(address spender,uint256 amount)',
  'function transferFrom(address from,address to,uint256 amount)',
  'function mint(address to,uint256 amount)',
  'function burn(address from,uint256 amount)',
  // MasterControl / hooks-related helpers
  'function setCommands(uint256 poolId,bytes32 hookPath,tuple(address target,bytes4 selector,uint8 callType,uint32 feeBips,uint256 provenanceBlockId)[] cmds)',
  'function applyBlocksToPool(uint256 poolId,uint256[] blockIds)',
  'function getCommands(uint256 poolId,bytes32 hookPath)',
  'function poolCommandTargets(uint256 poolId)',
  'function commandLockedForPool(uint256 poolId,bytes32 hookPath,address target,bytes4 selector)',
] as const;

/**
 * humanizeSelector
 * Try to map a bytes4 selector (or a selector-like string) to a human-readable
 * function signature when the signature is among a small registry of known
 * function signatures. Falls back to returning the original selector string.
 */
export function humanizeSelector(selector?: string | null): string {
  if (!selector) return '';
  try {
    const sel = String(selector);
    const normalized = sel.startsWith('0x') ? sel : `0x${sel.replace(/^0x/, '')}`;

    for (const sig of KNOWN_SIGNATURES) {
      try {
        // compute selector as first 4 bytes of keccak256(functionSignature)
        const hash = keccak256(toUtf8Bytes(sig));
        const s = '0x' + hash.slice(2, 10); // first 4 bytes => 8 hex chars
        if (s === normalized) {
          // return the function signature without the leading "function " token
          return sig.replace(/^function\s+/, '');
        }
      } catch {
        // ignore and continue
      }
    }
  } catch {
    // ignore decode errors and fall back
  }
  return selector;
}