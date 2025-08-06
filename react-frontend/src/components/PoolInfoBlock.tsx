import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedPool, setPoolSwaps } from "../store";
import { useQuery } from "urql";
import { RootState } from "../store";

interface PoolInfoBlockProps {
  pool: {
    id: string;
    feeTier: number;
    liquidity: string;
    token0: { id: string; symbol: string };
    token1: { id: string; symbol: string };
  };
}

const SWAPS_QUERY = `
  query RecentSwaps($pool: String!) {
    swaps(
      orderBy: timestamp,
      orderDirection: desc,
      where: { pool: $pool }
      first: 10
    ) {
      amount0
      amount1
      timestamp
      pool {
        token0 { id symbol }
        token1 { id symbol }
      }
    }
  }
`;

const TOKEN_QUERY = `
  query TokenData($id0: String!, $id1: String!) {
    token0: token(id: $id0) {
      symbol
      name
      decimals
      volumeUSD
      poolCount
    }
    token1: token(id: $id1) {
      symbol
      name
      decimals
      volumeUSD
      poolCount
    }
  }
`;

function formatTimeAgo(unixSeconds: string | number): string {
  const now = Date.now();
  const ts = typeof unixSeconds === "string" ? parseInt(unixSeconds, 10) : unixSeconds;
  if (isNaN(ts)) return "N/A";
  const diffMs = now - ts * 1000;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const PoolInfoBlock: React.FC<PoolInfoBlockProps> = ({ pool }) => {
  const dispatch = useDispatch();
  const swaps = useSelector((state: RootState) => state.poolSwaps.swapsByPool[pool.id] || []);

  // Swaps query
  const [swapsResult] = useQuery({
    query: SWAPS_QUERY,
    variables: { pool: pool.id },
  });

  // Token data query
  const [tokenResult] = useQuery({
    query: TOKEN_QUERY,
    variables: { id0: pool.token0.id, id1: pool.token1.id },
  });

  const { data: swapsData, fetching: swapsFetching, error: swapsError } = swapsResult;
  const { data: tokenData, fetching: tokenFetching, error: tokenError } = tokenResult;

  // Store swaps in Redux when loaded
  useEffect(() => {
    if (swapsData && swapsData.swaps) {
      dispatch(setPoolSwaps({ poolId: pool.id, swaps: swapsData.swaps.map((swap: any) => ({
        ...swap,
        poolId: pool.id
      })) }));
    }
  }, [swapsData, pool.id, dispatch]);

  // Helper to calculate spot price (token1 per token0, always positive)
  function getSpotPrice(amount0: string, amount1: string): string {
    const a0 = Math.abs(parseFloat(amount0));
    const a1 = Math.abs(parseFloat(amount1));
    if (isNaN(a0) || isNaN(a1) || a0 === 0) return "N/A";
    return (a1 / a0).toFixed(6);
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
        maxWidth: 600,
        margin: "0 auto"
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.2em", marginBottom: 8 }}>
        Pool Details
      </div>
      <div>
        <strong>Pool:</strong> {pool.token0.symbol} / {pool.token1.symbol}
      </div>
      <div>
        <strong>Fee Tier:</strong> {pool.feeTier}
      </div>
      <div>
        <strong>Liquidity:</strong> {pool.liquidity}
      </div>
      <div>
        <strong>Pool ID:</strong> {pool.id}
      </div>
      <div>
        <strong>Token0:</strong> {pool.token0.symbol} ({pool.token0.id})
      </div>
      <div>
        <strong>Token1:</strong> {pool.token1.symbol} ({pool.token1.id})
      </div>

      {/* Token Data */}
      <div style={{ width: "100%", marginTop: 12, textAlign: "left" }}>
        <div style={{ fontWeight: 600, color: "#00bcd4" }}>Token Data</div>
        {tokenFetching ? (
          <div>Loading token data...</div>
        ) : tokenError ? (
          <div style={{ color: "#ff5252" }}>Error loading token data</div>
        ) : (
          <>
            <div>
              <strong>{tokenData?.token0?.symbol}:</strong> {tokenData?.token0?.name} | Decimals: {tokenData?.token0?.decimals} | Volume USD: {tokenData?.token0?.volumeUSD} | Pool Count: {tokenData?.token0?.poolCount}
            </div>
            <div>
              <strong>{tokenData?.token1?.symbol}:</strong> {tokenData?.token1?.name} | Decimals: {tokenData?.token1?.decimals} | Volume USD: {tokenData?.token1?.volumeUSD} | Pool Count: {tokenData?.token1?.poolCount}
            </div>
          </>
        )}
      </div>

      {/* Recent Swaps Table */}
      <div style={{ width: "100%", marginTop: 12, textAlign: "left" }}>
        <div style={{ fontWeight: 600, color: "#00bcd4", marginBottom: 8 }}>Recent Swaps</div>
        {swapsFetching && swaps.length === 0 ? (
          <div>Loading swaps...</div>
        ) : swapsError ? (
          <div style={{ color: "#ff5252" }}>Error loading swaps</div>
        ) : swaps.length > 0 ? (
          <table style={{ width: "100%", background: "#181c24", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ color: "#00bcd4", borderBottom: "1px solid #333", padding: "6px" }}>Amount0</th>
                <th style={{ color: "#00bcd4", borderBottom: "1px solid #333", padding: "6px" }}>Amount1</th>
                <th style={{ color: "#00bcd4", borderBottom: "1px solid #333", padding: "6px" }}>Spot Price ({pool.token1.symbol}/{pool.token0.symbol})</th>
                <th style={{ color: "#00bcd4", borderBottom: "1px solid #333", padding: "6px" }}>Time Ago</th>
              </tr>
            </thead>
            <tbody>
              {swaps.map((swap, idx) => (
                <tr key={swap.timestamp + idx} style={{ borderBottom: "1px solid #333" }}>
                  <td style={{ padding: "6px" }}>{swap.amount0}</td>
                  <td style={{ padding: "6px" }}>{swap.amount1}</td>
                  <td style={{ padding: "6px" }}>{getSpotPrice(swap.amount0, swap.amount1)}</td>
                  <td style={{ padding: "6px" }}>{formatTimeAgo(swap.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No recent swaps found.</div>
        )}
      </div>

      <button
        onClick={() => dispatch(setSelectedPool(null))}
        style={{
          marginTop: 16,
          padding: "0.7em 1.2em",
          borderRadius: 6,
          border: "none",
          background: "#00bcd4",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1em",
          cursor: "pointer"
        }}
      >
        Back to Pool Search
      </button>
    </div>
  );
};

export default PoolInfoBlock;