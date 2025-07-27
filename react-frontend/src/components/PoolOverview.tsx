import React, { useState } from "react";
import { getChainSettings, CHAIN_SETTINGS } from "../config/chainSettings";

const DEFAULT_CHAIN_ID = Number(process.env.REACT_APP_DEFAULT_CHAIN_ID) || 1;
const ALL_CHAINS = Object.values(CHAIN_SETTINGS);

const PoolOverview: React.FC = () => {
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poolData, setPoolData] = useState<any>(null);

  const handleFetch = async () => {
    setError(null);
    setLoading(true);
    setPoolData(null);
    // Placeholder: Here you will add logic to fetch pool data using the v4 SDK, ethers, multicall, etc.
    // For now, just simulate a fetch.
    setTimeout(() => {
      setPoolData({
        address: poolAddress,
        token0: "[token0]",
        token1: "[token1]",
        fee: "[fee]",
        other: "Other metadata...",
      });
      setLoading(false);
    }, 1200);
  };

  const chainSettings = getChainSettings(chainId);

  return (
    <div style={{ marginBottom: 24 }}>
      <h2>Pool Overview</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Chain:
          <select
            value={chainId}
            onChange={e => setChainId(Number(e.target.value))}
            style={{ marginLeft: 8, marginRight: 16 }}
          >
            {ALL_CHAINS.map((c: any) => (
              <option key={c.chainId} value={c.chainId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pool Address:
          <input
            type="text"
            value={poolAddress}
            onChange={e => setPoolAddress(e.target.value)}
            placeholder="0x..."
            style={{ marginLeft: 8, width: 260 }}
          />
        </label>
        <button
          onClick={handleFetch}
          disabled={!poolAddress || loading}
          style={{
            marginLeft: 16,
            padding: "0.5em 1.2em",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
      </div>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      {poolData && (
        <div>
          <p>Pool address: <span style={{ color: "#888" }}>{poolData.address}</span></p>
          <p>Token 0: <span style={{ color: "#888" }}>{poolData.token0}</span></p>
          <p>Token 1: <span style={{ color: "#888" }}>{poolData.token1}</span></p>
          <p>Fee Tier: <span style={{ color: "#888" }}>{poolData.fee}</span></p>
          <p>{poolData.other}</p>
        </div>
      )}
    </div>
  );
};

export default PoolOverview;