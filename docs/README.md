# Floor 13 documentation

This index separates current operational guidance from historical design notes and audit reports.

## Play and understand the game

- [Puzzle guide](puzzle-guide.md) — controls, clue handling, fallback routes, and floor objectives.
- [Gameplay design](game-design.md) — historical design context; the README and source are authoritative for current behavior.
- [Playtest workflow](playtest.md) — development-only reproduction helpers and manual checks.
- [Investigation UX](investigation-ux.md) — notebook and evidence presentation notes.

## Engineering and replay

- [Architecture overview](../ARCHITECTURE.md)
- [Procedural puzzle progression](procedural-puzzle-progression.md)
- [Run recovery](run-recovery.md)
- [InputLogV2 specification](../INPUT_LOG_V2_SPEC.md)
- [FinalStateV1 specification](../FINAL_STATE_V1_SPEC.md)
- [TX1 run manifest specification](../TX1_RUN_MANIFEST_SPEC.md)
- [Replay audit](../REPLAY_AUDIT_REPORT.md) — historical audit with current-status notes.

## Hemi and release operations

- [Hemi Mainnet deployment preparation](../MAINNET_DEPLOYMENT.md)
- [Historical Hemi integration report](../HEMI_INTEGRATION.md)
- [Release checklist](../RELEASE_CHECKLIST.md)
- [Web3 audit](../WEB3_AUDIT_REPORT.md) — historical findings; do not treat it as current deployment status.

## Art, audio, and provenance

- [Art bible](art-bible.md)
- [Asset specifications](asset-specifications.md)
- [Visual asset provenance](visual-asset-provenance.md)
- [Audio system](audio-system.md)
- [Audio loading audit](audio-loading-audit.md) — historical audit with superseded sections marked in the file.
- [Third-party audio record](audio/THIRD_PARTY_AUDIO.md)

Legal notices and attribution remain at the repository root so they are visible in a GitHub checkout: [CREDITS.md](../CREDITS.md), [ASSET_CREDITS.md](../ASSET_CREDITS.md), and [AUDIO_LICENSES.md](../AUDIO_LICENSES.md).

## Protocol and replay

The protocol specifications stay at the repository root because they are referenced by source comments and external review links. The current game commits player-submitted run and replay hashes; it does not include an independent gameplay verifier.
