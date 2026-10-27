# Floor 13 — Environment Pack

Per the project owner's provenance statement, this pack's source concept sheet was generated specifically for Floor 13 with ChatGPT image generation. The 50 PNG sprites are crops from that sheet, then processed; **they are separated crops, not newly hand-drawn or independently regenerated sprites.** The sheet is kept as `source_sheet.png`, and the crop bounds are recorded in `manifest.json`.

OpenAI's Terms of Use assign output ownership to the user as between the parties, to the extent permitted by law. The project grants the MIT License to project-owned output, subject to any third-party input restrictions. The terms do not guarantee unique output or clear rights in any source images supplied as inputs. Keep this provenance with the pack and confirm any inputs were authorized.

- `original_crops/`: original dark-background crops, visually faithful to the source sheet.
- `transparent/`: automatic best-effort background removal. Inspect before using; dark object pixels may remain opaque or be removed.
- `manifest.json`: filenames, categories, dimensions, and coordinates within the source image.
- `source_sheet.png`: original concept sheet.
- `preview.jpg`: visual catalog.

## Integration notes

Sprites vary in pixel dimensions and are **not yet normalized to a tile grid**. For the Phaser game, review transparency, trim padding, choose anchors, and scale consistently with existing sprites. The original concept sheet is illustrative, so some crops contain neighboring/background details. Use decorative assets first; assign collision only after reviewing the sprite bounds.
