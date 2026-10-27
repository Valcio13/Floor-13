# Floor 13 documentation

This index separates current operational guidance from historical design notes and audit reports.

## Play and understand the game

- [Puzzle guide](puzzle-guide.md) — controls, clue handling, fallback routes, and floor objectives.
- [Gameplay design](game-design.md) — historical design context; the README and source are authoritative for current behavior.
- [Playtest workflow](playtest.md) — development-only reproduction helpers and manual checks.
- [Investigation UX](investigation-ux.md) — notebook and evidence presentation notes.

## Engineering and replay

- [Architecture overview](architecture/ARCHITECTURE.md)
- [Procedural puzzle progression](procedural-puzzle-progression.md)
- [Run recovery](run-recovery.md)
- [InputLogV2 specification](specs/INPUT_LOG_V2_SPEC.md)
- [FinalStateV1 specification](specs/FINAL_STATE_V1_SPEC.md)
- [TX1 run manifest specification](specs/TX1_RUN_MANIFEST_SPEC.md)
- [Replay audit](audits/REPLAY_AUDIT_REPORT.md) — historical audit with current-status notes.

## Hemi and release operations

- [Hemi Mainnet deployment preparation](hemi/MAINNET_DEPLOYMENT.md)
- [Historical Hemi integration report](hemi/HEMI_INTEGRATION.md)
- [Release checklist](release/RELEASE_CHECKLIST.md)
- [Web3 audit](audits/WEB3_AUDIT_REPORT.md) — historical findings; do not treat it as current deployment status.

## Art, audio, and provenance

- [Art bible](art-bible.md)
- [Asset specifications](asset-specifications.md)
- [Visual asset provenance](visual-asset-provenance.md)
- [Audio system](audio-system.md)
- [Audio loading audit](audio-loading-audit.md) — historical audit with superseded sections marked in the file.
- [Third-party audio record](audio/THIRD_PARTY_AUDIO.md)

Legal notices and attribution are grouped under [docs/credits](credits/): [CREDITS.md](credits/CREDITS.md), [ASSET_CREDITS.md](credits/ASSET_CREDITS.md), and [AUDIO_LICENSES.md](credits/AUDIO_LICENSES.md).

## Protocol and replay

The protocol specifications are grouped under [docs/specs](specs/). The current game commits player-submitted run and replay hashes; it does not include an independent gameplay verifier.
