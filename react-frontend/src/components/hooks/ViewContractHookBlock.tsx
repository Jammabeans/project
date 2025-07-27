import React, { useState } from 'react';

export interface ViewContractHookBlockProps {
  value?: {
    address: string;
    functionName: string;
    returnType: string;
  };
  onChange?: (value: ViewContractHookBlockProps['value']) => void;
}

const returnTypes = [
  'uint256',
  'int256',
  'bool',
  'uint24',
  'address',
  'string',
  'bytes32',
  'uint8',
  'int8',
  'uint128',
  'int128',
  'uint64',
  'int64',
  'uint32',
  'int32',
  'bytes',
  'none',
];

const ViewContractHookBlock: React.FC<ViewContractHookBlockProps> = ({
  value = { address: '', functionName: '', returnType: 'uint256' },
  onChange,
}) => {
  const [address, setAddress] = useState(value.address);
  const [functionName, setFunctionName] = useState(value.functionName);
  const [returnType, setReturnType] = useState(value.returnType);

  function handleChange(field: string, val: any) {
    const newValue = {
      address,
      functionName,
      returnType,
      [field]: val,
    };
    if (field === 'address') setAddress(val);
    if (field === 'functionName') setFunctionName(val);
    if (field === 'returnType') setReturnType(val);
    onChange?.(newValue);
  }

  return (
    <div style={{
      background: '#263238',
      border: '2px solid #00bcd4',
      borderRadius: 8,
      padding: '1.2rem 1.5rem',
      marginBottom: 24,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: 6 }}>View Contract</div>
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
        Return Type:
        <select
          value={returnType}
          onChange={e => handleChange('returnType', e.target.value)}
          style={{ marginLeft: 8 }}
        >
          {returnTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default ViewContractHookBlock;