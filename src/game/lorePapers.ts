import type { Room } from '../core/floor';
import { ordinaryEnvironmentCoordinateHash } from './environmentAssets';

export interface LorePaperDocument {
  id: string;
  floor: number;
  title: string;
  content: string;
}

export interface LorePaperPlacement {
  x: number;
  y: number;
  document: LorePaperDocument;
}

/** Optional, non-authoritative story fragments; no identities or puzzle answers are exposed. */
export const OPTIONAL_LORE_DOCUMENTS: Readonly<Record<number, readonly LorePaperDocument[]>> = {
  4: [
    { id: 'f4-maintenance-request', floor: 4, title: 'UNANSWERED MAINTENANCE REQUEST', content: 'Hall light outside 4B has been out since the alarm test. The work order says “completed.” No one came upstairs.' },
    { id: 'f4-resident-notice', floor: 4, title: 'NOTICE TO RESIDENTS', content: 'Please use the south stairwell during inspection. This notice was covered after residents reported that the door would not open.' },
  ],
  3: [
    { id: 'f3-tenant-complaint', floor: 3, title: 'TENANT COMPLAINT // COPY', content: 'Water pressure failed again overnight. The office returned the form marked RESOLVED. No one inspected the pipes.' },
    { id: 'f3-handwritten-reminder', floor: 3, title: 'HANDWRITTEN REMINDER', content: 'Keep a copy of every request. They said the first one was never received.' },
  ],
  2: [
    { id: 'f2-records-slip', floor: 2, title: 'RECORDS OFFICE SLIP', content: 'Two versions of the evacuation list were filed under the same date. The tenant copy has fewer entries.' },
    { id: 'f2-maintenance-carbon', floor: 2, title: 'MAINTENANCE CARBON', content: 'Power test logged as complete. Inspector line is blank. Do not file without a name.' },
  ],
  1: [
    { id: 'f1-lobby-notice', floor: 1, title: 'LOBBY NOTICE // RETRACTED', content: 'Management confirms all residents were accounted for. The posted count does not match the names still listed on the mailboxes.' },
    { id: 'f1-unsent-note', floor: 1, title: 'UNSENT NOTE', content: 'I keep writing down who lives here. Someone has to remember us if the files do not.' },
  ],
};

const LORE_PAPERS_PER_FLOOR = 2;
const MIN_NOTE_SPACING = 5;
const MIN_CLEARANCE_FROM_BLOCKED = 3;

/** Selects two spaced, walkable room tiles from geometry only; no simulation RNG or state is touched. */
export function lorePaperPlacements(
  floor: number,
  tiles: readonly (readonly boolean[])[],
  rooms: readonly Room[],
  blockedTiles: ReadonlySet<string>,
): LorePaperPlacement[] {
  const documents = OPTIONAL_LORE_DOCUMENTS[floor];
  if (!documents) return [];

  const roomCandidates = rooms.map((room, roomIndex) => {
    const points: Array<{ x: number; y: number; rank: number }> = [];
    for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
      for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
        if (!tiles[y]?.[x]) continue;
        const clearOfImportant = [...blockedTiles].every(key => {
          const [blockedX, blockedY] = key.split(',').map(Number);
          return Math.abs(x - blockedX) + Math.abs(y - blockedY) >= MIN_CLEARANCE_FROM_BLOCKED;
        });
        if (!clearOfImportant) continue;
        points.push({ x, y, rank: ordinaryEnvironmentCoordinateHash(floor + 101, x + roomIndex * 31, y) });
      }
    }
    points.sort((a, b) => a.rank - b.rank || a.y - b.y || a.x - b.x);
    return {
      roomIndex,
      rank: ordinaryEnvironmentCoordinateHash(floor + 103, room.x + room.width, room.y + roomIndex * 17),
      points,
    };
  }).filter(room => room.points.length > 0)
    .sort((a, b) => a.rank - b.rank || a.roomIndex - b.roomIndex);

  const placements: LorePaperPlacement[] = [];
  for (const room of roomCandidates) {
    const point = room.points.find(candidate => placements.every(placed =>
      Math.abs(candidate.x - placed.x) + Math.abs(candidate.y - placed.y) >= MIN_NOTE_SPACING));
    if (!point) continue;
    placements.push({ x: point.x, y: point.y, document: documents[placements.length] });
    if (placements.length >= LORE_PAPERS_PER_FLOOR) break;
  }
  return placements;
}
