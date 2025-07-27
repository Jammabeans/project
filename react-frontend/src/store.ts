import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  account: string | null;
}

const initialWalletState: WalletState = {
  account: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState: initialWalletState,
  reducers: {
    setAccount(state, action: PayloadAction<string | null>) {
      state.account = action.payload;
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

export const { setAccount } = walletSlice.actions;
export const {
  addImplementedPath,
  removeImplementedPath,
  setImplementedPaths,
} = implementedPathsSlice.actions;

export const store = configureStore({
  reducer: {
    wallet: walletSlice.reducer,
    implementedPaths: implementedPathsSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;