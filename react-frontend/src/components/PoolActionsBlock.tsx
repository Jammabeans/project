import React, { useState } from "react";
// import { Pool, Trade, ... } from "@uniswap/v4-sdk"; // Uncomment when using SDK

type PoolAction = "addLiquidity" | "trade";

interface ExtraData {
  [key: string]: string;
}

const PoolActionsBlock: React.FC = () => {
  const [action, setAction] = useState<PoolAction>("addLiquidity");
  const [amount, setAmount] = useState("");
  const [extraData, setExtraData] = useState<ExtraData>({});

  // Handler for extra data (hook payloads)
  const handleExtraDataChange = (key: string, value: string) => {
    setExtraData(prev => ({ ...prev, [key]: value }));
  };

  const handleAddLiquidity = () => {
    // TODO: Use Uniswap V4 SDK to add liquidity, passing extraData as needed
    alert("Add liquidity (SDK integration pending)");
  };

  const handleTrade = () => {
    // TODO: Use Uniswap V4 SDK to make a trade, passing extraData as needed
    alert("Trade (SDK integration pending)");
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
        maxWidth: 480,
        margin: "0 auto"
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1.2em", marginBottom: 8 }}>
        Pool Actions
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={() => setAction("addLiquidity")} style={{ fontWeight: action === "addLiquidity" ? 800 : 400 }}>Add Liquidity</button>
        <button onClick={() => setAction("trade")} style={{ fontWeight: action === "trade" ? 800 : 400 }}>Trade</button>
      </div>
      {action === "addLiquidity" && (
        <>
          <label style={{ width: "100%", textAlign: "left" }}>
            Amount
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount to add"
              style={{ width: "100%", padding: "0.5em", borderRadius: 4, border: "1px solid #555", background: "#181c24", color: "#fff" }}
            />
          </label>
          <label style={{ width: "100%", textAlign: "left" }}>
            Extra Data (for hooks)
            <input
              type="text"
              value={extraData["addLiquidity"] || ""}
              onChange={e => handleExtraDataChange("addLiquidity", e.target.value)}
              placeholder="Extra data (hex or JSON)"
              style={{ width: "100%", padding: "0.5em", borderRadius: 4, border: "1px solid #555", background: "#181c24", color: "#fff" }}
            />
          </label>
          <button onClick={handleAddLiquidity} style={{ marginTop: 12 }}>Add Liquidity</button>
        </>
      )}
      {action === "trade" && (
        <>
          <label style={{ width: "100%", textAlign: "left" }}>
            Amount
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount to trade"
              style={{ width: "100%", padding: "0.5em", borderRadius: 4, border: "1px solid #555", background: "#181c24", color: "#fff" }}
            />
          </label>
          <label style={{ width: "100%", textAlign: "left" }}>
            Extra Data (for hooks)
            <input
              type="text"
              value={extraData["trade"] || ""}
              onChange={e => handleExtraDataChange("trade", e.target.value)}
              placeholder="Extra data (hex or JSON)"
              style={{ width: "100%", padding: "0.5em", borderRadius: 4, border: "1px solid #555", background: "#181c24", color: "#fff" }}
            />
          </label>
          <button onClick={handleTrade} style={{ marginTop: 12 }}>Trade</button>
        </>
      )}
    </div>
  );
};

export default PoolActionsBlock;