# Block 13 Asset Credits and Rights Record

This is the current production asset index. Older replacement plans are kept
in the repository as historical notes; they do not describe the shipped art.

## Code and project license

The software is licensed under the MIT License in [LICENSE](../../LICENSE). The
MIT license does not automatically apply to bundled artwork, audio, or other
media. Audio rights and sources are documented separately in
[AUDIO_LICENSES.md](AUDIO_LICENSES.md) and
[docs/audio/THIRD_PARTY_AUDIO.md](../audio/THIRD_PARTY_AUDIO.md).

## Production graphics

The production loader manifests are the authoritative inventory and path
record:

- Player and Stalker: `src/game/playerAssets.ts` and `src/game/stalkerAssets.ts`
- Crawler, Watcher, Mimic, and Ambusher: `src/game/enemyAssets.ts`
- Shared and Block 4–1 environment: `src/game/environmentAssets.ts`
- Block 13 environment: `src/game/block13Assets.ts`
- Victory background: `src/game/narrativeAssets.ts`

The exhaustive file-by-file status is in
[`visual-asset-provenance.md`](../visual-asset-provenance.md). It
includes every PNG under `public/assets`, including runtime purpose, manifest
evidence, creator/source status, license/attribution status, and redistribution
status. All 145 AI-generated images, including the separate 50-image
environment pack and the 89 images whose generator was previously unspecified,
are confirmed by the project owner as generated with ChatGPT. They are recorded
as project-specific output under the applicable OpenAI terms, not downloaded
stock art.

The inventory distinguishes 145 ChatGPT-generated images (56 already recorded
as ChatGPT-generated plus 89 now owner-confirmed) and 20 locally created
environment images. The project grants the MIT License to project-owned
artwork, including these generated images and local script art, to the extent
the project holds those rights and no third-party restrictions apply. OpenAI's
Terms of Use assign output ownership to the user as between the parties, to the
extent permitted by law; they do not guarantee uniqueness or resolve input
rights. The container sprite README now reflects the owner's ChatGPT
confirmation. No file is affirmatively identified as third-party stock. Other
third-party media, including audio, remain under their separate documented
licenses and attribution terms; the artwork MIT grant does not cover them.

## Production audio

Third-party sources and processing are recorded in the two audio documents
linked above. The records identify source pages, creators, license terms, and
the processed game destinations. OpenGameArt source pages identify the listed
Ambusher and music selections as CC0. Pixabay source downloads are covered by
Pixabay's Content License, not automatically CC0; see the official [license
summary](https://pixabay.com/service/license-summary/) and [terms of
service](https://pixabay.com/service/terms/). Keep the source/download records
with the project provenance.

The current runtime audio manifest is `src/core/audioAssetManifest.ts`. Only
processed files under `public/assets/audio/` are loaded by the game; source
recordings under `docs/audio/sources/` are retained for provenance.

## Release rule

Before distributing a release, ensure every external or contributor-provided
asset has an identifiable creator/source and documented permission covering
the intended contest, public repository, and game distribution. Maintain
required notices alongside the shipped game where the applicable license
requires them.

## Investigation and puzzle UI

The Field Journal frame and puzzle-panel treatments are authored directly in
`src/game/scenes/FloorScene.ts` with Phaser drawing primitives and text. They
use no third-party images, fonts, or audio and have no external asset license.
