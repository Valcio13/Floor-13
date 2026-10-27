# Environment Asset Integration

## Current art direction

All 50 supplied transparent crops and their original source materials remain preserved under `art-production/floor13-environment-source/`; the 50 transparent PNGs remain under `public/assets/sprites/environment/production_pack/`. The typed registry is `src/game/productionEnvironment.ts`.

Visual review of the actual crops reduced runtime approval from 34 to 10 assets. The crops include several semantic mismatches, incomplete cutouts, and objects that resemble functional game props. Those assets stay in the repository but are excluded from placement. No source art was edited and no new assets were created.

## Retained and adjusted assets

Sizes below are display dimensions in pixels on the 32 px tile grid.

| Registry ID | Display size | Use |
|---|---:|---|
| `ceiling_lamp` | 48 × 24 | Existing seeded lamp fixture positions only; its established flicker alpha remains in control. |
| `bed` | 32 × 56 | Bedside grouping in sufficiently large enclosed rooms. |
| `dresser` | 28 × 32 | Paired with a bed so it reads as furniture rather than a searchable cabinet. |
| `suitcase` | 22 × 32 | Paired with a bed as abandoned belongings. |
| `sofa_green` | 52 × 30 | Lounge grouping in suitable room geometry. |
| `coffee_table` | 32 × 24 | In front of the paired sofa. |
| `armchair` | 30 × 32 | Paired beside the coffee table when the full group fits. |
| `rubble_pile` | 72 × 28 | Paired with broken boards in a room corner. |
| `broken_planks` | 64 × 20 | Paired with rubble as a small abandoned-damage grouping. |
| `scattered_papers` | 42 × 10 | Selected papers are placed as optional, inspectable lore on Floors 4–1. |

`bed`, `dresser`, `suitcase`, `sofa_green`, `coffee_table`, and `armchair` use bottom-center anchors. Floor debris uses center anchors. The lamp uses its existing centered fixture alignment. All environment images retain nearest-neighbor filtering.

## Placement rules

The current `Floor.rooms` data contains rectangles but no residential, bathroom, kitchen, corridor, or maintenance labels. Placement therefore makes no room-purpose guess from the floor number.

- Ordinary floors target furniture in approximately half of geometry-eligible rooms, rather than enforcing a global two-room cap. Eligibility uses the generated room rectangle (at least 5 × 4 tiles) and a 40% wall-backed perimeter; the map does not provide semantic apartment-room labels. A deterministic room ordering spreads candidates across the map. The generator tries complete compositions first, then partial arrangements such as a single bed, sofa, dresser, suitcase, or debris piece.
- Each prop's bounds must fit walkable tiles, avoid protected gameplay objects and the room's center aisle, and avoid other props. The door buffer is one tile. Placement never changes collision or map topology.
- Corridors receive up to three small debris marks per ordinary floor when safe edge cells exist. Rubble and plank crops use a 24 × 10 or 24 × 9 pixel sub-tile footprint, offset four pixels toward an adjacent wall. Door approaches and gameplay objects keep a one-tile clearance, leaving the corridor center unobscured.
- Floor 13 remains intentionally sparse: at most two isolated, rotated furniture echoes, with no corridor debris or complete room cluster.
- Placement uses `ordinaryEnvironmentCoordinateHash` only. It does not read or advance gameplay RNG, change tiles, or create collision.

## Optional lore papers

The same `scattered_papers` crop is used only for eight scene-owned documents, two on each ordinary floor (4, 3, 2, and 1). The placements are selected deterministically from walkable room-interior tiles, spaced apart, and kept clear of doors, gameplay objects, and authored decoration. Approaching a paper displays `[E] READ PAPER`; E opens the existing compact clue/document modal, which closes through its normal controls. A gameplay interaction prompt takes priority when the player is near both a paper and a functional object. Reading a paper changes no authoritative simulation, score, resources, objective progress, replay log, or Hemi commitment. Floor 13 has no optional paper placement.

## Excluded from runtime placement

The remaining 40 crops remain registered with reasons in the typed registry. The strongest exclusions are:

- Green lockers, filing cabinets, shelves, storage chests, and crates can be mistaken for searchable containers; `fuse_panel` can be mistaken for an actual breaker or puzzle panel.
- Bathroom and kitchen fixtures are excluded because the map has no authored room-purpose metadata to place them responsibly.
- Door, stair, and barricade art could misrepresent navigation or collision.
- The grouped trash-bag crop reads as disconnected fragments at gameplay scale; the rubble and board pair is cleaner.
- Several wall, floor, and investigation crops contain source-sheet remnants, poor transparency, or are too small/low-contrast to read clearly.
- Broken lights and bulbs could incorrectly suggest gameplay light states; the existing lamp system already communicates those states.

## Rendering and validation

Props are composed into the existing static map canvas beneath actors and the lightmap. They are visual-only and never enter collision, pathfinding, puzzles, progression, replay commitments, or Hemi flows.

`tests/environmentAssets.test.ts` checks the 50 source files, the 10 approved entries, multiple deterministic seeds across all five floors, room coverage, complete and partial arrangements, corridor details, clear center aisles, sprite bounds, door and interactable clearances, overlap, and unchanged map geometry. `tests/lorePapers.test.ts` checks two deterministic, spaced, walkable lore placements on each ordinary floor and no placement on Floor 13.

## Developer coverage report

Five fixed seeds (`0xF13001`–`0xF13005`) were evaluated per floor using the same protected objects and authored-decoration reservations as runtime. Before this pass, ordinary-floor placements were 0 on Floors 4, 2, and 1, and 3 total props on Floor 3. Floor 13 placed 4 isolated echoes.

| Floor | Generated rooms | Geometry-eligible room samples | Arrangements attempted | Furniture groups placed | Props after | Corridor details |
|---|---:|---:|---:|---:|---:|---:|
| 4 | 41 | 25 | 157 | 11 (44%) | 29 | 15 |
| 3 | 56 | 32 | 82 | 15 (47%) | 36 | 15 |
| 2 | 60 | 29 | 143 | 13 (45%) | 31 | 15 |
| 1 | 65 | 30 | 85 | 15 (50%) | 32 | 15 |
| 13 | 73 | 30 | 0 (isolated echoes) | — | 8 | 0 |

The prior low counts came from the two-group cap combined with large full-cluster requirements, a 58% candidate skip, a two-tile door buffer, and a center-aisle check that excluded whole rows and columns from candidate space. The revised system tries more wall-edge anchors and smaller fallback arrangements, uses a one-tile door buffer, and adds small corridor-edge debris. Aggregate candidate-anchor rejection counts on the 20 ordinary-floor maps were: room bounds 14,864; center-route clearance 5,991; protected-object or door clearance 3,765; prop overlap 332; no safe anchor 413. Eight rooms exhausted all fallback arrangements. These are geometry-candidate counts, not rejected rooms. The generator can collect development metrics for room coverage, attempted/successful arrangements, placed props, corridor candidates, and rejection reasons.

The live browser was unavailable during this pass. Placement tests and this deterministic coverage report verify generated map coverage; manual playtesting should still confirm readability at normal camera zoom and flashlight range.
