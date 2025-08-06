import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { getChainSettings } from "../config/chainSettings";
import {
  setTokenIn, setTokenInMode, setTokenInCustom,
  setTokenOut, setTokenOutMode, setTokenOutCustom,
  setSelectedPool
} from "../store";
import PoolInfoBlock from "./PoolInfoBlock";

const POOL_SEARCH_QUERY = `
  query Pools($token0: String!, $token1: String!, $feeTier: Int!) {
    pools(
      where: {
        token0: $token0
        token1: $token1
        feeTier: $feeTier
      }
    ) {
      id
      feeTier
      liquidity
      token0 { id symbol }
      token1 { id symbol }
    }
  }
`;

const PoolSearchBlock: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const chainId = useSelector((state: RootState) => state.wallet.chainId);
  const chainSettings = chainId ? getChainSettings(chainId) : undefined;
  const tokens = chainSettings?.tokens || [];

  // Redux state for search and selection
  const {
    tokenIn, tokenInMode, tokenInCustom,
    tokenOut, tokenOutMode, tokenOutCustom,
    selectedPool
  } = useSelector((state: RootState) => state.poolSearch);

  // Local state for snapshot and filtered pools
  const [snapshotPools, setSnapshotPools] = useState<any[]>([]);
  const [filteredSnapshotPools, setFilteredSnapshotPools] = useState<any[]>([]);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  // Load pool-snapshot.json on mount
  useEffect(() => {
    fetch("/pool-snapshot.json")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load snapshot");
        return res.json();
      })
      .then(data => {
        setSnapshotPools(data);
        setSnapshotError(null);
      })
      .catch((e) => {
        setSnapshotPools([]);
        setSnapshotError("Failed to load pool-snapshot.json. Make sure it is in the public/ directory.");
      });
  }, []);

  // Filter pools by token in and token out
  useEffect(() => {
    let addr = "";
    if (tokenInMode === "custom") {
      addr = tokenInCustom.trim().toLowerCase();
    } else {
      addr = tokenIn.trim().toLowerCase();
    }
    if (!addr) {
      setFilteredSnapshotPools([]);
      return;
    }
    let matches = snapshotPools.filter(pool => {
      const token0 = (pool.token0?.id || "").toLowerCase().trim();
      const token1 = (pool.token1?.id || "").toLowerCase().trim();
      return token0 === addr || token1 === addr;
    });
    // If tokenOut is selected, filter further
    let outAddr = "";
    if (tokenOutMode === "custom") {
      outAddr = tokenOutCustom.trim().toLowerCase();
    } else {
      outAddr = tokenOut.trim().toLowerCase();
    }
    if (outAddr) {
      matches = matches.filter(pool => {
        const token0 = (pool.token0?.id || "").toLowerCase().trim();
        const token1 = (pool.token1?.id || "").toLowerCase().trim();
        // Only match pools where the other token matches tokenOut
        if (token0 === addr) return token1 === outAddr;
        if (token1 === addr) return token0 === outAddr;
        return false;
      });
    }
    setFilteredSnapshotPools(matches);
  }, [tokenIn, tokenInCustom, tokenInMode, tokenOut, tokenOutCustom, tokenOutMode, snapshotPools]);

  // If a pool is selected, show the info block
  if (selectedPool) {
    return <PoolInfoBlock pool={selectedPool} />;
  }

  return (
    <div
      style={{
        background: "#263238",
        border: "2px solid #00bcd4",
        borderRadius: 8,
        padding: "1.2rem 1.5rem",
        marginBottom: 24,
        color: "#fff",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "1.1em",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        alignItems: "center",
        maxWidth: 420,
        margin: "0 auto"
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.2em", marginBottom: 8 }}>
        Search for a Pool
      </div>
      {/* Token In Address */}
      <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4 }}>
        Token In Address
        {tokenInMode === "select" ? (
          <>
            <select
              value={tokenIn}
              onChange={e => {
                if (e.target.value === "__custom__") {
                  dispatch(setTokenInMode("custom"));
                  dispatch(setTokenIn(""));
                } else {
                  dispatch(setTokenInMode("select"));
                  dispatch(setTokenIn(e.target.value));
                }
                // Reset token out when token in changes
                dispatch(setTokenOut(""));
                dispatch(setTokenOutCustom(""));
                dispatch(setTokenOutMode("select"));
              }}
              style={{
                width: "100%",
                padding: "0.5em",
                borderRadius: 4,
                border: "1px solid #555",
                background: "#181c24",
                color: "#fff"
              }}
            >
              <option value="">Select token</option>
              {tokens.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol} ({token.name})
                </option>
              ))}
              <option value="__custom__">Other...</option>
            </select>
          </>
        ) : (
          <>
            <input
              type="text"
              value={tokenInCustom}
              onChange={e => dispatch(setTokenInCustom(e.target.value))}
              placeholder="0x... (custom token address)"
              style={{
                width: "100%",
                padding: "0.5em",
                borderRadius: 4,
                border: "1px solid #555",
                background: "#181c24",
                color: "#fff"
              }}
            />
            <button
              type="button"
              style={{
                marginTop: 4,
                fontSize: "0.95em",
                background: "none",
                color: "#00bcd4",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline"
              }}
              onClick={() => {
                dispatch(setTokenInMode("select"));
                dispatch(setTokenIn(""));
                dispatch(setTokenInCustom(""));
                dispatch(setTokenOut(""));
                dispatch(setTokenOutCustom(""));
                dispatch(setTokenOutMode("select"));
              }}
            >
              Choose from list
            </button>
          </>
        )}
      </label>
      {/* Token Out Address (options based on available matches) */}
      {(tokenIn || tokenInCustom) && (() => {
        // Compute available token out options from filtered pools
        let addr = tokenInMode === "custom" ? tokenInCustom.trim().toLowerCase() : tokenIn.trim().toLowerCase();
        const outOptions: { id: string, symbol: string, name?: string }[] = [];
        filteredSnapshotPools.forEach(pool => {
          const t0 = pool.token0;
          const t1 = pool.token1;
          if (t0?.id?.toLowerCase() === addr && !outOptions.some(o => o.id === t1.id)) {
            outOptions.push({ id: t1.id, symbol: t1.symbol, name: t1.name });
          }
          if (t1?.id?.toLowerCase() === addr && !outOptions.some(o => o.id === t0.id)) {
            outOptions.push({ id: t0.id, symbol: t0.symbol, name: t0.name });
          }
        });
        return (
          <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4, marginTop: 8 }}>
            Token Out Address
            {tokenOutMode === "select" ? (
              <>
                <select
                  value={tokenOut}
                  onChange={e => {
                    if (e.target.value === "__custom__") {
                      dispatch(setTokenOutMode("custom"));
                      dispatch(setTokenOut(""));
                    } else {
                      dispatch(setTokenOutMode("select"));
                      dispatch(setTokenOut(e.target.value));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.5em",
                    borderRadius: 4,
                    border: "1px solid #555",
                    background: "#181c24",
                    color: "#fff"
                  }}
                >
                  <option value="">Select token out</option>
                  {outOptions.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.symbol}{token.name ? ` (${token.name})` : ""}
                    </option>
                  ))}
                  <option value="__custom__">Other...</option>
                </select>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={tokenOutCustom}
                  onChange={e => dispatch(setTokenOutCustom(e.target.value))}
                  placeholder="0x... (custom token out address)"
                  style={{
                    width: "100%",
                    padding: "0.5em",
                    borderRadius: 4,
                    border: "1px solid #555",
                    background: "#181c24",
                    color: "#fff"
                  }}
                />
                <button
                  type="button"
                  style={{
                    marginTop: 4,
                    fontSize: "0.95em",
                    background: "none",
                    color: "#00bcd4",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                  onClick={() => {
                    dispatch(setTokenOutMode("select"));
                    dispatch(setTokenOut(""));
                    dispatch(setTokenOutCustom(""));
                  }}
                >
                  Choose from list
                </button>
              </>
            )}
          </label>
        );
      })()}
      {snapshotError && (
        <div style={{ color: "#ff5252", fontWeight: 500, marginTop: 8 }}>
          {snapshotError}
        </div>
      )}
      {/* Show snapshot pools if any match */}
      {filteredSnapshotPools.length > 0 && (
        <div style={{ width: "100%", marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#00bcd4" }}>
            Snapshot Pools ({filteredSnapshotPools.length}):
          </div>
          {filteredSnapshotPools.map((pool: any) => (
            <div
              key={pool.id}
              style={{
                background: "#181c24",
                border: "1.5px solid #00bcd4",
                borderRadius: 6,
                padding: "0.7em 1em",
                marginBottom: 8,
                cursor: "pointer",
                color: "#fff",
                textAlign: "left"
              }}
              onClick={() => dispatch(setSelectedPool(pool))}
            >
              Pool: {pool.token0.symbol} / {pool.token1.symbol} @ {pool.feeTier}
              <div style={{ fontWeight: 400, fontSize: "0.95em", color: "#aaa" }}>
                Liquidity: {pool.liquidity}
              </div>
              <div style={{ fontWeight: 400, fontSize: "0.95em", color: "#aaa" }}>
                Pool ID: {pool.id}
              </div>
            </div>
          ))}
        </div>
      )}
      {filteredSnapshotPools.length === 0 && !snapshotError && (
        <div style={{ color: "#aaa", fontWeight: 400, fontSize: "0.95em", marginTop: 12 }}>
          No pools found for this token.
        </div>
      )}
    </div>
  );
};

export default PoolSearchBlock;