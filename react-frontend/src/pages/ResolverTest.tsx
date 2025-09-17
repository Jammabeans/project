import React, { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import useAccessControlResolver from "../hooks/useAccessControlResolver";
import { getChainSettings } from "../config/chainSettings";

import Pages from "./Pages";

/**
 * Debug page: calls the resolver on mount and prints results to the screen.
 * Visit /resolver-test after restarting the dev server to verify the resolver.
 */

export default function ResolverTest(): JSX.Element {
  const [providerReady, setProviderReady] = useState(false);
  const [provider, setProvider] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const p = new BrowserProvider((window as any).ethereum);
      setProvider(p);
      setProviderReady(true);
    } else {
      // try default local RPC fallback
      setProviderReady(false);
      setProvider(null);
    }
  }, []);

  // read seed AccessControl from chain settings (local dev)
  const localAC = getChainSettings(31337)?.accessControlAddress;

  const { addresses, others, loading, error, resolve } = useAccessControlResolver(provider, localAC);

  useEffect(() => {
    // attempt resolve once provider and seed address present
    async function doResolve() {
      if (provider && localAC) {
        await resolve();
      }
    }
    void doResolve();
  }, [provider, localAC, resolve]);

  return (
    <div style={{ color: "#e6eef8", padding: 20 }}>
      <h2>AccessControl Resolver Test</h2>
      <p>
        Provider ready: <strong>{provider ? "yes" : "no"}</strong>
      </p>
      <p>
        Seed AccessControl address from config: <strong>{localAC ?? "none"}</strong>
      </p>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => {
            void (async () => {
              if (!provider) {
                alert("No provider available. Connect wallet or run with window.ethereum present.");
                return;
              }
              await resolve();
            })();
          }}
          style={{ padding: "8px 12px" }}
        >
          Run Resolver
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Status</h3>
        <div>Loading: {loading ? "yes" : "no"}</div>
        <div>Error: {error ? String(error) : "none"}</div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Resolved Addresses</h3>
        {Object.keys(addresses).length === 0 ? (
          <div>No resolved named addresses yet.</div>
        ) : (
          <ul>
            {Object.entries(addresses).map(([k, v]) => (
              <li key={k}>
                <strong>{k}:</strong> {v}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Other discovered addresses</h3>
        {others.length === 0 ? (
          <div>None</div>
        ) : (
          <ul>
            {others.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <small>
          Notes: Connect a wallet (Metamask) pointing at your local anvil chain or ensure window.ethereum is available and
          the AccessControl address in config matches your local deployment.
        </small>
      </div>
    </div>
  );
}