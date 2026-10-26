import type { RunManifest } from '../core/seedDerivation';
import { getHemiNetworkConfig, hemiNetwork, type HemiNetworkName } from './config';

export function tx2SubmissionBlockReason(
  manifest: RunManifest,
  wallet: { connected: boolean; address?: string; chainId?: number },
  hasUnresolvedTransaction: boolean,
  networkName: HemiNetworkName = hemiNetwork.name,
): string | null {
  const targetNetwork = getHemiNetworkConfig(networkName);
  if (hasUnresolvedTransaction) return 'A transaction is unresolved. Check its status before submitting TX2.';
  if (!wallet.connected || !wallet.address || wallet.address.toLowerCase() !== manifest.player.toLowerCase()) {
    return 'Reconnect the wallet that started this Hemi run before submitting TX2.';
  }
  if (wallet.chainId !== targetNetwork.chain.id) return `Switch to Hemi ${targetNetwork.name === 'mainnet' ? 'Mainnet' : 'Testnet'} before submitting TX2.`;
  return null;
}
