import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  account: string | null;
  chainId: number | null;
}

const initialWalletState: WalletState = {
  account: null,
  chainId: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState: initialWalletState,
  reducers: {
    setAccount(state, action: PayloadAction<string | null>) {
      state.account = action.payload;
    },
    setChainId(state, action: PayloadAction<number | null>) {
      state.chainId = action.payload;
    },
  },
});

// --- Implemented Paths Slice ---
interface ImplementedPathsState {
  implementedPaths: string[];
}

const initialImplementedPathsState: ImplementedPathsState = {
  implementedPaths: [],
};

const implementedPathsSlice = createSlice({
  name: 'implementedPaths',
  initialState: initialImplementedPathsState,
  reducers: {
    addImplementedPath(state, action: PayloadAction<string>) {
      if (!state.implementedPaths.includes(action.payload)) {
        state.implementedPaths.push(action.payload);
      }
    },
    removeImplementedPath(state, action: PayloadAction<string>) {
      state.implementedPaths = state.implementedPaths.filter(
        (path) => path !== action.payload
      );
    },
    setImplementedPaths(state, action: PayloadAction<string[]>) {
      state.implementedPaths = action.payload;
    },
  },
});

export const { setAccount, setChainId } = walletSlice.actions;
export const {
  addImplementedPath,
  removeImplementedPath,
  setImplementedPaths,
} = implementedPathsSlice.actions;

// --- Pools Slice ---
export interface PoolInfo {
  id: string;
  feeTier: number;
  liquidity: string;
  token0: { id: string; symbol: string };
  token1: { id: string; symbol: string };
}

interface PoolsState {
  pools: PoolInfo[];
}

const initialPoolsState: PoolsState = {
  pools: [],
};

const poolsSlice = createSlice({
  name: "pools",
  initialState: initialPoolsState,
  reducers: {
    setPools(state, action: PayloadAction<PoolInfo[]>) {
      state.pools = action.payload;
    },
    addPool(state, action: PayloadAction<PoolInfo>) {
      if (!state.pools.find((p) => p.id === action.payload.id)) {
        state.pools.push(action.payload);
      }
    },
    clearPools(state) {
      state.pools = [];
    },
  },
});

export const { setPools, addPool, clearPools } = poolsSlice.actions;

// --- Pool Swaps Slice ---
export interface PoolSwap {
  sender: string;
  amount0: string;
  amount1: string;
  timestamp: string;
  poolId: string;
}

interface PoolSwapsState {
  swapsByPool: { [poolId: string]: PoolSwap[] };
}

const initialPoolSwapsState: PoolSwapsState = {
  swapsByPool: {},
};

const poolSwapsSlice = createSlice({
  name: "poolSwaps",
  initialState: initialPoolSwapsState,
  reducers: {
    setPoolSwaps(state, action: PayloadAction<{ poolId: string; swaps: PoolSwap[] }>) {
      state.swapsByPool[action.payload.poolId] = action.payload.swaps;
    },
    addOrUpdateSwap(state, action: PayloadAction<{ poolId: string; swap: PoolSwap }>) {
      const { poolId, swap } = action.payload;
      if (!state.swapsByPool[poolId]) {
        state.swapsByPool[poolId] = [swap];
      } else {
        const idx = state.swapsByPool[poolId].findIndex(s => s.timestamp === swap.timestamp && s.sender === swap.sender);
        if (idx !== -1) {
          state.swapsByPool[poolId][idx] = swap;
        } else {
          state.swapsByPool[poolId].unshift(swap);
        }
      }
    },
    clearPoolSwaps(state, action: PayloadAction<string>) {
      delete state.swapsByPool[action.payload];
    }
  },
});

export const { setPoolSwaps, addOrUpdateSwap, clearPoolSwaps } = poolSwapsSlice.actions;

// --- Pool Search UI Slice ---
interface PoolSearchState {
  tokenIn: string;
  tokenInMode: "select" | "custom";
  tokenInCustom: string;
  tokenOut: string;
  tokenOutMode: "select" | "custom";
  tokenOutCustom: string;
  selectedPool: PoolInfo | null;
}

const initialPoolSearchState: PoolSearchState = {
  tokenIn: "",
  tokenInMode: "select",
  tokenInCustom: "",
  tokenOut: "",
  tokenOutMode: "select",
  tokenOutCustom: "",
  selectedPool: null,
};

const poolSearchSlice = createSlice({
  name: "poolSearch",
  initialState: initialPoolSearchState,
  reducers: {
    setTokenIn(state, action: PayloadAction<string>) {
      state.tokenIn = action.payload;
    },
    setTokenInMode(state, action: PayloadAction<"select" | "custom">) {
      state.tokenInMode = action.payload;
    },
    setTokenInCustom(state, action: PayloadAction<string>) {
      state.tokenInCustom = action.payload;
    },
    setTokenOut(state, action: PayloadAction<string>) {
      state.tokenOut = action.payload;
    },
    setTokenOutMode(state, action: PayloadAction<"select" | "custom">) {
      state.tokenOutMode = action.payload;
    },
    setTokenOutCustom(state, action: PayloadAction<string>) {
      state.tokenOutCustom = action.payload;
    },
    setSelectedPool(state, action: PayloadAction<PoolInfo | null>) {
      state.selectedPool = action.payload;
    },
    resetPoolSearch(state) {
      state.tokenIn = "";
      state.tokenInMode = "select";
      state.tokenInCustom = "";
      state.tokenOut = "";
      state.tokenOutMode = "select";
      state.tokenOutCustom = "";
      state.selectedPool = null;
    },
    restorePoolSearch(state, action: PayloadAction<Omit<PoolSearchState, "selectedPool">>) {
      state.tokenIn = action.payload.tokenIn;
      state.tokenInMode = action.payload.tokenInMode;
      state.tokenInCustom = action.payload.tokenInCustom;
      state.tokenOut = action.payload.tokenOut;
      state.tokenOutMode = action.payload.tokenOutMode;
      state.tokenOutCustom = action.payload.tokenOutCustom;
    }
  },
});

export const {
  setTokenIn,
  setTokenInMode,
  setTokenInCustom,
  setTokenOut,
  setTokenOutMode,
  setTokenOutCustom,
  setSelectedPool,
  resetPoolSearch,
  restorePoolSearch,
} = poolSearchSlice.actions;

export const store = configureStore({
  reducer: {
    wallet: walletSlice.reducer,
    implementedPaths: implementedPathsSlice.reducer,
    pools: poolsSlice.reducer,
    poolSearch: poolSearchSlice.reducer,
    poolSwaps: poolSwapsSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;