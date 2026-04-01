import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  // Keep provider instance stable across renders; recreating BrowserProvider on every render
  // can trigger repeated RPC polling and resolver loops in dev wallets (MetaMask).
  const p: any = useMemo(() => {
    if (providedProvider) return providedProvider;
    if (typeof window === 'undefined' || !(window as any).ethereum) return null;
    // Use "any" so provider tolerates chain changes (common in local dev with anvil/metamask).
    return new BrowserProvider((window as any).ethereum, 'any');
  }, [providedProvider]);

  // Read AccessControl address from chainSettings for local dev (31337) as a fallback seed.
  const localAccessControl = getChainSettings(31337)?.accessControlAddress;

  // Hook resolver will attempt to discover core addresses from AccessControl at runtime.
  const { addresses, others, resolve, loading, error } = useAccessControlResolver(p, localAccessControl ?? undefined);

  // Prevent repeated resolve() calls when dependencies are logically unchanged.
  const lastResolveKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Auto-resolve once a provider and an accessControl address are available.
    if (p && localAccessControl) {
      const key = `${String(localAccessControl).toLowerCase()}`;
      if (lastResolveKeyRef.current === key) return;
      lastResolveKeyRef.current = key;
      // Fire-and-forget; resolver manages its own state
      void resolve();
    }
  }, [p, localAccessControl, resolve]);

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

        // Ensure wallet is on Local Anvil (31337). If chain id drifts after node restarts,
        // MetaMask may try to sign with a stale chain id and anvil returns "invalid chain id for signer".
        try {
          const expected = getChainSettings(31337);
          const expectedHex = '0x7a69'; // 31337
          const currentHex = await eth.request({ method: 'eth_chainId' });
          if (String(currentHex).toLowerCase() !== expectedHex) {
            try {
              await eth.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: expectedHex }],
              });
            } catch (switchErr: any) {
              // 4902 => chain not added in wallet yet
              if (switchErr?.code === 4902) {
                await eth.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: expectedHex,
                    chainName: expected?.name ?? 'Local Anvil',
                    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [expected?.rpcUrl ?? 'http://127.0.0.1:8545'],
                  }],
                });
                await eth.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: expectedHex }],
                });
              } else {
                throw switchErr;
              }
            }
          }
        } catch (chainErr: any) {
          throw new Error(`Wallet must be connected to Local Anvil (chainId 31337). ${chainErr?.message ?? String(chainErr)}`);
        }

        // If user hasn't granted accounts access yet, request it and await the result so we obtain a real signer.
        try {
          if (!eth.selectedAddress) {
            await eth.request({ method: 'eth_requestAccounts' });
          }
        } catch {
          // If the user rejects, we'll still attempt to get a signer which will fail below with a clearer message.
        }
        // Re-create a fresh provider after any potential chain switch so signer/network are aligned.
        const signerProvider: any = new BrowserProvider(eth, 'any');
        const signer = await signerProvider.getSigner();
        // Some provider wrappers may return an object lacking sendTransaction; try to re-create a BrowserProvider from window.ethereum and re-check.
        if (typeof (signer as any).sendTransaction !== 'function') {
          try {
            const fallbackProvider: any = new BrowserProvider(eth, 'any');
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
