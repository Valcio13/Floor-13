import { describe, expect, it } from 'vitest';
import { environmentalLightBrightness, environmentalLightProfile, lampOpenSide, lampSpriteRotation } from '../src/game/proceduralLighting';
import { environmentalLightMaskColor } from '../src/core/visualAtmosphere';

describe('procedural environmental lighting', () => {
  it('orients the fixture diffuser toward each adjacent open side', () => {
    const cases = [
      { side: 'down', tiles: [[false], [true]], x: 0, y: 0, rotation: 0 },
      { side: 'right', tiles: [[false, true]], x: 0, y: 0, rotation: -Math.PI / 2 },
      { side: 'up', tiles: [[true], [false]], x: 0, y: 1, rotation: Math.PI },
      { side: 'left', tiles: [[true, false]], x: 1, y: 0, rotation: Math.PI / 2 },
    ] as const;
    for (const { side, tiles, x, y, rotation } of cases) {
      expect(lampOpenSide(tiles, x, y)).toBe(side);
      expect(lampSpriteRotation(side)).toBe(rotation);
    }
  });

  it('uses a stable default when a fixture has no adjacent open tile', () => {
    expect(lampOpenSide([[false]], 0, 0)).toBeNull();
    expect(lampSpriteRotation(null)).toBe(0);
  });

  it('assigns stable profiles from floor, fixture, and cosmetic seed only', () => {
    const first = environmentalLightProfile(2, 4, 0x12345678);
    expect(environmentalLightProfile(2, 4, 0x12345678)).toEqual(first);
    expect(environmentalLightProfile(2, 5, 0x12345678)).not.toEqual(first);
    expect(['stable', 'dim', 'flickering', 'failing', 'broken']).toContain(first.type);
  });

  it('keeps brightness deterministic and bounded', () => {
    for (const floor of [4, 3, 2, 1, 0]) {
      for (let fixture = 0; fixture < 12; fixture++) {
        const profile = environmentalLightProfile(floor, fixture, 0xfeedcafe);
        for (const tick of [0, 1, 30, 300, 900]) {
          const value = environmentalLightBrightness(profile, tick);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
          expect(environmentalLightBrightness(profile, tick)).toBe(value);
        }
        if (profile.type === 'broken') expect(environmentalLightBrightness(profile, 900)).toBe(0);
        if (profile.type === 'stable' || profile.type === 'dim') {
          expect(environmentalLightBrightness(profile, 0)).toBe(environmentalLightBrightness(profile, 900));
        }
      }
    }
  });

  it('keeps flicker phases visible in the rendered lamp intensity', () => {
    const profile = Array.from({ length: 32 }, (_, fixture) => environmentalLightProfile(1, fixture, 0xfeedcafe))
      .find(candidate => candidate.type === 'flickering');
    expect(profile).toBeDefined();
    if (!profile) return;
    const samples = [0, 6, 12, 18, 60, 120].map(tick => environmentalLightBrightness(profile, tick));
    expect(new Set(samples).size).toBeGreaterThan(1);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.12);
  });

  it('produces floor-specific variety without touching authoritative state', () => {
    for (const floor of [4, 3, 2, 1, 0]) {
      const types = new Set(Array.from({ length: 80 }, (_, fixture) => environmentalLightProfile(floor, fixture, 42).type));
      expect(types.size).toBeGreaterThan(1);
    }
  });

  it('raises local lamp masks for multiply compositing while preserving tint', () => {
    const base = 0x999fa8;
    const mask = environmentalLightMaskColor(base, 0.66);
    expect(mask).toBeGreaterThan(base);
    expect(mask & 0xff).toBeGreaterThan((base & 0xff));
    expect(environmentalLightMaskColor(base, 0)).toBe(base);
    expect(environmentalLightMaskColor(base, 1)).toBe(0xffffff);
  });
});
