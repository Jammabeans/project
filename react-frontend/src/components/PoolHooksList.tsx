import React from "react";

const PoolHooksList: React.FC = () => {
  // Placeholder for displaying all hooks for a v4 pool
  return (
    <div style={{ marginBottom: 24 }}>
      <h2>Pool Hooks</h2>
      <ul>
        <li>beforeInitialize: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        <li>afterInitialize: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        <li>beforeAddLiquidity: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        <li>afterAddLiquidity: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        <li>beforeRemoveLiquidity: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        <li>afterRemoveLiquidity: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        <li>beforeSwap: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        <li>afterSwap: <span style={{ color: "#888" }}>[hook address or "none"]</span></li>
        {/* ...other hooks */}
      </ul>
    </div>
  );
};

export default PoolHooksList;