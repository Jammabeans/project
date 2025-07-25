# React Frontend – Simple Ethers.js Wallet Connect

This frontend is set up with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [ethers.js](https://docs.ethers.org/), providing a minimal wallet connect experience for Ethereum dApps.

## Features

- Simple "Connect Wallet" button using MetaMask and ethers.js
- Displays the connected wallet address
- Ready for contract integration

## Getting Started

### 1. Install dependencies

```bash
cd react-frontend
yarn install
```

### 2. Start the development server

```bash
yarn start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Connect your wallet

- Click the "Connect Wallet" button.
- Approve the connection in MetaMask.
- Your wallet address will be displayed.

## Next Steps: Contract Integration

To interact with your smart contracts:

1. Import your contract ABI and address into a new component or directly in `App.tsx`.
2. Use ethers.js to create a contract instance and call contract methods.

Example:

```ts
import { ethers } from 'ethers';
// import abi from './abi.json';

const provider = new ethers.BrowserProvider((window as any).ethereum);
const signer = await provider.getSigner();
// const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
```

## Notes

- This setup does not use wagmi or rainbowkit; it is intentionally minimal for custom dApp development.
- For advanced wallet management or multi-wallet support, consider adding libraries as needed.
