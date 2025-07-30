import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { getChainSettings } from "../config/chainSettings";
// import { Pool } from "@uniswap/v4-sdk"; // Uncomment when integrating SDK

const AllV4PoolsBlock: React.FC = () => {
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
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setSearching(true);
    setError(null);
    setSearchResults([]);
    // Use custom address if "Other..." is selected
    const tokenInAddr = tokenInMode === "custom" ? tokenInCustom : tokenIn;
    const tokenOutAddr = tokenOutMode === "custom" ? tokenOutCustom : tokenOut;
    // TODO: Integrate Uniswap V4 SDK pool search here
    // For now, mock a result if all fields are filled
    if (tokenInAddr && tokenOutAddr && fee) {
      setTimeout(() => {
        setSearchResults([
          {
            id: "mock-1",
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            fee,
            label: `Pool: ${tokenInAddr.slice(0, 6)}... / ${tokenOutAddr.slice(0, 6)}... @ ${fee}`,
          },
        ]);
        setSearching(false);
      }, 800);
    } else {
      setError("Please enter token in, token out, and fee.");
      setSearching(false);
    }
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
      {chainSettings && (
        <div style={{ color: "#00bcd4", fontWeight: 800, fontSize: "1.1em", marginBottom: 4 }}>
          Connected to: {chainSettings.name}
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: "1.2em", marginBottom: 8 }}>
        All V4 Pools Search
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
        disabled={searching}
      >
        {searching ? "Searching..." : "Search"}
      </button>
      {error && (
        <div style={{ color: "#ff5252", fontWeight: 500, marginTop: 8 }}>
          {error}
        </div>
      )}
      {searchResults.length > 0 && (
        <div style={{ width: "100%", marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#00bcd4" }}>Found Pools:</div>
          {searchResults.map(pool => (
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
              {pool.label}
            </div>
          ))}
        </div>
      )}
      <div style={{ color: "#aaa", fontWeight: 400, fontSize: "0.95em", marginTop: 12 }}>
        (Search uses mock data. SDK integration coming soon.)
      </div>
    </div>
  );
};

export default AllV4PoolsBlock;