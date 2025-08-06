import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedPool } from "../store";
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

const PoolInfoBlock: React.FC<PoolInfoBlockProps> = ({ pool }) => {
  const dispatch = useDispatch();
  // Optionally, you could show the last search state here using useSelector((state: RootState) => state.poolSearch)
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