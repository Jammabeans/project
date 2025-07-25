import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  account: string | null;
}

const initialState: WalletState = {
  account: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAccount(state, action: PayloadAction<string | null>) {
      state.account = action.payload;
    },
  },
});

export const { setAccount } = walletSlice.actions;

export const store = configureStore({
  reducer: {
    wallet: walletSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;