import { useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import useAccessControlResolver from './useAccessControlResolver';
import { getChainSettings } from '../config/chainSettings';

/**
 * useContracts
 * Helper to create ethers.Contract instances attached to provider or signer.
 *
 * Usage:
 *   const { getContract } = useContracts(provider);
 *   const token = getContract(tokenAddress, ERC20_ABI, true);
 */

export default function useContracts(providedProvider?: BrowserProvider | null) {
  const p: any = providedProvider ?? (typeof window !== 'undefined' && (window as any).ethereum ? new BrowserProvider((window as any).ethereum) : null);

  // Read AccessControl address from chainSettings for local dev (31337) as a fallback seed.
  const localAccessControl = getChainSettings(31337)?.accessControlAddress;

  // Hook resolver will attempt to discover core addresses from AccessControl at runtime.
  const { addresses, others, resolve, loading, error } = useAccessControlResolver(p, localAccessControl ?? undefined);

  useEffect(() => {
    // Auto-resolve once a provider and an accessControl address are available.
    if (p && localAccessControl) {
      // Fire-and-forget; resolver manages its own state
      void resolve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, localAccessControl]);

  const getContract = useCallback(async (address: string, abi: any, withSigner = true) => {
    if (!p) {
      throw new Error('No provider available to create contract. Call useWallet().connect() first or pass a provider.');
    }
    try {
      // If a signer is requested, ensure there's an injected provider and request accounts if needed.
      if (withSigner) {
        const eth = (window as any).ethereum;
        if (!eth) {
          throw new Error('No injected wallet detected. Install MetaMask or use a wallet that injects window.ethereum.');
        }
        // If user hasn't granted accounts access yet, request it and await the result so we obtain a real signer.
        try {
          if (!eth.selectedAddress) {
            await eth.request({ method: 'eth_requestAccounts' });
          }
        } catch {
          // If the user rejects, we'll still attempt to get a signer which will fail below with a clearer message.
        }
        // Await the signer instance from the provider.
        const signer = await p.getSigner();
        // Some provider wrappers may return an object lacking sendTransaction; try to re-create a BrowserProvider from window.ethereum and re-check.
        if (typeof (signer as any).sendTransaction !== 'function') {
          try {
            const fallbackProvider: any = new BrowserProvider(eth);
            const fallbackSigner = await fallbackProvider.getSigner();
            if (typeof (fallbackSigner as any).sendTransaction !== 'function') {
              throw new Error('Provider does not expose a signer capable of sending transactions. Ensure your wallet is connected with account access.');
            }
            return new Contract(address, abi, fallbackSigner);
          } catch {
            throw new Error('Provider does not expose a signer capable of sending transactions. Ensure your wallet is connected with account access.');
          }
        }
        return new Contract(address, abi, signer);
      } else {
        // read-only provider
        return new Contract(address, abi, p);
      }
    } catch (err: any) {
      throw new Error(err?.message ?? String(err));
    }
  }, [p]);

  return { getContract, resolvedAddresses: addresses, resolvedOthers: others, resolving: loading, resolveError: error };
}