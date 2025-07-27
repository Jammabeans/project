import React, { useState } from 'react';

export interface AddFeeHookBlockProps {
  value?: {
    feeType: 'token0' | 'token1' | 'in' | 'out';
    percent: number;
    recipient: string;
  };
  onChange?: (value: { feeType: 'token0' | 'token1' | 'in' | 'out'; percent: number; recipient: string }) => void;
}

const AddFeeHookBlock: React.FC<AddFeeHookBlockProps> = ({
  value = { feeType: 'token0', percent: 0, recipient: '' },
  onChange,
}) => {
  const [feeType, setFeeType] = useState<'token0' | 'token1' | 'in' | 'out'>(value.feeType);
  const [percent, setPercent] = useState<number>(value.percent);
  const [recipient, setRecipient] = useState<string>(value.recipient);

  function handleFeeTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setFeeType(e.target.value as any);
    onChange?.({ feeType: e.target.value as any, percent, recipient });
  }

  function handlePercentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setPercent(val);
    onChange?.({ feeType, percent: val, recipient });
  }

  function handleRecipientChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRecipient(e.target.value);
    onChange?.({ feeType, percent, recipient: e.target.value });
  }

  return (
    <div style={{
      background: '#263238',
      border: '2px solid #2196f3',
      borderRadius: 8,
      padding: '1.2rem 1.5rem',
      marginBottom: 24,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: 6 }}>Add Fee</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Fee Type:
        <select value={feeType} onChange={handleFeeTypeChange} style={{ marginLeft: 8 }}>
          <option value="token0">Token0</option>
          <option value="token1">Token1</option>
          <option value="in">In Token</option>
          <option value="out">Out Token</option>
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Percent:
        <input
          type="number"
          value={percent}
          min={0}
          max={100}
          step={0.01}
          onChange={handlePercentChange}
          style={{ width: 80, marginLeft: 8 }}
        />
        %
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Recipient:
        <input
          type="text"
          value={recipient}
          onChange={handleRecipientChange}
          placeholder="0x..."
          style={{ width: 220, marginLeft: 8 }}
        />
      </label>
    </div>
  );
};

export default AddFeeHookBlock;