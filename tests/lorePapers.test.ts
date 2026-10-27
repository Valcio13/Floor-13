import { describe, expect, it } from 'vitest';
import { generateFloor } from '../src/core/floor';
import { lorePaperPlacements, OPTIONAL_LORE_DOCUMENTS } from '../src/game/lorePapers';
import { ordinaryMapDecorationPlacements } from '../src/game/environmentAssets';
import { productionEnvironmentPlacements } from '../src/game/productionEnvironment';

describe('optional environmental lore papers', () => {
  it('provides two deterministic, spaced, walkable papers on ordinary floors only', () => {
    for (const floorNumber of [4, 3, 2, 1]) {
      expect(OPTIONAL_LORE_DOCUMENTS[floorNumber]).toHaveLength(2);
      for (const seed of [17, 53, 121, 0x13f10, 0xabcde123]) {
        const floor = generateFloor(seed, floorNumber);
        const blocked = new Set([
          `${floor.start[0]},${floor.start[1]}`,
          `${floor.key[0]},${floor.key[1]}`,
          `${floor.exit[0]},${floor.exit[1]}`,
          `${floor.puzzleDevice[0]},${floor.puzzleDevice[1]}`,
          ...(floor.puzzleFallbackSite ? [`${floor.puzzleFallbackSite[0]},${floor.puzzleFallbackSite[1]}`] : []),
          ...floor.searchables.map(item => `${item.x},${item.y}`),
          ...floor.doors.map(([x, y]) => `${x},${y}`),
        ]);
        const ordinary = ordinaryMapDecorationPlacements(floorNumber, floor.tiles, floor.doors, blocked);
        for (const item of ordinary) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) blocked.add(`${item.x + dx},${item.y + dy}`);
        }
        const reserved = new Set(ordinary.map(item => `${item.x},${item.y}`));
        const production = productionEnvironmentPlacements(floorNumber, floor.tiles, floor.rooms, floor.doors, blocked, reserved);
        for (const item of production) {
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) blocked.add(`${item.x + dx},${item.y + dy}`);
        }

        const placements = lorePaperPlacements(floorNumber, floor.tiles, floor.rooms, blocked);
        expect(placements).toHaveLength(2);
        expect(placements).toEqual(lorePaperPlacements(floorNumber, floor.tiles, floor.rooms, blocked));
        for (const placement of placements) {
          expect(floor.tiles[placement.y]?.[placement.x]).toBe(true);
          expect(blocked.has(`${placement.x},${placement.y}`)).toBe(false);
          expect(placement.document.floor).toBe(floorNumber);
        }
        const [first, second] = placements;
        expect(Math.abs(first.x - second.x) + Math.abs(first.y - second.y)).toBeGreaterThanOrEqual(5);
      }
    }
    expect(lorePaperPlacements(0, [], [], new Set())).toEqual([]);
  });

  it('keeps the writing optional and free of sender identity or puzzle answers', () => {
    const allDocuments = Object.values(OPTIONAL_LORE_DOCUMENTS).flat();
    expect(allDocuments).toHaveLength(8);
    for (const document of allDocuments) {
      expect(document.title.length).toBeGreaterThan(0);
      expect(document.content.length).toBeLessThan(220);
      expect(document.content.toLowerCase()).not.toContain('the sender is');
      expect(document.content.toLowerCase()).not.toContain('the answer is');
    }
  });
});
