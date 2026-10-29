# Floor 13: The Building That Never Existed

A pixel-art survival horror mystery set inside an abandoned apartment building. Explore dark corridors, uncover evidence, solve puzzles, and survive hostile creatures as you descend through four floors toward an impossible Floor 13. Discover the truth behind an incident erased from official records.

## Overview

An unknown number sends a single message: “Go to the fourth floor.” Investigate the building by searching rooms and corridors, collecting records, and solving a seed-generated puzzle on each stage. Manage health, curse, and flashlight battery while avoiding hostile creatures. The route descends through Floors 4, 3, 2, and 1 before reaching the impossible Floor 13.

## Features

- Seeded procedural exploration across five playable stages: Floors 4, 3, 2, 1, and Floor 13.
- Investigation built around searchable evidence, recovered documents, and a field-notes notebook.
- A distinct, deterministic puzzle on each floor, with fallback routes after repeated failures.
- Survival-horror systems including health, curse, flashlight battery, hostile creatures, and environmental scares.
- Five enemy types: Stalker, Crawler, Watcher, Ambusher, and Mimic.
- Optional Hemi-connected runs that record start and completion commitments on-chain.
- Local play that does not require a wallet or blockchain transaction.

## How to Play

Explore the floor, search marked evidence and containers, read recovered clues in the notebook, and solve the floor objective to unlock the route onward. Avoid enemies, watch your resources, and use the flashlight to navigate dark areas.

| Keyboard | Action |
| --- | --- |
| `W` `A` `S` `D` or arrow keys | Move |
| `E` | Interact, search, confirm, or submit |
| `F` | Toggle flashlight; close a puzzle panel |
| `Tab` | Open the field-notes notebook |
| `Escape` | Pause or close the current panel |
| `Space` | Close an evidence/story panel where shown |

The available controls are also listed in the in-game **How to Play** panel. Reduced Jumpscare Intensity changes presentation only; it does not change game rules or outcomes.

## Play Online

**Public URL:** Not configured. Add the production URL here after hosting is published and verified.

## Local Development

Requirements: Node.js `^20.19.0` or `>=22.12.0`, and npm.

```bash
npm ci
```

Create a local environment file from the example and choose the appropriate Hemi network settings described below. For local play, a wallet address is not required.

```bash
# PowerShell
Copy-Item .env.example .env.local

npm run dev
npm test
npm run build
npm run preview
```

The package scripts are defined in [`package.json`](package.json). `npm run build` runs TypeScript project checks and creates the production build in `dist/`.

## Hemi Integration

Hemi-connected runs use two explicit wallet transactions:

1. **TX1** creates a run manifest containing the game identity and public entropy references. The confirmed `RunStarted` event provides the run ID.
2. **TX2**, requested by the player after the run, records the score, outcome, terminal tick, and hashes of the canonical `InputLogV2` and `FinalStateV1` data.

The contract stores player-submitted commitments. It does **not** execute or replay the game, independently validate the score, or prove that a run was played honestly. Local play uses the same game without wallet transactions.

The configured networks are:

| Network | Chain ID | Contract address | Explorer |
| --- | ---: | --- | --- |
| Hemi Testnet | `743111` | `0xfd12F980daa569f4d60736da4227d1BDC15AF662` | [Testnet Explorer](https://testnet.explorer.hemi.xyz) |
| Hemi Mainnet | `43111` | `0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059` | [RunRegistry on Hemi Explorer](https://explorer.hemi.xyz/address/0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059) |

The frontend configuration maps Mainnet to the address supplied by `VITE_HEMI_MAINNET_CONTRACT_ADDRESS` in [`src/web3/config.ts`](src/web3/config.ts). The address is configured in `.env.example`; a read-only Mainnet RPC query returned deployed bytecode on 2026-10-27. Explorer source verification and a live wallet flow have **not** been confirmed here. Bytecode at an address alone does not prove that it matches this repository's source.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_HEMI_NETWORK` | Selects `testnet` or `mainnet`. The application defaults to Testnet if omitted; production builds use the committed `.env.production` Mainnet settings unless overridden by the host environment. |
| `VITE_HEMI_TESTNET_CONTRACT_ADDRESS` | RunRegistry address for Hemi Testnet. |
| `VITE_HEMI_MAINNET_CONTRACT_ADDRESS` | RunRegistry address for Hemi Mainnet. Required for a Mainnet build. |
| `VITE_ETH_RPC_URL` | Optional Ethereum Mainnet RPC override for entropy retrieval. Public fallback endpoints are configured in the application. |

For a production Mainnet build, configure both values before building:

```env
VITE_HEMI_NETWORK=mainnet
VITE_HEMI_MAINNET_CONTRACT_ADDRESS=0x88b7Ac78c7964a2CbcFC8EC8e7bc9F8d39A3B059
```

Use the matching network and contract address. Do not put private keys, seed phrases, wallet credentials, or other secrets in `VITE_` variables; Vite exposes these values to the browser.

## Technology Stack

- TypeScript, React, and Vite for the menu, wallet layer, and build.
- Phaser 3 for the game presentation.
- Wagmi and viem for EVM wallet connection and Hemi contract calls.
- Solidity and Foundry for the `RunRegistry` contract and its tests.
- Vitest for the application test suite.

## Credits and Third-Party Assets

Project-owned ChatGPT-generated artwork and locally created pixel art are licensed under MIT as described in the [asset credits](docs/credits/ASSET_CREDITS.md) and [visual asset provenance](docs/visual-asset-provenance.md), subject to any applicable third-party input rights. Third-party audio and other external media are not covered by that grant; their sources, modifications, licenses, and attribution are listed in the [audio license records](docs/credits/AUDIO_LICENSES.md) and [third-party audio record](docs/audio/THIRD_PARTY_AUDIO.md). Application dependencies remain under their respective licenses.

## License

The repository's software and project-owned visual artwork are licensed under the MIT License; see [`LICENSE`](LICENSE) and the visual provenance record. This does not grant rights in third-party music, sound effects, or other bundled media, which remain subject to their separately documented terms.

## Documentation

Start at the [documentation index](docs/README.md). Key guides include the [puzzle guide](docs/puzzle-guide.md), [architecture overview](docs/architecture/ARCHITECTURE.md), [Hemi deployment configuration](docs/hemi/MAINNET_DEPLOYMENT.md), [run recovery](docs/run-recovery.md), and [release checklist](docs/release/RELEASE_CHECKLIST.md).
