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
  poolManagerAddress: string;
  hooksMasterAddress: string;
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
  // Add more chains as needed
};

export function getChainSettings(chainId: number): ChainSettings | undefined {
  return CHAIN_SETTINGS[chainId];
}