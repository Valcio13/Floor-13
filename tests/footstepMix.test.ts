import { describe, expect, it } from 'vitest';
import { BLOCK13_PLAYER_FOOTSTEP_GAIN_SCALE, PLAYER_FOOTSTEP_COOLDOWN_MS, PLAYER_FOOTSTEP_MIN_TICK_INTERVAL, PLAYER_FOOTSTEP_VARIANT_GAINS, playerFootstepVariantGains, shouldPlayFootstep } from '../src/game/footstepMix';

describe('player footstep presentation mix', () => {
  it('keeps footsteps restrained and spaces cues enough to reduce overlap', () => {
    expect(PLAYER_FOOTSTEP_VARIANT_GAINS).toEqual([0.32, 0.49, 0.39]);
    expect(PLAYER_FOOTSTEP_MIN_TICK_INTERVAL).toBe(21);
    expect(PLAYER_FOOTSTEP_COOLDOWN_MS).toBeGreaterThanOrEqual(300);
  });

  it('throttles rapid movement updates without changing movement input', () => {
    expect(shouldPlayFootstep(-100, 0)).toBe(true);
    expect(shouldPlayFootstep(10, 30)).toBe(false);
    expect(shouldPlayFootstep(10, 31)).toBe(true);
    expect(shouldPlayFootstep(10, 31)).toBe(shouldPlayFootstep(10, 31));
  });

  it('attenuates only the player footsteps on Floor 13', () => {
    expect(playerFootstepVariantGains(0)).toEqual(PLAYER_FOOTSTEP_VARIANT_GAINS.map(gain => gain * BLOCK13_PLAYER_FOOTSTEP_GAIN_SCALE));
    expect(playerFootstepVariantGains(4)).toEqual([...PLAYER_FOOTSTEP_VARIANT_GAINS]);
  });
});
