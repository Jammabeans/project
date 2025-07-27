import React, { useState } from 'react';

export interface CallContractWithValueHookBlockProps {
  value?: {
    address: string;
    functionName: string;
    callData: string;
    sendMode: 'percent' | 'flat';
    sendAmount: number;
    returnOption: 'none' | 'requireTrue' | 'requireFalse' | '<0' | '>0' | '0';
  };
  onChange?: (value: CallContractWithValueHookBlockProps['value']) => void;
}

const CallContractWithValueHookBlock: React.FC<CallContractWithValueHookBlockProps> = ({
  value = { address: '', functionName: '', callData: '', sendMode: 'percent', sendAmount: 0, returnOption: 'none' },
  onChange,
}) => {
  const [address, setAddress] = useState(value.address);
  const [functionName, setFunctionName] = useState(value.functionName);
  const [callData, setCallData] = useState(value.callData);
  const [sendMode, setSendMode] = useState<'percent' | 'flat'>(value.sendMode);
  const [sendAmount, setSendAmount] = useState<number>(value.sendAmount);
  const [returnOption, setReturnOption] = useState(value.returnOption);

  function handleChange(field: string, val: any) {
    const newValue = {
      address,
      functionName,
      callData,
      sendMode,
      sendAmount,
      returnOption,
      [field]: val,
    };
    if (field === 'address') setAddress(val);
    if (field === 'functionName') setFunctionName(val);
    if (field === 'callData') setCallData(val);
    if (field === 'sendMode') setSendMode(val);
    if (field === 'sendAmount') setSendAmount(val);
    if (field === 'returnOption') setReturnOption(val);
    onChange?.(newValue);
  }

  return (
    <div style={{
      background: '#263238',
      border: '2px solid #ff9800',
      borderRadius: 8,
      padding: '1.2rem 1.5rem',
      marginBottom: 24,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: 6 }}>Call Contract With Value</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Contract Address:
        <input
          type="text"
          value={address}
          onChange={e => handleChange('address', e.target.value)}
          placeholder="0x..."
          style={{ width: 220, marginLeft: 8 }}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Function Name:
        <input
          type="text"
          value={functionName}
          onChange={e => handleChange('functionName', e.target.value)}
          placeholder="functionName"
          style={{ width: 180, marginLeft: 8 }}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Call Data:
        <input
          type="text"
          value={callData}
          onChange={e => handleChange('callData', e.target.value)}
          placeholder="0x..."
          style={{ width: 220, marginLeft: 8 }}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Send Native Token:
        <select value={sendMode} onChange={e => handleChange('sendMode', e.target.value)} style={{ marginLeft: 8 }}>
          <option value="percent">Percent of transaction</option>
          <option value="flat">Flat amount</option>
        </select>
        <input
          type="number"
          value={sendAmount}
          min={0}
          step={sendMode === 'percent' ? 0.01 : 1}
          onChange={e => handleChange('sendAmount', Number(e.target.value))}
          style={{ width: 80, marginLeft: 8 }}
        />
        {sendMode === 'percent' ? '%' : 'native'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Return Option:
        <select
          value={returnOption}
          onChange={e => handleChange('returnOption', e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="none">None</option>
          <option value="requireTrue">Require True</option>
          <option value="requireFalse">Require False</option>
          <option value="<0">{'< 0'}</option>
          <option value=">0">{'> 0'}</option>
          <option value="0">= 0</option>
        </select>
      </label>
    </div>
  );
};

export default CallContractWithValueHookBlock;