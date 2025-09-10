import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { getChainSettings } from '../config/chainSettings';

/**
 * useChainSettings
 * Small helper that returns chain settings for the provided chainId or falls back to Redux / env default.
 */

export function useChainSettings(chainId?: number) {
  const reduxChainId = useSelector((s: RootState) => s.wallet.chainId);
  const envDefault = Number(process.env.REACT_APP_DEFAULT_CHAIN_ID);
  const effective = chainId ?? reduxChainId ?? (isNaN(envDefault) ? 1 : envDefault);
  return getChainSettings(effective);
}

export default useChainSettings;