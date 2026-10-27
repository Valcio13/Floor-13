# Shared searchable container sprites

The eight 32×32 RGBA PNGs in this folder were supplied by the project owner in
`block13_container_sprites.zip`. The owner confirms that they were generated
with ChatGPT for Floor 13. The original bundled README's “original pixel-drawn”
wording is superseded by that clarification. The project grants the MIT
License to the artwork to the extent it owns the output and subject to any
third-party input restrictions; see the project asset provenance record.

All sprites use transparent backgrounds and nearest-neighbor presentation.
Closed/open pairs are registered in `src/game/environmentAssets.ts` and
preloaded by `BootScene`. Runtime state selection remains presentation-only.
