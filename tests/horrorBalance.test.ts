import { describe, expect, it } from 'vitest';
import {
  AuthoritativeSimulation,
  CRAWLER_MAX_CHASE_TICKS,
  FIXED_SCALE,
  STALKER_MAX_HUNT_TICKS,
} from '../src/core/authoritativeSimulation';

const emptyInput = { left: false, right: false, up: false, down: false, flashlight: false, interact: false };

describe('global horror balance tuning', () => {
  it('reduces the Stalker investigation delay while preserving floor progression', () => {
    const expectedTicks = new Map([[3, 162], [2, 216], [1, 270], [0, 324]]);
    for (const [floor, expected] of expectedTicks) {
      const probe = new AuthoritativeSimulation(BigInt(0x1300 + floor), { floor, crawlers: [], watchers: [], ambushers: [], mimics: [] });
      const { x, y } = probe.state;
      const sim = new AuthoritativeSimulation(BigInt(0x1300 + floor), {
        floor, x, y, flashlightOn: false, crawlers: [], watchers: [], ambushers: [], mimics: [],
        stalker: {
          ...probe.state.stalker,
          state: 'roaming', x: x + 100 * FIXED_SCALE, y, targetX: x, targetY: y, ticksRemaining: 0, lastChaseEndTick: -10_000,
        },
      });
      sim.step(emptyInput);
      expect(sim.state.stalker.state).toBe('investigating');
      expect(sim.state.stalker.ticksRemaining).toBe(expected);
    }
  });

  it('keeps pursuit extensions explicit and bounded', () => {
    expect(STALKER_MAX_HUNT_TICKS).toBe(1080);
    expect(CRAWLER_MAX_CHASE_TICKS).toBe(216);
    expect(STALKER_MAX_HUNT_TICKS).toBe(Math.round(900 * 1.2));
    expect(CRAWLER_MAX_CHASE_TICKS).toBe(Math.round(180 * 1.2));
  });
});
