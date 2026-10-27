# Floor Transition Text Inventory

Updated 2026-10-27 from `FloorScene.ts`, `contestUx.ts`, `narrativeAssets.ts`, and the current epilogue constants. Text below is copied with source capitalization and punctuation.

## Opening: entering Floor 4

**Trigger:** new non-replay, non-recovery run at floor 4, tick 0, when `shouldPlayOpeningCinematic()` returns true. `FloorScene.showOpeningStory()` displays one beat at a time. Each beat lasts 1,700 ms; Space/Enter advances and Escape skips. This is fixed text and fixed authored images.

1. *(empty caption)*
2. `Fourth floor. You need to see this.`
3. *(empty caption)*
4. *(empty caption)*
5. `FLOOR 4`

Source: `src/game/narrativeAssets.ts` (`OPENING_CINEMATIC`), rendered by `src/game/scenes/FloorScene.ts` (`showOpeningStory` / `advanceOpeningStory`).

## Floor 4 → Floor 3

**Trigger:** authoritative `floor_transition` event after the Floor 4 objective is complete and the stairs are used. `completeFloor()` freezes input, fades music/ambience, and restarts the renderer after 2,800 ms. This transition has no dedicated transition text or unlock toast.

The ordinary completion card (`FLOOR 4 COMPLETE!` plus score and battery change) remains visible during the renderer restart.

Source: `src/game/scenes/FloorScene.ts` (`completeFloor()` and floor-transition event handling).

## Floor 3 → Floor 2

**Trigger:** same authoritative stair transition after Floor 3 completion. `blockTransitionBeats()` returns no special beats for this pair, so the generic completion card remains for the 2,800 ms renderer restart.

1. `${playerBlockName(previous.floor)} COMPLETE!` → `FLOOR 3 COMPLETE!`
2. `+<score gain> POINTS\n+<battery gain>% BATTERY`
3. `FLOOR 2 UNLOCKED` (temporary message from the transition event)

The numeric score and battery values are deterministic run-state deltas. The labels are fixed; the values are runtime-generated.

## Floor 2 → Floor 1

**Trigger:** same authoritative stair transition after Floor 2 completion.

1. `FLOOR 2 COMPLETE!`
2. `+<score gain> POINTS\n+<battery gain>% BATTERY`
3. `FLOOR 1 UNLOCKED`

No special fakeout sequence is defined for this pair.

## Floor 1 → Floor 13

**Trigger:** same authoritative transition after Floor 1 completion. This pair uses the special transition beats.

1. `FLOOR 1`
2. `GROUND FLOOR`
3. `…`
4. `ROUTE NOT FOUND` (glitch styling)
5. `…`
6. `FLOOR 13`
7. `THIS FLOOR DOES NOT EXIST.`

The renderer is restarted after 2,800 ms; the next scene also calls `playBlock13Arrival()`, which briefly displays:

`FLOOR 13\nRECOVER THE FINAL MEMORY`

Source: `blockTransitionBeats(1, 0)` and `FloorScene.playBlock13Arrival()`.

## Floor 13 final memory and ending

The completion event first shows the generic completion/score card, then records the final notebook revelations and displays the temporary message `THE MEMORY WILL NOT STAY BURIED.` The win-only epilogue is then player-advanceable (Space/Enter/click) and also advances on its fixed timer. Escape skips it.

The fixed epilogue order is:

1. `You push through the final door.`
2. `For the first time tonight...`
3. `everything is quiet.`
4. *(empty)*
5. `12:13 AM`
6. `Cold air fills your lungs.`
7. `You're outside.`
8. *(empty)*
9. `OFFICIAL PROPERTY RECORD`
10. `REGISTERED FLOORS: 4`
11. `RECORDED FATALITIES: 0`
12. `INCIDENT REPORT: NONE`
13. *(empty)*
14. `But you remember the hallway.`
15. `The thing that followed you.`
16. `The door marked 13.`
17. `You look back.`
18. *(empty)*
19. *(empty; blackout visual)*
20. `There is no Floor 13.`
21. `FLOOR 13: THE BUILDING THAT NEVER EXISTED`
22. `They erased the people. Not what happened to them.`
23. *(empty)*

Durations and visual flags are defined in `src/game/contestUx.ts` (`VICTORY_EPILOGUE`); rendering and input behavior are in `FloorScene.beginVictoryEpilogue()`, `showVictoryEpilogueBeat()`, and `finishVictoryEpilogue()`.

## Duplication / inconsistency notes

- The Floor 4 → 3 and Floor 1 → 13 pairs have bespoke beats; 3 → 2 and 2 → 1 use only the generic completion card plus the temporary unlock message.
- The Floor 1 → 13 transition has both `FLOOR 13` in the fakeout sequence and the next-scene arrival card by design.
- The old `docs/audio-loading-audit.md` is historical and describes a pre-preload implementation; it is not a current transition or audio source of truth.
