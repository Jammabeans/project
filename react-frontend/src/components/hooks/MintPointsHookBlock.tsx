import React, { useState } from 'react';

export interface MintPointsHookBlockProps {
  value?: { mode: 'percent' | 'flat'; amount: number };
  onChange?: (value: { mode: 'percent' | 'flat'; amount: number }) => void;
}

const MintPointsHookBlock: React.FC<MintPointsHookBlockProps> = ({ value = { mode: 'percent', amount: 0 }, onChange }) => {
  const [mode, setMode] = useState<'percent' | 'flat'>(value.mode);
  const [amount, setAmount] = useState<number>(value.amount);

  function handleModeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setMode(e.target.value as 'percent' | 'flat');
    onChange?.({ mode: e.target.value as 'percent' | 'flat', amount });
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setAmount(val);
    onChange?.({ mode, amount: val });
  }

  return (
    <div style={{
      background: '#263238',
      border: '2px solid #4caf50',
      borderRadius: 8,
      padding: '1.2rem 1.5rem',
      marginBottom: 24,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: 6 }}>Mint Points</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Mode:
        <select value={mode} onChange={handleModeChange} style={{ marginLeft: 8 }}>
          <option value="percent">Percent of transaction</option>
          <option value="flat">Flat amount</option>
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Amount:
        <input
          type="number"
          value={amount}
          min={0}
          step={mode === 'percent' ? 0.01 : 1}
          onChange={handleAmountChange}
          style={{ width: 80, marginLeft: 8 }}
        />
        {mode === 'percent' ? '%' : 'points'}
      </label>
    </div>
  );
};

export default MintPointsHookBlock;