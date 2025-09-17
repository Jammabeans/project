#!/usr/bin/env node
// Decode calldata helper for PoolLaunchPad functions
// Usage: node react-frontend/scripts/decodeCalldata.js <calldata-hex>

let ethers;
try {
  ethers = require('ethers');
} catch (e) {
  console.error("ethers not found. Install ethers in this project (npm install ethers) and retry.");
  process.exit(1);
}

const ABI = [
  "function createNewTokenAndInitWithNative(string tokenName,string tokenSymbol,uint256 tokenSupply,uint24 fee,int24 tickSpacing,uint160 sqrtPriceX96,address hooks)",
  "function createSuppliedTokenAndInitWithNative(address existingTokenAddr,uint24 fee,int24 tickSpacing,uint160 sqrtPriceX96,address hooks)",
  "function createNewTokenAndInitWithToken(string tokenName,string tokenSymbol,uint256 tokenSupply,address otherTokenAddr,uint24 fee,int24 tickSpacing,uint160 sqrtPriceX96,address hooks)",
  "function initWithSuppliedTokens(address tokenA,address tokenB,uint24 fee,int24 tickSpacing,uint160 sqrtPriceX96,address hooks)"
];

const data = process.argv[2];
if (!data) {
  console.error("Usage: node react-frontend/scripts/decodeCalldata.js <calldata-hex>");
  process.exit(1);
}

// ethers v6 exports Interface at ethers.Interface; v5 at ethers.utils.Interface
const Interface = ethers.Interface ?? (ethers.utils && ethers.utils.Interface);
if (!Interface) {
  console.error("Unable to find Interface constructor on ethers. Unsupported ethers version.");
  process.exit(1);
}

try {
  const iface = new Interface(ABI);
  const parsed = iface.parseTransaction({ data });
  const a = parsed.args || [];
  const out = {
    name: parsed.name ?? null,
    tokenName: a[0] ? String(a[0]) : null,
    tokenSymbol: a[1] ? String(a[1]) : null,
    tokenSupply: a[2] ? a[2].toString() : null,
    fee: a[3] ? a[3].toString() : null,
    tickSpacing: a[4] ? a[4].toString() : null,
    sqrtPriceX96: a[5] ? a[5].toString() : null,
    hooks: a[6] ? String(a[6]) : null
  };
  console.log(JSON.stringify(out, null, 2));
} catch (e) {
  console.error("Decode failed:", e && e.message ? e.message : e);
  process.exit(1);
}