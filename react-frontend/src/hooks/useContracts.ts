import { useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';

/**
 * useContracts
 * Helper to create ethers.Contract instances attached to provider or signer.
 *
 * Usage:
 *   const { getContract } = useContracts(provider);
 *   const token = getContract(tokenAddress, ERC20_ABI, true);
 */

export default function useContracts(providedProvider?: BrowserProvider | null) {
  const getContract = useCallback((address: string, abi: any, withSigner = true) => {
    if (!providedProvider && !(window as any).ethereum) {
      throw new Error('No provider available to create contract. Call useWallet().connect() first or pass a provider.');
    }
    const p: any = providedProvider ?? new BrowserProvider((window as any).ethereum);
    const signerOrProvider = withSigner ? p.getSigner() : p;
    return new Contract(address, abi, signerOrProvider);
  }, [providedProvider]);

  return { getContract };
}