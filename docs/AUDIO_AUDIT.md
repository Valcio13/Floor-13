# Audio Audit

Updated 2026-10-27 from the current manifest, BootScene preload path, AudioDirector, and FloorScene/presentation mappings.

## Runtime facts

`BootScene.loadAudioAssets()` preloads every entry in `AUDIO_ASSET_MANIFEST` (33 entries). The manifest is the runtime allowlist; the larger `AUDIO_ASSET_CATALOG` and `AUDIO_KEYS` tables contain staged/planned names that are intentionally silent when no file is present. `AudioDirector` fails closed for missing keys, and presentation audio is deterministic/cosmetic.

## Release inventory

| Event / purpose | Current asset and use | Exists / status | Release priority |
|---|---|---|---|
| Crawler proximity / chase | `sfx_crawler_skitter_1.ogg`, `_2.ogg`; nearby warning in FloorScene and chase edge in `presentationAudio.ts` | Exists, loaded and used. The base `sfx_crawler_skitter` key selects variants. | READY |
| Crawler attack | No separate attack recording | Missing; damage still has the shared player hurt cue. | OPTIONAL |
| Stalker first visibility | `sfx_stalker_presence.ogg` | Exists, loaded and used positionally. | READY |
| Stalker pursuit | `sfx_stalker_hunt.ogg` | Exists, loaded and used on hunt start and near-miss feedback. | READY |
| Stalker scraping / distant movement / breathing / detected / attack | Planned catalog names (`sfx_stalker_distant_movement`, `sfx_stalker_footsteps`, `sfx_stalker_breathing`, `sfx_stalker_detected`, `sfx_stalker_attack`) | Missing and not loaded. The requested scraping SFX is genuinely absent. | HIGH for scraping; OPTIONAL for the rest |
| Enemy detection / pursuit stinger | `sfx_danger_stinger` and `sfx_stalker_hunt` are referenced by presentation code, but only `sfx_stalker_hunt.ogg` is in the manifest | Danger stinger is missing and fails closed; hunt cue is used. | HIGH if a distinct stinger is desired |
| Player footsteps | `sfx_player_footstep_1.ogg`–`_3.ogg` | Exists, loaded, deterministic variant selection. | READY |
| Flashlight on/off | `sfx_flashlight_on.ogg`, `sfx_flashlight_off.ogg` | Exists, loaded and used. | READY |
| Flashlight flicker / depletion | Planned `sfx_flashlight_flicker`; `sfx_battery_warning.ogg` is referenced but absent | Flicker/depletion-specific files are missing; warning fails closed. | OPTIONAL |
| Battery pickup / health pickup | `sfx_item_pickup.ogg`; planned `sfx_item_heal.ogg` | Pickup exists and is used. Heal asset is missing and fails closed. | OPTIONAL |
| Container opening / evidence handling | `sfx_interaction_search.ogg` | Exists, loaded and used for every search/evidence interaction. No separate open recording. | READY; dedicated open sound OPTIONAL |
| Evidence collection | `sfx_interaction_search.ogg` (clue gain is slightly louder) | Exists and used. | READY |
| Puzzle completion | `sfx_puzzle_solved` maps to `sfx_key_pickup.ogg` | File exists, but this is a reused key-pickup recording rather than a dedicated puzzle-success sound. | HIGH for a distinct cue |
| Key / door / threshold interactions | `sfx_key_pickup.ogg`; floor transition uses `sfx_floor_transition` | Key exists and is used. Locked/unlock/door-specific assets are absent. | READY for progression; OPTIONAL for door detail |
| Floor transition | Planned `sfx_floor_transition.ogg` | Missing from the manifest/files, so transition remains silent apart from visual text and music fades. | HIGH |
| Environmental ambience | `amb_floor_4.ogg`, `amb_floor_3.ogg`, `amb_floor_2.ogg`, `amb_floor_1.ogg`, `amb_block13.ogg` | Exists, loaded as loops and cleaned up on scene transitions. | READY |
| Environmental creaks / fluorescent hum / water | Planned `amb_environment_*`, `amb_room_tone`, `amb_floor_general`, `amb_floor_deep` | Missing and not used by the current floor mixer. | OPTIONAL |
| Light flicker / light jumpscare | `sfx_jumpscare_hit.ogg` | Exists, loaded and used when the deterministic lamp scare fires. | READY |
| Container and Ambusher jumpscares | `sfx_jumpscare_hit.ogg`, `sfx_ambusher_impact.ogg`, `sfx_ambusher_warning.ogg` | Exists and used with cooldown/ducking. | READY |
| Mimic reveal | `sfx_mimic_reveal.ogg` | Exists, loaded and positionally used. | READY |
| Watcher presence / gaze / vanish | `sfx_watcher_presence.ogg`, `sfx_watcher_gaze.ogg`, `sfx_watcher_vanish.ogg` | Exists, loaded and used on state edges. | READY |
| Ambusher warning / impact | `sfx_ambusher_warning.ogg`, `sfx_ambusher_impact.ogg` | Exists, loaded and synchronized to warning/impact presentation. | READY |
| Occasional haunting voice | `sfx_haunting_growl.ogg`, `sfx_haunting_scream.ogg` | Both exist and load; existing whisper events choose deterministically between them. The scream is one in four cues, and Reduced Jumpscare Intensity lowers its gain. | READY; subjective browser mix check pending |
| Main menu / settings UI | No dedicated menu/UI cue; audio settings previews use the existing SFX/music files | No missing required file; UI is intentionally quiet. | OPTIONAL |
| Floor 13 arrival / final chase / escape | Planned `sfx_block13_reveal`, `sfx_final_chase_stinger`; `sfx_escape` is also catalog-only | Arrival and final-chase dedicated cues are missing and fail closed; escape currently has no loaded file. | HIGH for final release polish |
| Death / hurt | `sfx_player_hurt_1.ogg`, `_2.ogg`; planned `sfx_player_death` absent | Hurt variants exist; death cue is missing. | OPTIONAL |

## Missing versus optional

**Genuine release gaps:** a dedicated Stalker scrape/distant movement cue, floor-transition cue, and the final-reveal/final-chase/escape cues are absent. `sfx_puzzle_solved` is present but reuses the key pickup recording. `sfx_danger_stinger` and battery-warning/depletion names are also absent but already fail safely.

**Optional improvements:** separate crawler attack, door open/locked/unlock, heal, UI, environmental creaks, and additional Stalker breathing/attack layers. Do not add placeholder files; add a real recording and a manifest entry together if these are approved later.

## No code change in this inventory

This audit intentionally does not add or download audio. The existing preload and fail-closed behavior remain unchanged.
