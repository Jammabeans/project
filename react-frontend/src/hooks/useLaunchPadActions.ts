import { useCallback } from 'react';
import { BrowserProvider, Contract, Interface } from 'ethers';
import useContracts from './useContracts';
import { getChainSettings } from '../config/chainSettings';

const POOL_LAUNCHPAD_ABI = [
  'function createNewTokenAndInitWithNative(string tokenName, string tokenSymbol, uint256 tokenSupply, uint24 fee, int24 tickSpacing, uint160 sqrtPriceX96, address hooks) returns (bytes32, address)',
  'function createSuppliedTokenAndInitWithNative(address existingTokenAddr, uint24 fee, int24 tickSpacing, uint160 sqrtPriceX96, address hooks) returns (bytes32, address)',
  'function createNewTokenAndInitWithToken(string tokenName, string tokenSymbol, uint256 tokenSupply, address otherTokenAddr, uint24 fee, int24 tickSpacing, uint160 sqrtPriceX96, address hooks) returns (bytes32, address)',
  'function initWithSuppliedTokens(address tokenA, address tokenB, uint24 fee, int24 tickSpacing, uint160 sqrtPriceX96, address hooks) returns (bytes32)'
];

/**
 * useLaunchPadActions
 * - Provides wrapped write calls to the on-chain PoolLaunchPad deployment.
 * - Functions return the ContractTransaction (so callers can await tx.wait()).
 *
 * NOTE: This hook expects a provider/signer available via useContracts (which uses window.ethereum by default).
 *       Callers should catch and display errors and handle receipt/tx.wait as appropriate.
 */
export default function useLaunchPadActions(providedProvider?: any) {
  // Dev helper: expose a calldata decoder so you can paste the raw calldata into the browser console
  // and see the decoded arguments. This is a temporary debugging aid.
  try {
  (window as any).__decodeLaunchCalldata = (data: string) => {
    try {
      const iface: any = new Interface(POOL_LAUNCHPAD_ABI) as any;
      const parsed: any = iface.parseTransaction({ data }) as any;
      if (!parsed) return { error: 'parseTransaction returned null/undefined' };
      const args = parsed.args ?? [];
      return {
        name: parsed.name ?? null,
        tokenName: args[0] ?? null,
        tokenSymbol: args[1] ?? null,
        tokenSupply: args[2]?.toString?.() ?? String(args[2] ?? ''),
        fee: args[3]?.toString?.() ?? String(args[3] ?? ''),
        tickSpacing: args[4]?.toString?.() ?? String(args[4] ?? ''),
        sqrtPriceX96: args[5]?.toString?.() ?? String(args[5] ?? ''),
        hooks: args[6] ?? null,
      };
    } catch (e: any) {
      return { error: String(e) };
    }
  };
} catch {
  // ignore in non-browser environments
}
  const { resolvedAddresses, getContract } = useContracts(providedProvider ?? null);
  // MasterControl (hooks) canonical address preference: resolver -> chainSettings(31337)
  const MASTER_CONTROL_ADDR = resolvedAddresses?.masterControl ?? getChainSettings(31337)?.masterControlAddress;
  if (!MASTER_CONTROL_ADDR) {
    // eslint-disable-next-line no-console
    console.debug('useLaunchPadActions: masterControl address not resolved (resolver & chainSettings missing).');
  }
  const resolveLaunchPadAddress = useCallback(() => {
    return (
      process.env.REACT_APP_POOL_LAUNCHPAD_ADDRESS
      ?? resolvedAddresses?.poolLaunchPad
      ?? getChainSettings(31337)?.poolLaunchPadAddress
    );
  }, [resolvedAddresses]);

  const createNewTokenAndInitWithNative = useCallback(async (opts: {
    tokenName: string;
    tokenSymbol: string;
    tokenSupply: string | number;
    fee: number | string;
    tickSpacing: number | string;
    sqrtPriceX96: number | string;
    hooks?: string | null;
  }) => {
    const addr = resolveLaunchPadAddress();
    if (!addr) throw new Error('PoolLaunchPad address not configured');
    const c = await getContract(addr, POOL_LAUNCHPAD_ABI, true);
    const supply = String(opts.tokenSupply);

    // Determine a sane sqrtPriceX96 value:
    // - If caller passed a non-zero value use it (as BigInt)
    // - Otherwise default to 1<<96 (same value used in tests)
    const DEFAULT_SQRT_PRICE_X96 = (BigInt(1) << BigInt(96));
    const rawSqrt = opts.sqrtPriceX96 ?? 0;
    const sqrtPriceX96 = (String(rawSqrt) === '0' || rawSqrt === 0)
      ? DEFAULT_SQRT_PRICE_X96
      : (typeof rawSqrt === 'string' ? BigInt(rawSqrt) : BigInt(rawSqrt));

    // Resolve hooks address: use canonical MASTER_CONTROL_ADDR resolved earlier
    const hooksAddr = MASTER_CONTROL_ADDR;
    if (!hooksAddr) {
      throw new Error('masterControl (hooks) address not available from resolver or chain settings; ensure masterControl is deployed or set in chainSettings.');
    }

    const feeNum = Number(opts.fee);
    const tickNum = Number(opts.tickSpacing);

    // Debug: log exact encoded calldata so you can compare with RPC payloads
    try {
      // c.interface is the ethers Interface instance attached to the Contract
      const encoded = (c as any).interface.encodeFunctionData('createNewTokenAndInitWithNative', [
        opts.tokenName,
        opts.tokenSymbol,
        supply,
        feeNum,
        tickNum,
        sqrtPriceX96,
        hooksAddr
      ]);
      // eslint-disable-next-line no-console
      console.debug('LaunchPad.createNewTokenAndInitWithNative - encoded calldata:', encoded);

      // Also decode the encoded calldata locally and print the parsed values for easier inspection
      try {
        const decoded = (c as any).interface.decodeFunctionData('createNewTokenAndInitWithNative', encoded);
        // eslint-disable-next-line no-console
        console.debug('LaunchPad.createNewTokenAndInitWithNative - decoded args:', {
          tokenName: decoded[0],
          tokenSymbol: decoded[1],
          tokenSupply: decoded[2]?.toString?.() ?? String(decoded[2]),
          fee: decoded[3]?.toString?.() ?? String(decoded[3]),
          tickSpacing: decoded[4]?.toString?.() ?? String(decoded[4]),
          sqrtPriceX96: decoded[5]?.toString?.() ?? String(decoded[5]),
          hooks: decoded[6]
        });
      } catch (de) {
        // eslint-disable-next-line no-console
        console.debug('Failed to decode encoded calldata:', de);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('Failed to encode calldata for debug:', e);
    }

    const tx = await (c as any).createNewTokenAndInitWithNative(
      opts.tokenName,
      opts.tokenSymbol,
      supply,
      feeNum,
      tickNum,
      sqrtPriceX96,
      hooksAddr
    );
    return tx;
  }, [resolveLaunchPadAddress, providedProvider]);

  const createSuppliedTokenAndInitWithNative = useCallback(async (opts: {
    existingTokenAddr: string;
    fee: number | string;
    tickSpacing: number | string;
    sqrtPriceX96: number | string;
    hooks?: string | null;
  }) => {
    const addr = resolveLaunchPadAddress();
    if (!addr) throw new Error('PoolLaunchPad address not configured');
    const c = await getContract(addr, POOL_LAUNCHPAD_ABI, true);
    const tx = await (c as any).createSuppliedTokenAndInitWithNative(
      opts.existingTokenAddr,
      Number(opts.fee),
      Number(opts.tickSpacing),
      (typeof opts.sqrtPriceX96 === 'string' ? BigInt(opts.sqrtPriceX96) : BigInt(opts.sqrtPriceX96)),
      MASTER_CONTROL_ADDR
    );
    return tx;
  }, [resolveLaunchPadAddress, providedProvider]);

  const createNewTokenAndInitWithToken = useCallback(async (opts: {
    tokenName: string;
    tokenSymbol: string;
    tokenSupply: string | number;
    otherTokenAddr: string;
    fee: number | string;
    tickSpacing: number | string;
    sqrtPriceX96: number | string;
    hooks?: string | null;
  }) => {
    const addr = resolveLaunchPadAddress();
    if (!addr) throw new Error('PoolLaunchPad address not configured');
    const c = await getContract(addr, POOL_LAUNCHPAD_ABI, true);
    const supply = String(opts.tokenSupply);
    const tx = await (c as any).createNewTokenAndInitWithToken(
      opts.tokenName,
      opts.tokenSymbol,
      supply,
      opts.otherTokenAddr,
      Number(opts.fee),
      Number(opts.tickSpacing),
      (typeof opts.sqrtPriceX96 === 'string' ? BigInt(opts.sqrtPriceX96) : BigInt(opts.sqrtPriceX96)),
      MASTER_CONTROL_ADDR
    );
    return tx;
  }, [resolveLaunchPadAddress, providedProvider]);

  const initWithSuppliedTokens = useCallback(async (opts: {
    tokenA: string;
    tokenB: string;
    fee: number | string;
    tickSpacing: number | string;
    sqrtPriceX96: number | string;
    hooks?: string | null;
  }) => {
    const addr = resolveLaunchPadAddress();
    if (!addr) throw new Error('PoolLaunchPad address not configured');
    const c = await getContract(addr, POOL_LAUNCHPAD_ABI, true);
    const tx = await (c as any).initWithSuppliedTokens(
      opts.tokenA,
      opts.tokenB,
      Number(opts.fee),
      Number(opts.tickSpacing),
      (typeof opts.sqrtPriceX96 === 'string' ? BigInt(opts.sqrtPriceX96) : BigInt(opts.sqrtPriceX96)),
      MASTER_CONTROL_ADDR
    );
    return tx;
  }, [resolveLaunchPadAddress, providedProvider]);

  return {
    createNewTokenAndInitWithNative,
    createSuppliedTokenAndInitWithNative,
    createNewTokenAndInitWithToken,
    initWithSuppliedTokens,
    launchPadAddress: resolveLaunchPadAddress(),
  } as const;
}