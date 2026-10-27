# Hemi Mainnet Configuration and Deployment Record

This document records the configured Floor 13 RunRegistry Mainnet address and
the steps needed for an independently verified release. This document does
not deploy contracts or broadcast transactions.

## Current status (2026-10-27)

- `src/web3/config.ts` selects Hemi Mainnet chain ID `43111` when
  `VITE_HEMI_NETWORK=mainnet`; it reads the address from
  `VITE_HEMI_MAINNET_CONTRACT_ADDRESS` and does not fall back to Testnet.
- The configured address is `0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059`.
  A read-only `eth_getCode` request to the Hemi Mainnet RPC returned non-empty
  bytecode at this address. This confirms deployed code is present, not that
  its source matches this checkout or that explorer source verification is
  complete.
- The returned bytecode metadata indicates Solidity `0.8.34`; the user's
  verification-page screenshot also showed `0.8.34+commit.80d5c536`. This
  repository's `foundry.toml` currently pins `0.8.24`. Resolve that compiler
  mismatch against the actual deployment record before source verification.
- The deployment transaction hash, deployer, timestamp, optimizer settings,
  and explorer verification status are not confirmed in this repository.
- No deployment or wallet transaction was performed for this audit.

## Network targets

| Target | Chain ID | RPC | Explorer | Contract address |
|---|---:|---|---|---|
| Hemi Testnet | `743111` | `https://testnet.rpc.hemi.network/rpc` | `https://testnet.explorer.hemi.xyz` | `VITE_HEMI_TESTNET_CONTRACT_ADDRESS` |
| Hemi Mainnet | `43111` | `https://rpc.hemi.network/rpc` | `https://explorer.hemi.xyz` | `0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059` |

The network values are maintained separately in `src/web3/config.ts` and in
the Foundry RPC aliases. The selected frontend network is controlled by
`VITE_HEMI_NETWORK=testnet|mainnet`. A mainnet build fails if its contract
address is missing; it never falls back to the testnet address.

## Release verification checklist

- [x] Document that RunRegistry stores player-submitted TX1/TX2
      commitments; it does not independently verify gameplay.
- [ ] Resolve the release checklist blockers and review current dependency
      advisories.
- [ ] Confirm the exact compiler, optimizer settings, and verified source for
      the already deployed contract. Do not infer them from local settings.
- [ ] Install Foundry and confirm the pinned Solidity compiler is available
      before any future contract compilation.
- [ ] Run `forge build` and `forge test` if contract sources change.
- [ ] Confirm the exact game version and rules hash in the release commit.
- [ ] Set `EXPECTED_CHAIN_ID=43111` and `VITE_HEMI_NETWORK=mainnet` only for
      the mainnet release environment.
- [ ] Confirm source verification and a live wallet flow before claiming
      either is complete.

## Compile and test

```powershell
forge build
forge test
```

The current contract has no constructor arguments. `script/Deploy.s.sol`
requires `EXPECTED_CHAIN_ID` and checks `block.chainid` before broadcasting.

## Dry-run and gas preparation

Use a non-broadcast simulation against the explicit target RPC after Foundry
is installed. Do not use a default RPC or omit the expected chain ID.

```powershell
$env:EXPECTED_CHAIN_ID = "43111"
forge script script/Deploy.s.sol:DeployScript `
  --rpc-url hemi_mainnet `
  --gas-estimate `
  --private-key $env:PRIVATE_KEY
```

This command must remain without `--broadcast` during simulation. Keep the
private key in the process environment or a secure signer; never place it in
Vite variables, source files, or this document.

## Deployment command (run only as a separately approved operation)

```powershell
$env:EXPECTED_CHAIN_ID = "43111"
forge script script/Deploy.s.sol:DeployScript `
  --rpc-url hemi_mainnet `
  --broadcast `
  --private-key $env:PRIVATE_KEY
```

Record the resulting values immediately. Do not fill them in from memory or
from an unconfirmed wallet prompt.

## Deployment manifest

Create a release-owned manifest after deployment. Every field must come from
the deployment receipt, compiler output, wallet, or explorer:

```yaml
network: hemi-mainnet
chainId: 43111
contract: RunRegistry
contractAddress: "0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059"
deploymentTransactionHash: ""
deployerAddress: ""
deployedCompilerVersion: "unconfirmed; bytecode metadata indicates 0.8.34"
localFoundryCompilerVersion: "0.8.24"
optimizer: "unconfirmed for deployed bytecode"
bytecodeHash: ""
verificationUrl: ""
deploymentTimestamp: ""
```

Empty and unconfirmed fields are intentional. Do not fabricate addresses,
transaction hashes, timestamps, gas costs, compiler settings, or verification
URLs. The address has bytecode, but the deployment record and explorer source
verification remain incomplete.

## Explorer verification

Verify `RunRegistry.sol` on the Hemi Mainnet explorer using the exact compiler
version and optimizer settings used by Foundry. The contract has no
constructor arguments. Treat verification as incomplete until the explorer
shows the verified source and matching deployed bytecode.

## Frontend release configuration

```env
VITE_HEMI_NETWORK=mainnet
VITE_HEMI_MAINNET_CONTRACT_ADDRESS=0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059
VITE_ETH_RPC_URL=https://ethereum-rpc.publicnode.com
```

Testnet remains independently runnable with:

```env
VITE_HEMI_NETWORK=testnet
VITE_HEMI_TESTNET_CONTRACT_ADDRESS=0xfd12F980daa569f4d60736da4227d1BDC15AF662
```

The frontend selects the matching chain, RPC, explorer, address, wallet
switching target, TX2 validation, and Hemi entropy client from the same
network selection. Local play does not require a wallet.

## Post-deployment smoke tests

Use a dedicated test wallet and explicit user approval for every transaction:

1. Connect on Hemi Mainnet and confirm the wrong-network message on Testnet.
2. Start one Hemi run and confirm the `RunStarted` event and run ID.
3. Confirm the manifest through `getRunManifest`.
4. Complete one run and confirm a single `RunCompleted` event.
5. Refresh during pending TX1 and TX2 and verify recovery blocks duplicate
   submissions until the explorer status is checked.
6. Confirm local play still starts without a wallet.
7. Confirm the explorer shows verified source and the recorded deployment
   address.

RunRegistry is immutable and has no pause or migration mechanism. A contract
defect requires a new deployment and a new frontend address; existing runs
remain at the original address.
