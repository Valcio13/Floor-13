# Floor 13: The Building That Never Existed

**A pixel-art psychological survival horror game about an abandoned apartment building, forgotten records, and a floor that should not exist.**

An unknown message sends the player to the fourth floor. Explore the building's four real floors, recover evidence, solve procedural investigations, manage a failing flashlight, and survive the descent to the impossible Floor 13.

## What you do

- Explore connected, procedurally generated apartment floors.
- Search containers for evidence, supplies, and clues.
- Solve a distinct deterministic puzzle on each floor.
- Read recovered records in the field-notes notebook.
- Manage health, curse, flashlight battery, and enemy encounters.
- Face the Stalker, Crawler, Watcher, Ambusher, and Mimic.
- Finish local runs offline or create an on-chain Hemi run record with explicit wallet transactions.

The normal route is **Floor 4 → Floor 3 → Floor 2 → Floor 1 → Floor 13 → Outside**. The story's major revelations and ending are intentionally kept out of this README.

## Controls

| Input | Action |
| --- | --- |
| `WASD` / arrow keys | Move |
| `F` | Toggle flashlight |
| `E` | Interact with containers, evidence, keys, stairs, and puzzle devices |
| `Tab` | Open the field-notes notebook while playing |
| `Escape` | Pause or close the current panel |

Audio settings and Reduced Jumpscare Intensity are available from the menu and pause screen. Reduced intensity changes presentation only; it does not change simulation timing, damage, or outcomes.

## Hemi integration

Hemi runs bind a player's run to a TX1 manifest containing the game identity and public entropy references. After completion, TX2 records the submitted score, outcome, terminal tick, and hashes of the canonical `InputLogV2` and `FinalStateV1` payloads.

The current contract stores player-submitted commitments. It does **not** independently verify that gameplay was honestly executed, validate the score, or provide an off-chain verifier.

Both networks are supported through the same wallet flow:

| Network | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| Hemi Testnet | `743111` | `https://testnet.rpc.hemi.network/rpc` | [Explorer](https://testnet.explorer.hemi.xyz) |
| Hemi Mainnet | `43111` | `https://rpc.hemi.network/rpc` | [Explorer](https://explorer.hemi.xyz) |

The selected network and matching public RunRegistry address are configured with `VITE_HEMI_NETWORK`, `VITE_HEMI_TESTNET_CONTRACT_ADDRESS`, and `VITE_HEMI_MAINNET_CONTRACT_ADDRESS`. The repository contains configured addresses, but explorer verification and release deployment status must be confirmed separately before claiming a production deployment.

## Run locally

Requirements: Node.js `^20.19.0` or `>=22.12.0` and npm.

```bash
npm ci
copy .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm test
npm run build
npm run dev
```

Local play does not require a wallet. Hemi runs require an injected wallet on the selected Hemi network and enough ETH for the player's explicit transactions. Never place private keys or seed phrases in `VITE_` variables.

To preview the production build:

```bash
npm run preview -- --host 127.0.0.1
```

## Technical foundation

- Phaser 3 presentation with a React/Vite menu and wallet layer.
- A Phaser-free TypeScript `AuthoritativeSimulation` running at a fixed 60 Hz.
- Integer fixed-point positions and deterministic, domain-separated PCG32 streams.
- Canonical `InputLogV2` recording, replay, and `FinalStateV1` result encoding.
- Static collision geometry, deterministic procedural floor generation, and seeded puzzle clues.
- Current rules identity: `floor13-procedural-puzzles-floor-progression-v9-global-horror-feedback-balance`.

The current balance uses a flashlight drain of 5 fixed subunits per simulation tick. Detailed balance values belong in technical documentation rather than the public game overview.

## Documentation

Start with the [documentation index](docs/README.md).

- [Gameplay and puzzle guide](docs/puzzle-guide.md)
- [Architecture overview](ARCHITECTURE.md)
- [Replay and wire-format specifications](docs/README.md#protocol-and-replay)
- [Hemi integration and deployment](MAINNET_DEPLOYMENT.md)
- [Run recovery](docs/run-recovery.md)
- [Testing and release checklist](RELEASE_CHECKLIST.md)
- [Audio, art, and asset provenance](ASSET_CREDITS.md)

Historical audits and implementation reports remain available where they preserve useful context. Their headers identify superseded behavior; current implementation documentation is linked from the index above.

## Credits and licensing

The software is MIT-licensed; see [LICENSE](LICENSE). Bundled pixel art, music, and sound effects have separate rights and attribution requirements. See [CREDITS.md](CREDITS.md), [ASSET_CREDITS.md](ASSET_CREDITS.md), [AUDIO_LICENSES.md](AUDIO_LICENSES.md), and the [third-party audio record](docs/audio/THIRD_PARTY_AUDIO.md).
