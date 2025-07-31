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

export const store = configureStore({
  reducer: {
    wallet: walletSlice.reducer,
    implementedPaths: implementedPathsSlice.reducer,
    pools: poolsSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;