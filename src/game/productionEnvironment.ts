import sourceManifest from './data/floor13EnvironmentSourceManifest.json';
import type { Room } from '../core/floor';
import { assetPath } from '../core/assetPath';
import { ordinaryEnvironmentCoordinateHash } from './environmentAssets';

export type EnvironmentPackPlacement = 'floor-prop' | 'floor-decal' | 'wall-prop' | 'excluded';
export type EnvironmentPackAnchor = 'bottom-center' | 'center';

type PlacementRule = {
  placement: Exclude<EnvironmentPackPlacement, 'excluded'>;
  displayWidth: number;
  displayHeight: number;
  anchor: EnvironmentPackAnchor;
};

/**
 * Approved crops are deliberately a subset of the supplied pack: the source
 * sheet has several semantically mismatched crops and opaque background tiles.
 * All 50 source crops remain registered below, but only reviewed assets load.
 */
const APPROVED_PLACEMENT_RULES = {
  // The lamp is loaded for existing flicker fixtures, not scattered as decor.
  ceiling_lamp: { placement: 'wall-prop', displayWidth: 48, displayHeight: 24, anchor: 'center' },
  sofa_green: { placement: 'floor-prop', displayWidth: 52, displayHeight: 30, anchor: 'bottom-center' },
  armchair: { placement: 'floor-prop', displayWidth: 30, displayHeight: 32, anchor: 'bottom-center' },
  coffee_table: { placement: 'floor-prop', displayWidth: 32, displayHeight: 24, anchor: 'bottom-center' },
  bed: { placement: 'floor-prop', displayWidth: 32, displayHeight: 56, anchor: 'bottom-center' },
  dresser: { placement: 'floor-prop', displayWidth: 28, displayHeight: 32, anchor: 'bottom-center' },
  suitcase: { placement: 'floor-prop', displayWidth: 22, displayHeight: 32, anchor: 'bottom-center' },
  rubble_pile: { placement: 'floor-decal', displayWidth: 72, displayHeight: 28, anchor: 'center' },
  broken_planks: { placement: 'floor-decal', displayWidth: 64, displayHeight: 20, anchor: 'center' },
  // Loaded exclusively for the scene-owned, inspectable lore-paper system.
  scattered_papers: { placement: 'floor-decal', displayWidth: 42, displayHeight: 10, anchor: 'center' },
} as const satisfies Record<string, PlacementRule>;

const EXCLUSION_REASONS: Readonly<Record<string, string>> = {
  floor_clean: 'Opaque full-tile crop duplicates the authored floor material.',
  floor_stained: 'Opaque full-tile crop has a baked background and duplicates authored surfaces.',
  floor_dark_patch: 'Transparency extraction removed nearly all source detail; remaining mark is ambiguous.',
  door_wood: 'Decorative door would misrepresent the map’s real passage and transition logic.',
  door_metal: 'Decorative door would misrepresent the map’s real passage and transition logic.',
  door_green: 'Decorative door would misrepresent the map’s real passage and transition logic.',
  door_barricaded: 'Would imply a blocked route where gameplay permits passage.',
  door_steel: 'Decorative door would misrepresent the map’s real passage and transition logic.',
  mailboxes: 'Crop contains unrelated rubble and debris rather than clean mailbox art.',
  floor_directory: 'Crop contains unrelated room props rather than a clean directory sign.',
  fire_extinguisher: 'Crop includes unrelated framed art and plant fragments.',
  exit_sign: 'Crop contains unrelated dark clutter; the sign is not cleanly isolated.',
  noticeboard: 'Crop combines several unrelated objects and cannot read as a noticeboard.',
  dark_floor_stain: 'Crop includes a framed picture and broad source-sheet residue.',
  stairs: 'Could be mistaken for a real stairway or floor transition.',
  barricade: 'Would imply collision or a blocked route; not safe as visual-only clutter.',
  floor_cracked: 'The isolated crop reads like a floor tile fragment and does not blend cleanly with the authored floor.',
  broken_light: 'Could falsely signal a broken gameplay light; existing lamp states already communicate this.',
  hanging_bulb: 'Appears to be a working fixture and could imply lighting behavior that it does not have.',
  fuse_panel: 'Too similar to the real breaker and puzzle panels.',
  pipe_fixture: 'The crop is ambiguous and cannot be reliably wall-anchored in the current map geometry.',
  wardrobe: 'Can be mistaken for a searchable cabinet when scattered outside a furniture grouping.',
  dining_table: 'Its tabletop markings can be mistaken for evidence and its crop perspective differs from the simpler prop set.',
  rug: 'The crop has faint, uneven edges that read as a floating rectangular overlay at native gameplay scale.',
  kitchen_sink: 'The map has no authored kitchen-room metadata to justify sink placement.',
  stove: 'The map has no authored kitchen-room metadata to justify stove placement.',
  refrigerator: 'The map has no authored kitchen-room metadata to justify appliance placement.',
  bathtub: 'The map has no bathroom-room metadata; the crop also retains unrelated fragments.',
  toilet: 'The map has no bathroom-room metadata to justify fixture placement.',
  locker_green: 'Strongly resembles a searchable locker or electrical cabinet.',
  shelf: 'Can be mistaken for a searchable storage unit and has no room-purpose metadata.',
  filing_cabinet: 'Too similar to searchable cabinets and can mislead players into interacting with it.',
  wooden_crate: 'Can be mistaken for a searchable box.',
  storage_chest: 'Can be mistaken for a searchable container.',
  wall_clock: 'Its crop is too small and low-contrast to read clearly at the current zoom.',
  trash_bag: 'The single-bag crop has loose edge fragments; the cleaner grouped debris crop is retained instead.',
  cracked_wall: 'The isolated crop has source-sheet fragments and no reliable wall attachment point.',
  dead_potted_plant: 'The crop has a detached silhouette and its scale/perspective is inconsistent with the furniture set.',
  vent: 'Too small and low-contrast to read reliably; existing wall ventilation art is clearer.',
  trash_bags: 'The crop reads as disconnected fragments at gameplay scale; the cleaner rubble and board pair is used instead.',
};

type SourceAsset = { id: string; category: string; width: number; height: number; transparent_candidate: string };
const sourceAssets = (sourceManifest as { assets: SourceAsset[] }).assets;

export type EnvironmentPackAsset = {
  id: string;
  key: string;
  path: string;
  category: string;
  sourceWidth: number;
  sourceHeight: number;
  placement: EnvironmentPackPlacement;
  displayWidth: number;
  displayHeight: number;
  anchor: EnvironmentPackAnchor;
  exclusionReason?: string;
};

export const FLOOR13_ENVIRONMENT_ASSET_REGISTRY: readonly EnvironmentPackAsset[] = sourceAssets.map(asset => {
  const rule = APPROVED_PLACEMENT_RULES[asset.id as keyof typeof APPROVED_PLACEMENT_RULES];
  const relativePath = asset.transparent_candidate.replace(/^transparent\//, '');
  return {
    id: asset.id,
    key: `f13_environment_${asset.id}`,
    path: assetPath(`sprites/environment/production_pack/${relativePath}`),
    category: asset.category,
    sourceWidth: asset.width,
    sourceHeight: asset.height,
    placement: rule?.placement ?? 'excluded',
    displayWidth: rule?.displayWidth ?? asset.width,
    displayHeight: rule?.displayHeight ?? asset.height,
    anchor: rule?.anchor ?? 'center',
    ...(rule ? {} : { exclusionReason: EXCLUSION_REASONS[asset.id] ?? 'Not approved for isolated in-game decoration.' }),
  };
});

export type EnvironmentPackAssetId = keyof typeof APPROVED_PLACEMENT_RULES;
export const FLOOR13_ENVIRONMENT_APPROVED_ASSETS = FLOOR13_ENVIRONMENT_ASSET_REGISTRY.filter(asset => asset.placement !== 'excluded');
const APPROVED_BY_ID = new Map(FLOOR13_ENVIRONMENT_APPROVED_ASSETS.map(asset => [asset.id, asset]));

export interface ProductionEnvironmentPlacement {
  asset: EnvironmentPackAssetId;
  x: number;
  y: number;
  roomIndex: number;
  rotation: number;
  cluster: 'bedside' | 'lounge' | 'abandoned-corner' | 'impossible-echo';
  displayWidth?: number;
  displayHeight?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface ProductionEnvironmentPlacementMetrics {
  roomCount: number;
  eligibleRoomCount: number;
  attemptedFurnitureGroups: number;
  successfulFurnitureGroups: number;
  placedProps: number;
  corridorCandidates: number;
  placedCorridorDetails: number;
  rejectionReasons: Record<string, number>;
  placementsByRoom: Record<string, number>;
}

type PixelRect = { left: number; top: number; right: number; bottom: number };
type RoomClusterId = 'bedside' | 'lounge' | 'abandoned-corner';
type ClusterMember = { asset: EnvironmentPackAssetId; dx: number; dy: number };
type RoomCluster = {
  id: RoomClusterId;
  members: readonly ClusterMember[];
};

/**
 * The map has geometric Room rectangles but no semantic room labels. These
 * templates therefore use only broad furnished-room geometry. No bathroom,
 * kitchen, archive, or maintenance identity is inferred from floor number.
 */
const ROOM_CLUSTERS: readonly RoomCluster[] = [
  {
    id: 'bedside',
    members: [
      { asset: 'bed', dx: 0, dy: 0 },
      { asset: 'dresser', dx: 1, dy: 0 },
      { asset: 'suitcase', dx: 2, dy: 0 },
    ],
  },
  {
    id: 'lounge',
    members: [
      { asset: 'sofa_green', dx: 0, dy: 0 },
      { asset: 'coffee_table', dx: 0, dy: 1 },
      { asset: 'armchair', dx: 2, dy: 1 },
    ],
  },
  {
    id: 'abandoned-corner',
    members: [
      { asset: 'rubble_pile', dx: 0, dy: 0 },
      { asset: 'broken_planks', dx: 0, dy: 1 },
    ],
  },
  { id: 'bedside', members: [{ asset: 'bed', dx: 0, dy: 0 }, { asset: 'dresser', dx: 1, dy: 0 }] },
  { id: 'lounge', members: [{ asset: 'sofa_green', dx: 0, dy: 0 }, { asset: 'coffee_table', dx: 0, dy: 1 }] },
  { id: 'bedside', members: [{ asset: 'armchair', dx: 0, dy: 0 }, { asset: 'suitcase', dx: 1, dy: 0 }] },
  { id: 'bedside', members: [{ asset: 'dresser', dx: 0, dy: 0 }, { asset: 'suitcase', dx: 1, dy: 0 }] },
  { id: 'bedside', members: [{ asset: 'bed', dx: 0, dy: 0 }] },
  { id: 'lounge', members: [{ asset: 'sofa_green', dx: 0, dy: 0 }] },
  { id: 'abandoned-corner', members: [{ asset: 'rubble_pile', dx: 0, dy: 0 }] },
  { id: 'abandoned-corner', members: [{ asset: 'broken_planks', dx: 0, dy: 0 }] },
];

const MAX_IMPOSSIBLE_ECHO_PROPS = 2;

function rectFor(
  assetId: EnvironmentPackAssetId,
  x: number,
  y: number,
  rotation = 0,
  displayWidth?: number,
  displayHeight?: number,
  offsetX = 0,
  offsetY = 0,
): PixelRect {
  const asset = APPROVED_BY_ID.get(assetId)!;
  const rotated = Math.abs(Math.sin(rotation)) > 0.5;
  const baseWidth = displayWidth ?? asset.displayWidth;
  const baseHeight = displayHeight ?? asset.displayHeight;
  const width = rotated ? baseHeight : baseWidth;
  const height = rotated ? baseWidth : baseHeight;
  const centerX = x * 32 + 16 + offsetX;
  const centerY = y * 32 + 16 + offsetY;
  if (asset.anchor === 'bottom-center' && !rotated) {
    return { left: centerX - width / 2, top: centerY - height, right: centerX + width / 2, bottom: centerY };
  }
  const centerAnchorY = asset.anchor === 'bottom-center' ? centerY - baseHeight / 2 : centerY;
  return { left: centerX - width / 2, top: centerAnchorY - height / 2, right: centerX + width / 2, bottom: centerAnchorY + height / 2 };
}

function rectsOverlap(a: PixelRect, b: PixelRect, gap = 8): boolean {
  return a.left < b.right + gap && a.right + gap > b.left && a.top < b.bottom + gap && a.bottom + gap > b.top;
}

function rectFitsRoom(rect: PixelRect, room: Room): boolean {
  return rect.left >= room.x * 32 + 8 && rect.top >= room.y * 32 + 8
    && rect.right <= (room.x + room.width) * 32 - 8
    && rect.bottom <= (room.y + room.height) * 32 - 8;
}

function roomWallBackingRatio(room: Room, tiles: readonly (readonly boolean[])[]): number {
  let perimeter = 0;
  let wallBacked = 0;
  for (let x = room.x; x < room.x + room.width; x++) {
    perimeter += 2;
    if (!tiles[room.y - 1]?.[x]) wallBacked++;
    if (!tiles[room.y + room.height]?.[x]) wallBacked++;
  }
  for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
    perimeter += 2;
    if (!tiles[y]?.[room.x - 1]) wallBacked++;
    if (!tiles[y]?.[room.x + room.width]) wallBacked++;
  }
  // Corridors may open sections of a room boundary. Require most of its
  // perimeter to remain enclosed so the rule never decorates corridor space.
  return perimeter > 0 ? wallBacked / perimeter : 0;
}

function rectFitsWalkableTiles(rect: PixelRect, tiles: readonly (readonly boolean[])[]): boolean {
  const minX = Math.floor(rect.left / 32), maxX = Math.floor((rect.right - 1) / 32);
  const minY = Math.floor(rect.top / 32), maxY = Math.floor((rect.bottom - 1) / 32);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (!tiles[y]?.[x]) return false;
  return true;
}

function rectTouchesProtected(rect: PixelRect, protectedTiles: ReadonlySet<string>): boolean {
  const minX = Math.floor(rect.left / 32), maxX = Math.floor((rect.right - 1) / 32);
  const minY = Math.floor(rect.top / 32), maxY = Math.floor((rect.bottom - 1) / 32);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (protectedTiles.has(`${x},${y}`)) return true;
  return false;
}

function rectTouchesRoomAisle(rect: PixelRect, room: Room): boolean {
  const minX = Math.floor(rect.left / 32), maxX = Math.floor((rect.right - 1) / 32);
  const minY = Math.floor(rect.top / 32), maxY = Math.floor((rect.bottom - 1) / 32);
  const aisleX = room.x + Math.floor(room.width / 2);
  const aisleY = room.y + Math.floor(room.height / 2);
  return (minX <= aisleX && maxX >= aisleX) || (minY <= aisleY && maxY >= aisleY);
}

function expandProtectedTiles(tiles: ReadonlySet<string>, radius: number): Set<string> {
  const expanded = new Set<string>();
  for (const key of tiles) {
    const [x, y] = key.split(',').map(Number);
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) expanded.add(`${x + dx},${y + dy}`);
  }
  return expanded;
}

function clusterPlacementCandidates(
  room: Room,
  roomIndex: number,
  tiles: readonly (readonly boolean[])[],
  protectedTiles: ReadonlySet<string>,
  occupiedRects: readonly PixelRect[],
  cluster: RoomCluster,
  roomSeed: number,
  onRejection: (reason: string) => void,
): ProductionEnvironmentPlacement[] | null {
  const anchors = [] as Array<{ x: number; y: number; edge: number; rank: number }>;
  for (let y = room.y; y < room.y + room.height; y++) for (let x = room.x; x < room.x + room.width; x++) {
    anchors.push({
      x, y,
      edge: Math.min(x - room.x, room.x + room.width - 1 - x, y - room.y, room.y + room.height - 1 - y),
      rank: ordinaryEnvironmentCoordinateHash(roomSeed, x, y),
    });
  }
  anchors.sort((a, b) => a.edge - b.edge || a.rank - b.rank);

  for (const anchor of anchors) for (const mirror of [false, true]) {
    const localRects: PixelRect[] = [];
    const placements: ProductionEnvironmentPlacement[] = [];
    let valid = true;
    for (const member of cluster.members) {
      const x = mirror ? anchor.x - member.dx : anchor.x + member.dx;
      const y = anchor.y + member.dy;
      const rect = rectFor(member.asset, x, y);
      let rejection: string | undefined;
      if (!rectFitsRoom(rect, room)) rejection = 'room-bounds';
      else if (!rectFitsWalkableTiles(rect, tiles)) rejection = 'non-walkable-footprint';
      else if (rectTouchesProtected(rect, protectedTiles)) rejection = 'protected-object-or-door-clearance';
      else if (rectTouchesRoomAisle(rect, room)) rejection = 'center-route-clearance';
      else if (occupiedRects.some(other => rectsOverlap(rect, other)) || localRects.some(other => rectsOverlap(rect, other))) rejection = 'prop-overlap';
      if (rejection) {
        onRejection(rejection);
        valid = false;
        break;
      }
      localRects.push(rect);
      placements.push({ asset: member.asset, x, y, roomIndex, rotation: 0, cluster: cluster.id });
    }
    if (valid) return placements;
  }
  onRejection('no-safe-anchor');
  return null;
}

/**
 * Coordinate-hashed visual decor. It consumes no gameplay RNG and does not
 * mutate map data. Enclosed room rectangles are the only placement regions;
 * corridors and a one-tile center aisle remain empty.
 */
export function productionEnvironmentPlacements(
  floor: number,
  tiles: readonly (readonly boolean[])[],
  rooms: readonly Room[],
  doors: readonly (readonly [number, number])[],
  protectedTiles: ReadonlySet<string>,
  reservedTiles: ReadonlySet<string> = new Set(),
  metrics?: ProductionEnvironmentPlacementMetrics,
): ProductionEnvironmentPlacement[] {
  if (metrics) {
    metrics.roomCount = rooms.length;
    metrics.eligibleRoomCount = 0;
    metrics.attemptedFurnitureGroups = 0;
    metrics.successfulFurnitureGroups = 0;
    metrics.placedProps = 0;
    metrics.corridorCandidates = 0;
    metrics.placedCorridorDetails = 0;
    metrics.rejectionReasons = {};
    metrics.placementsByRoom = {};
  }
  if (floor < 0 || floor > 4) return [];
  const protectedAndReserved = new Set([...protectedTiles, ...reservedTiles]);
  const excluded = expandProtectedTiles(protectedAndReserved, 0);
  const corridorClearance = expandProtectedTiles(protectedAndReserved, 1);
  const doorBuffer = new Set<string>();
  for (const [x, y] of doors) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) doorBuffer.add(`${x + dx},${y + dy}`);
  const visualProtectedTiles = new Set<string>([...excluded, ...doorBuffer]);
  const results: ProductionEnvironmentPlacement[] = [];
  const occupiedRects: PixelRect[] = [];
  const reject = (reason: string) => {
    if (metrics) metrics.rejectionReasons[reason] = (metrics.rejectionReasons[reason] ?? 0) + 1;
  };
  const roomOrder = rooms.map((room, roomIndex) => ({
    room, roomIndex,
    rank: ordinaryEnvironmentCoordinateHash(floor, room.x + room.width, room.y + roomIndex * 17),
  })).sort((a, b) => a.rank - b.rank || a.roomIndex - b.roomIndex);

  if (floor === 0) {
    // Floor 13 keeps only a couple of displaced echoes, never furniture clusters.
    for (const { room, roomIndex, rank } of roomOrder) {
      if (results.length >= MAX_IMPOSSIBLE_ECHO_PROPS) break;
      if (room.width < 5 || room.height < 4 || roomWallBackingRatio(room, tiles) < 0.4 || rank % 100 >= 55) continue;
      const asset: EnvironmentPackAssetId = (['bed', 'sofa_green', 'armchair'] as const)[(rank >>> 7) % 3];
      const candidates = [
        { x: room.x + 1, y: room.y + 2 },
        { x: room.x + room.width - 2, y: room.y + 2 },
        { x: room.x + 1, y: room.y + room.height - 1 },
        { x: room.x + room.width - 2, y: room.y + room.height - 1 },
      ].sort((a, b) => ordinaryEnvironmentCoordinateHash(floor, a.x + roomIndex * 13, a.y + rank)
        - ordinaryEnvironmentCoordinateHash(floor, b.x + roomIndex * 13, b.y + rank));
      for (const point of candidates) {
        const rotation = ((rank >>> 10) % 4) * (Math.PI / 2);
        const rect = rectFor(asset, point.x, point.y, rotation);
        if (!rectFitsRoom(rect, room) || !rectFitsWalkableTiles(rect, tiles)
          || rectTouchesProtected(rect, visualProtectedTiles) || rectTouchesRoomAisle(rect, room)) { reject('floor13-clearance-or-fit'); continue; }
        results.push({ asset, ...point, roomIndex, rotation, cluster: 'impossible-echo' });
        occupiedRects.push(rect);
        break;
      }
    }
    if (metrics) {
      metrics.eligibleRoomCount = roomOrder.filter(({ room }) => room.width >= 5 && room.height >= 4 && roomWallBackingRatio(room, tiles) >= 0.4).length;
      metrics.placedProps = results.length;
      for (const placement of results) metrics.placementsByRoom[String(placement.roomIndex)] = 1;
    }
    return results;
  }

  const eligibleRooms = roomOrder.filter(({ room }) => room.width >= 5 && room.height >= 4 && roomWallBackingRatio(room, tiles) >= 0.4);
  if (metrics) metrics.eligibleRoomCount = eligibleRooms.length;
  const targetGroups = eligibleRooms.length >= 2 ? Math.max(1, Math.floor(eligibleRooms.length * 0.5)) : eligibleRooms.length;
  let successfulGroups = 0;
  for (const { room, roomIndex, rank } of eligibleRooms) {
    if (successfulGroups >= targetGroups) break;
    const templateStart = (rank >>> 8) % 3;
    let placed = false;
    for (let offset = 0; offset < ROOM_CLUSTERS.length; offset++) {
      const categoryIndex = (templateStart + offset) % 3;
      const category = (['bedside', 'lounge', 'abandoned-corner'] as const)[categoryIndex];
      const categoryArrangements = ROOM_CLUSTERS.filter(arrangement => arrangement.id === category);
      const preferredArrangement = (rank >>> (offset + 3)) % categoryArrangements.length;
      const orderedArrangements = [...categoryArrangements.slice(preferredArrangement), ...categoryArrangements.slice(0, preferredArrangement)];
      for (const cluster of orderedArrangements) {
        if (metrics) metrics.attemptedFurnitureGroups++;
        const placements = clusterPlacementCandidates(room, roomIndex, tiles, visualProtectedTiles, occupiedRects, cluster, rank, reject);
        if (!placements) continue;
        results.push(...placements);
        successfulGroups++;
        placed = true;
        if (metrics) metrics.successfulFurnitureGroups++;
        occupiedRects.push(...placements.map(item => rectFor(item.asset, item.x, item.y, item.rotation)));
        break;
      }
      if (placed) break;
    }
    if (!placed) reject('room-had-no-safe-arrangement');
  }

  // Small, transparent debris marks sit against corridor walls. Their
  // sub-tile footprint leaves the center of the passage unobscured.
  const roomTiles = new Set<string>();
  for (const room of rooms) for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) roomTiles.add(`${x},${y}`);
  }
  const corridorCandidates: Array<{ x: number; y: number; offsetX: number; offsetY: number; rank: number }> = [];
  for (let y = 0; y < tiles.length; y++) for (let x = 0; x < tiles[y].length; x++) {
      if (!tiles[y][x] || roomTiles.has(`${x},${y}`) || corridorClearance.has(`${x},${y}`) || doorBuffer.has(`${x},${y}`)) continue;
    const walls = [
      { dx: 0, dy: -1, ox: 0, oy: -4 }, { dx: 1, dy: 0, ox: 4, oy: 0 },
      { dx: 0, dy: 1, ox: 0, oy: 4 }, { dx: -1, dy: 0, ox: -4, oy: 0 },
    ].filter(side => !tiles[y + side.dy]?.[x + side.dx]);
    const passageNeighbors = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => tiles[y + dy]?.[x + dx]).length;
    if (walls.length === 0 || passageNeighbors < 2) continue;
    const wall = walls[ordinaryEnvironmentCoordinateHash(floor, x, y) % walls.length];
    const debrisSize = ordinaryEnvironmentCoordinateHash(floor + 19, x, y) % 2 === 0
      ? { width: 24, height: 10 }
      : { width: 24, height: 9 };
    const item: ProductionEnvironmentPlacement = {
      asset: ordinaryEnvironmentCoordinateHash(floor + 29, x, y) % 2 === 0 ? 'rubble_pile' : 'broken_planks',
      x, y, roomIndex: -1, rotation: 0, cluster: 'abandoned-corner',
      displayWidth: debrisSize.width, displayHeight: debrisSize.height, offsetX: wall.ox, offsetY: wall.oy,
    };
    const rect = rectFor(item.asset, x, y, 0, item.displayWidth, item.displayHeight, item.offsetX, item.offsetY);
    if (!rectFitsWalkableTiles(rect, tiles) || rectTouchesProtected(rect, corridorClearance) || rectTouchesProtected(rect, doorBuffer)
      || occupiedRects.some(other => rectsOverlap(rect, other, 0))) continue;
    corridorCandidates.push({ x, y, offsetX: wall.ox, offsetY: wall.oy, rank: ordinaryEnvironmentCoordinateHash(floor + 37, x, y) });
  }
  corridorCandidates.sort((a, b) => a.rank - b.rank || a.y - b.y || a.x - b.x);
  if (metrics) metrics.corridorCandidates = corridorCandidates.length;
  const corridorTarget = corridorCandidates.length === 0 ? 0 : Math.min(3, Math.max(1, Math.floor(corridorCandidates.length * 0.08)));
  const corridorRects: PixelRect[] = [];
  let placedCorridors = 0;
  for (const candidate of corridorCandidates) {
    if (placedCorridors >= corridorTarget) break;
    const asset: EnvironmentPackAssetId = ordinaryEnvironmentCoordinateHash(floor + 29, candidate.x, candidate.y) % 2 === 0 ? 'rubble_pile' : 'broken_planks';
    const width = 24, height = asset === 'rubble_pile' ? 10 : 9;
    const rect = rectFor(asset, candidate.x, candidate.y, 0, width, height, candidate.offsetX, candidate.offsetY);
    if (corridorRects.some(other => rectsOverlap(rect, other, 32))) continue;
    results.push({ asset, x: candidate.x, y: candidate.y, roomIndex: -1, rotation: 0, cluster: 'abandoned-corner', displayWidth: width, displayHeight: height, offsetX: candidate.offsetX, offsetY: candidate.offsetY });
    corridorRects.push(rect);
    placedCorridors++;
  }
  if (metrics) {
    metrics.placedProps = results.length;
    metrics.placedCorridorDetails = results.filter(item => item.roomIndex === -1).length;
    for (const placement of results) metrics.placementsByRoom[String(placement.roomIndex)] = (metrics.placementsByRoom[String(placement.roomIndex)] ?? 0) + 1;
  }
  return results;
}
