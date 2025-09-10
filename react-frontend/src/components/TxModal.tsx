import React from 'react';

type TxModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const panelStyle: React.CSSProperties = {
  background: '#0f1113',
  color: '#fff',
  padding: 16,
  borderRadius: 8,
  width: 520,
  maxWidth: '94%',
  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
  border: '1px solid #222',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5em 0.9em',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
};

export default function TxModal({
  open,
  title = 'Confirm Transaction',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: TxModalProps) {
  if (!open) return null;
  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>{title}</strong>
          <button onClick={onCancel} style={{ ...buttonStyle, background: 'transparent', color: '#888' }}>✕</button>
        </div>
        <div style={{ color: '#ddd', fontSize: '0.95em', marginBottom: 12, whiteSpace: 'pre-wrap' }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ ...buttonStyle, background: '#222', color: '#fff' }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ ...buttonStyle, background: '#2e7d32', color: '#fff' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}