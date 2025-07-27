export interface ChainSettings {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  poolManagerAddress: string;
  hooksMasterAddress: string;
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
  },
  10: {
    name: "Optimism",
    chainId: 10,
    rpcUrl: `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`,
    explorerUrl: "https://optimistic.etherscan.io",
    poolManagerAddress: "0x0000000000000000000000000000000000000000",
    hooksMasterAddress: "0x0000000000000000000000000000000000000000",
  },
  137: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`,
    explorerUrl: "https://polygonscan.com",
    poolManagerAddress: "0x0000000000000000000000000000000000000000",
    hooksMasterAddress: "0x0000000000000000000000000000000000000000",
  },
  // Add more chains as needed
};

export function getChainSettings(chainId: number): ChainSettings | undefined {
  return CHAIN_SETTINGS[chainId];
}