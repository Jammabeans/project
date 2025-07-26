export const navStyle = {
  width: 280,
  background: '#23283a',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  padding: '2rem 1.5rem 1rem 1.5rem',
  borderRight: '2px solid #222',
  minHeight: '100vh',
  position: 'fixed' as const,
  left: 0,
  top: 0,
  zIndex: 10,
  overflowY: 'auto' as const,
  marginRight: 40,
};

export const mainStyle = {
  display: 'grid',
  gridTemplateColumns: '280px 0.8fr 320px',
  gap: 48,
  padding: '2.5rem 0',
  paddingLeft: 0,
  paddingRight: 0,
  color: '#fff',
  minHeight: '100vh',
  width: '100vw',
  boxSizing: 'border-box' as const,
};

export const centerColumnStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  width: '100%',
  gridColumn: 2,
  marginLeft: 24,
  marginRight: 24,
};

export const pathEditorStyle = {
  width: '100%',
  background: '#23283a',
  borderRadius: 12,
  padding: '2rem 2.2rem',
  border: '2px solid #333',
  minHeight: 120,
  overflowY: 'auto' as const,
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  zIndex: 1,
};

export const rightPanelStyle = {
  width: '100%',
  maxWidth: 320,
  background: '#23283a',
  borderRadius: 12,
  padding: '2rem 1.2rem',
  border: '2px solid #333',
  minHeight: 400,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  marginLeft: 90,
  marginRight: 16,
  zIndex: 1,
  gridColumn: 3,
};

export const appContainerStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#181c24',
  padding: '0 32px',
};