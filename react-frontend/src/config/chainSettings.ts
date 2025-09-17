export interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
}

export interface ChainSettings {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  // core addresses (some are optional for networks that don't have them)
  poolManagerAddress: string;
  hooksMasterAddress: string;
  accessControlAddress?: string;
  poolLaunchPadAddress?: string;
  create2FactoryAddress?: string;

  // additional on-chain system contracts (optional)
  masterControlAddress?: string;
  feeCollectorAddress?: string;
  gasBankAddress?: string;
  degenPoolAddress?: string;
  settingsAddress?: string;
  shareSplitterAddress?: string;
  bondingAddress?: string;
  prizeBoxAddress?: string;
  shakerAddress?: string;
  pointsCommandAddress?: string;
  bidManagerAddress?: string;

  tokens: TokenInfo[];
  // Add more contract addresses or settings as needed
}

export const CHAIN_SETTINGS: Record<number, ChainSettings> = {
  1: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`,
    explorerUrl: "https://etherscan.io",
    poolManagerAddress: "0x0000000000000000000000000000000000000000",
    hooksMasterAddress: "0x0000000000000000000000000000000000000000",
    tokens: [
      {
        name: "Ether",
        symbol: "ETH",
        address: "0x0000000000000000000000000000000000000000"
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
      },
      {
        name: "Tether USD",
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
      },
      {
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      }
    ]
  },
  10: {
    name: "Optimism",
    chainId: 10,
    rpcUrl: `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`,
    explorerUrl: "https://optimistic.etherscan.io",
    poolManagerAddress: "0x0000000000000000000000000000000000000000",
    hooksMasterAddress: "0x0000000000000000000000000000000000000000",
    tokens: [
      {
        name: "Ether",
        symbol: "ETH",
        address: "0x0000000000000000000000000000000000000000"
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
      },
      {
        name: "Tether USD",
        symbol: "USDT",
        address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"
      }
    ]
  },
  137: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`,
    explorerUrl: "https://polygonscan.com",
    poolManagerAddress: "0x0000000000000000000000000000000000000000",
    hooksMasterAddress: "0x0000000000000000000000000000000000000000",
    tokens: [
      {
        name: "Matic",
        symbol: "MATIC",
        address: "0x0000000000000000000000000000000000001010"
      },
      {
        name: "USD Coin",
        symbol: "USDC",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
      },
      {
        name: "Tether USD",
        symbol: "USDT",
        address: "0xC2132D05D31c914A87C6611C10748AaCbA5aA5c"
      }
    ]
  },
  31337: {
    name: "Local Anvil",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    // manager / pool manager (deployment seed)
    poolManagerAddress: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    // hooks/master placeholder
    hooksMasterAddress: "0xeddc3af69788be7e62068620168ad72aa932bfff",
    // canonical deployed addresses (provided)
    accessControlAddress: "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e",
    poolLaunchPadAddress: "0xa51c1fc2f0d1a1b8494ed1fe312d7c3a78ed91c0",
    masterControlAddress: "0xb00767f80628405db3b78502df410a2aeebdbfff",
    feeCollectorAddress: "0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae",
    gasBankAddress: "0x68b1d87f95878fe05b998f19b66f4baba5de1aed",
    degenPoolAddress: "0x3aa5ebb10dc797cac828524e59a333d0a371443c",
    settingsAddress: "0xa85233c63b9ee964add6f2cffe00fd84eb32338f",
    shareSplitterAddress: "0x4a679253410272dd5232b3ff7cf5dbb88f295319",
    bondingAddress: "0x59b670e9fa9d0a427751af201d676719a970857b",
    prizeBoxAddress: "0x7a2088a1bfc9d81c55368ae168c2c02570cb814f",
    shakerAddress: "0x09635f643e140090a9a8dcd712ed6285858cebef",
    pointsCommandAddress: "0x809d550fca64d94bd9f66e60752a544199cfac3d",
    bidManagerAddress: "0x4c5859f0f772848b2d91f1d83e2fe57935348029",
    // keep the create2Factory value if present
    create2FactoryAddress: "0x7bc06c482dead17c0e297afbc32f6e63d3846650",
    tokens: []
  },
  // Add more chains as needed
};

export function getChainSettings(chainId: number): ChainSettings | undefined {
  return CHAIN_SETTINGS[chainId];
}