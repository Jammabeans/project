import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { getChainSettings } from "../config/chainSettings";

const AllV4PoolsBlock: React.FC = () => {
  // Get current chainId from wallet state
  const chainId = useSelector((state: RootState) => state.wallet.chainId);
  const chainSettings = chainId ? getChainSettings(chainId) : undefined;
  const tokens = chainSettings?.tokens || [];

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
      <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4 }}>
        Token In Address
        <select
          style={{
            width: "100%",
            padding: "0.5em",
            borderRadius: 4,
            border: "1px solid #555",
            background: "#181c24",
            color: "#fff"
          }}
          disabled={tokens.length === 0}
        >
          <option value="">Select token in</option>
          {tokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} ({token.name})
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4 }}>
        Token Out Address
        <select
          style={{
            width: "100%",
            padding: "0.5em",
            borderRadius: 4,
            border: "1px solid #555",
            background: "#181c24",
            color: "#fff"
          }}
          disabled={tokens.length === 0}
        >
          <option value="">Select token out</option>
          {tokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol} ({token.name})
            </option>
          ))}
        </select>
      </label>
      <div style={{ fontWeight: 500, color: "#aaa", margin: "8px 0" }}>or</div>
      <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 4 }}>
        Pool Key Hash
        <input
          type="text"
          placeholder="Enter pool key hash"
          style={{
            width: "100%",
            padding: "0.5em",
            borderRadius: 4,
            border: "1px solid #555",
            background: "#181c24",
            color: "#fff"
          }}
          disabled
        />
      </label>
      <div style={{ color: "#aaa", fontWeight: 400, fontSize: "0.95em", marginTop: 12 }}>
        {chainSettings
          ? tokens.length > 0
            ? `Prefill options for ${chainSettings.name} loaded.`
            : `No tokens configured for ${chainSettings.name}.`
          : "Connect your wallet to see token options for your chain."}
      </div>
    </div>
  );
};

export default AllV4PoolsBlock;