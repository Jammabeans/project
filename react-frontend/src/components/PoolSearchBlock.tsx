import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { getChainSettings } from "../config/chainSettings";
import { useQuery } from "urql";

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
  const chainId = useSelector((state: RootState) => state.wallet.chainId);
  const chainSettings = chainId ? getChainSettings(chainId) : undefined;
  const tokens = chainSettings?.tokens || [];

  // Token In
  const [tokenIn, setTokenIn] = useState("");
  const [tokenInCustom, setTokenInCustom] = useState("");
  const [tokenInMode, setTokenInMode] = useState<"select" | "custom">("select");

  // Token Out
  const [tokenOut, setTokenOut] = useState("");
  const [tokenOutCustom, setTokenOutCustom] = useState("");
  const [tokenOutMode, setTokenOutMode] = useState<"select" | "custom">("select");

  const [fee, setFee] = useState("");
  const [searchClicked, setSearchClicked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use urql to query pools
  const tokenInAddr = tokenInMode === "custom" ? tokenInCustom : tokenIn;
  const tokenOutAddr = tokenOutMode === "custom" ? tokenOutCustom : tokenOut;
  const feeInt = parseInt(fee, 10);

  const [result] = useQuery({
    query: POOL_SEARCH_QUERY,
    variables: {
      token0: tokenInAddr,
      token1: tokenOutAddr,
      feeTier: feeInt,
    },
    pause: !searchClicked || !tokenInAddr || !tokenOutAddr || !fee || isNaN(feeInt),
  });

  const { data, fetching, error: queryError } = result;

  const handleSearch = () => {
    setError(null);
    if (!tokenInAddr || !tokenOutAddr || !fee || isNaN(feeInt)) {
      setError("Please enter valid token in, token out, and fee.");
      return;
    }
    setSearchClicked(true);
  };

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
      {/* Token In */}
      <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4 }}>
        Token In Address
        {tokenInMode === "select" ? (
          <>
            <select
              value={tokenIn}
              onChange={e => {
                if (e.target.value === "__custom__") {
                  setTokenInMode("custom");
                  setTokenIn("");
                } else {
                  setTokenIn(e.target.value);
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
              <option value="">Select token in</option>
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
              onChange={e => setTokenInCustom(e.target.value)}
              placeholder="0x... (custom token in address)"
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
                setTokenInMode("select");
                setTokenIn("");
                setTokenInCustom("");
              }}
            >
              Choose from list
            </button>
          </>
        )}
      </label>
      {/* Token Out */}
      <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4 }}>
        Token Out Address
        {tokenOutMode === "select" ? (
          <>
            <select
              value={tokenOut}
              onChange={e => {
                if (e.target.value === "__custom__") {
                  setTokenOutMode("custom");
                  setTokenOut("");
                } else {
                  setTokenOut(e.target.value);
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
              value={tokenOutCustom}
              onChange={e => setTokenOutCustom(e.target.value)}
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
                setTokenOutMode("select");
                setTokenOut("");
                setTokenOutCustom("");
              }}
            >
              Choose from list
            </button>
          </>
        )}
      </label>
      {/* Fee */}
      <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4 }}>
        Fee
        <input
          type="text"
          value={fee}
          onChange={e => setFee(e.target.value)}
          placeholder="e.g. 3000"
          style={{
            width: "100%",
            padding: "0.5em",
            borderRadius: 4,
            border: "1px solid #555",
            background: "#181c24",
            color: "#fff"
          }}
        />
      </label>
      <button
        onClick={handleSearch}
        style={{
          marginTop: 8,
          padding: "0.7em 1.2em",
          borderRadius: 6,
          border: "none",
          background: "#00bcd4",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1em",
          cursor: "pointer"
        }}
        disabled={fetching}
      >
        {fetching ? "Searching..." : "Search"}
      </button>
      {error && (
        <div style={{ color: "#ff5252", fontWeight: 500, marginTop: 8 }}>
          {error}
        </div>
      )}
      {queryError && (
        <div style={{ color: "#ff5252", fontWeight: 500, marginTop: 8 }}>
          {queryError.message}
        </div>
      )}
      {searchClicked && !fetching && data && data.pools && data.pools.length === 0 && (
        <div style={{ color: "#aaa", fontWeight: 500, marginTop: 12 }}>
          No pools found for the given tokens and fee.
        </div>
      )}
      {data && data.pools && data.pools.length > 0 && (
        <div style={{ width: "100%", marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#00bcd4" }}>Found Pools:</div>
          {data.pools.map((pool: any) => (
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
              // TODO: Add onClick to select pool
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
      <div style={{ color: "#aaa", fontWeight: 400, fontSize: "0.95em", marginTop: 12 }}>
        (Search uses live subgraph data. If no results, check addresses and fee.)
      </div>
    </div>
  );
};

export default PoolSearchBlock;