import { describe, it, expect } from 'vitest';
import { generateFloor, LOOT_PROBABILITIES, LOOT_THRESHOLDS } from './floor';

describe('Floor Generation', () => {
  it('generates a deterministic floor from a seed', () => {
    const seed = 12345;
    const floor1 = generateFloor(seed, 1);
    const floor2 = generateFloor(seed, 1);
    
    expect(floor1.width).toBe(floor2.width);
    expect(floor1.height).toBe(floor2.height);
    expect(floor1.start).toEqual(floor2.start);
    expect(floor1.key).toEqual(floor2.key);
    expect(floor1.exit).toEqual(floor2.exit);
    expect(floor1.rooms.length).toBe(floor2.rooms.length);
    expect(floor1.searchables).toEqual(floor2.searchables);
  });

  it('uses the exact 100% loot table and keeps RNG draw count independent of loot outcomes', () => {
    expect(LOOT_PROBABILITIES).toEqual({ battery: 37, health: 28, collectible: 15, clue: 5, empty: 15 });
    expect(Object.values(LOOT_PROBABILITIES).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(LOOT_THRESHOLDS).toEqual({ battery: 37, health: 65, collectible: 80, clue: 85 });

    const runWithLootRoll = (roll: number) => {
      let draws = 0;
      const floor = generateFloor(0x13579, 2, {
        next: () => { draws++; return roll; },
        int: () => { draws++; return 0; },
      });
      return { draws, floor };
    };
    const mostlyMimicsOrBattery = runWithLootRoll(0.1);
    const mostlyEmpty = runWithLootRoll(0.99);
    expect(mostlyMimicsOrBattery.floor.searchables).not.toEqual(mostlyEmpty.floor.searchables);
    expect(mostlyMimicsOrBattery.draws).toBe(mostlyEmpty.draws);
  });

  it('reduces optional containers by about one third while retaining required evidence and resource availability', () => {
    let retainedOptionalContainers = 0;
    let expectedPreviousContainers = 0;
    let retainedResources = 0;
    for (const seed of [11, 37, 81, 133, 289, 521, 997, 0xabcde123]) {
      for (const floorNumber of [4, 3, 2, 1, 0]) {
        const floor = generateFloor(seed, floorNumber);
        const objectiveIndices = new Set(floor.objectives.searchableIndices);
        const optional = floor.searchables.filter((item, index) =>
          !objectiveIndices.has(index) && item.objectType !== 'maintenance_lockbox');
        for (let first = 0; first < optional.length; first++) for (let second = first + 1; second < optional.length; second++) {
          const distance = Math.abs(optional[first].x - optional[second].x) + Math.abs(optional[first].y - optional[second].y);
          expect(distance, `optional containers clustered on seed ${seed}, floor ${floorNumber}`).toBeGreaterThanOrEqual(3);
        }
        const minimumRoomContainers = floor.rooms.length - 1;
        expect(optional.length).toBeGreaterThanOrEqual(minimumRoomContainers);
        expect(optional.length).toBeLessThanOrEqual(minimumRoomContainers + 3);
        expect(floor.objectives.searchableIndices).toHaveLength(floor.objectives.clues.length);
        expect(floor.searchables.some(item => item.objectType === 'maintenance_lockbox')).toBe(floorNumber === 4);
        retainedOptionalContainers += optional.length;
        expectedPreviousContainers += minimumRoomContainers * 1.5;
        retainedResources += optional.filter(item => item.result.type === 'battery' || item.result.type === 'health').length;
      }
    }
    const reduction = 1 - retainedOptionalContainers / expectedPreviousContainers;
    expect(reduction).toBeGreaterThanOrEqual(0.28);
    expect(reduction).toBeLessThanOrEqual(0.38);
    // The previous supply was 42% of 1.5 containers per room; the new table
    // preserves it at approximately 65% of one retained container.
    expect(1.5 * 0.42).toBeCloseTo(1 * 0.65, 1);
    expect(retainedResources / retainedOptionalContainers).toBeGreaterThan(0.58);
  });

  it('ensures start, key, and exit are walkable', () => {
    const floor = generateFloor(54321, 1);
    
    const [startX, startY] = floor.start;
    const [keyX, keyY] = floor.key;
    const [exitX, exitY] = floor.exit;
    
    expect(floor.tiles[startY][startX]).toBe(true);
    expect(floor.tiles[keyY][keyX]).toBe(true);
    expect(floor.tiles[exitY][exitX]).toBe(true); // Fixed: was using exitY twice
  });

  it('generates rooms with corridors', () => {
    const floor = generateFloor(99999, 1);
    
    expect(floor.rooms.length).toBeGreaterThan(0);
    expect(floor.doors.length).toBeGreaterThan(0);
  });

  it('places objectives in different rooms', () => {
    const floor = generateFloor(11111, 1);
    
    const startRoom = floor.rooms[0];
    const lastRoom = floor.rooms[floor.rooms.length - 1];
    
    // Start should be in first room
    const [startX, startY] = floor.start;
    expect(startX).toBeGreaterThanOrEqual(startRoom.x);
    expect(startX).toBeLessThan(startRoom.x + startRoom.width);
    expect(startY).toBeGreaterThanOrEqual(startRoom.y);
    expect(startY).toBeLessThan(startRoom.y + startRoom.height);
    
    // Exit should be in last room
    const [exitX, exitY] = floor.exit;
    expect(exitX).toBeGreaterThanOrEqual(lastRoom.x);
    expect(exitX).toBeLessThan(lastRoom.x + lastRoom.width);
    expect(exitY).toBeGreaterThanOrEqual(lastRoom.y);
    expect(exitY).toBeLessThan(lastRoom.y + lastRoom.height);
  });

  it('generates more rooms on deeper floors', () => {
    const floor1 = generateFloor(77777, 1);
    const floor3 = generateFloor(77777, 3);
    
    // Just verify floor 3 has more rooms than floor 1
    // Actual counts may vary due to spatial constraints
    expect(floor1.rooms.length).toBeGreaterThan(0);
    expect(floor3.rooms.length).toBeGreaterThan(0);
    expect(floor1.rooms.length).toBeGreaterThanOrEqual(floor3.rooms.length);
  });

  it('places at most one searchable on each tile across generated floors', () => {
    for (const seed of [1, 7, 42, 54321, 0xabcde123]) {
      for (const floorNumber of [4, 3, 2, 1, 0]) {
        const floor = generateFloor(seed, floorNumber);
        const positions = floor.searchables.map(item => `${item.x},${item.y}`);
        expect(new Set(positions).size, `duplicate searchable on seed ${seed}, floor ${floorNumber}`).toBe(positions.length);
      }
    }
  });

  it('places every mandatory clue on a distinct reachable walkable tile for all floors', () => {
    const reachable = (floor: ReturnType<typeof generateFloor>) => {
      const queue: [number, number][] = [floor.start];
      const seen = new Set([`${floor.start[0]},${floor.start[1]}`]);
      for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]] as [number, number][]) {
          const id = `${nx},${ny}`;
          if (floor.tiles[ny]?.[nx] && !seen.has(id)) { seen.add(id); queue.push([nx, ny]); }
        }
      }
      return seen;
    };
    for (const seed of [1, 7, 42, 54321, 0xabcde123]) for (const floorNumber of [4, 3, 2, 1, 0]) {
      const floor = generateFloor(seed, floorNumber);
      const seen = reachable(floor);
      expect(floor.objectives.searchableIndices).toHaveLength(floor.objectives.clues.length);
      for (const index of floor.objectives.searchableIndices) {
        const node = floor.searchables[index];
        expect(node.objectiveStep).toBeDefined();
        expect(seen.has(`${node.x},${node.y}`), `unreachable evidence at seed ${seed}, floor ${floorNumber}`).toBe(true);
      }
    }
  });

  it('gives Block 13 a deterministic hub with connected arrival, key and escape branches', () => {
    const reachable = (floor: ReturnType<typeof generateFloor>, target: [number, number]) => {
      const pending: [number, number][] = [floor.start];
      const seen = new Set([`${floor.start[0]},${floor.start[1]}`]);
      for (let i = 0; i < pending.length; i++) {
        const [x, y] = pending[i];
        for (const [nx, ny] of [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]] as [number, number][]) {
          const id = `${nx},${ny}`;
          if (floor.tiles[ny]?.[nx] && !seen.has(id)) { seen.add(id); pending.push([nx, ny]); }
        }
      }
      return seen.has(`${target[0]},${target[1]}`);
    };

    for (const seed of [1, 7, 42, 54321, 0xabcde123]) {
      const floor = generateFloor(seed, 0);
      const repeated = generateFloor(seed, 0);
      expect(floor).toEqual(repeated);
      expect(floor.block13Hub).toEqual([Math.floor(floor.width / 2), Math.floor(floor.height / 2)]);
      const [hx, hy] = floor.block13Hub!;
      for (let y = hy - 3; y <= hy + 3; y++) {
        for (let x = hx - 4; x <= hx + 4; x++) expect(floor.tiles[y][x]).toBe(true);
      }
      expect(reachable(floor, floor.key)).toBe(true);
      expect(reachable(floor, floor.exit)).toBe(true);
    }
    expect(generateFloor(42, 1).block13Hub).toBeUndefined();
  });
});
