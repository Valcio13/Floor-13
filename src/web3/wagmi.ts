import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { hemiMainnet, hemiTestnet } from './config';

export const wagmiConfig = createConfig({
  chains: [hemiTestnet, hemiMainnet],
  connectors: [injected()],
  transports: {
    [hemiTestnet.id]: http('https://testnet.rpc.hemi.network/rpc'),
    [hemiMainnet.id]: http('https://rpc.hemi.network/rpc'),
  },
});
