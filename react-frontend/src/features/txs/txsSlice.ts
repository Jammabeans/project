import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TxStatus = 'pending' | 'success' | 'failed';

export type TxRecord = {
  id: string; // local id
  hash?: string | null;
  type?: string | null;
  status: TxStatus;
  createdAt: number;
  updatedAt: number;
  error?: string | null;
  meta?: Record<string, any> | null;
};

type TxsState = {
  byId: Record<string, TxRecord>;
  allIds: string[];
};

const initialState: TxsState = {
  byId: {},
  allIds: [],
};

const txsSlice = createSlice({
  name: 'txs',
  initialState,
  reducers: {
    addTx(state, action: PayloadAction<{ id: string; type?: string | null; meta?: Record<string, any> | null; }>) {
      const { id, type = null, meta = null } = action.payload;
      const rec: TxRecord = {
        id,
        hash: null,
        type,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        error: null,
        meta,
      };
      state.byId[id] = rec;
      state.allIds.unshift(id);
    },
    setTxHash(state, action: PayloadAction<{ id: string; hash: string }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      rec.hash = action.payload.hash;
      rec.updatedAt = Date.now();
    },
    setTxSuccess(state, action: PayloadAction<{ id: string }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      rec.status = 'success';
      rec.updatedAt = Date.now();
      rec.error = null;
    },
    setTxFailed(state, action: PayloadAction<{ id: string; error?: string | null }>) {
      const rec = state.byId[action.payload.id];
      if (!rec) return;
      rec.status = 'failed';
      rec.updatedAt = Date.now();
      rec.error = action.payload.error ?? null;
    },
    removeTx(state, action: PayloadAction<{ id: string }>) {
      const id = action.payload.id;
      delete state.byId[id];
      state.allIds = state.allIds.filter(i => i !== id);
    },
    clearAll(state) {
      state.byId = {};
      state.allIds = [];
    },
  },
});

export const { addTx, setTxHash, setTxSuccess, setTxFailed, removeTx, clearAll } = txsSlice.actions;
export default txsSlice.reducer;