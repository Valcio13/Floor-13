import type { Floor } from '../core/floor';
import { getAuthoredClueForSearchId } from '../core/clues';

/** Notebook content is a presentation projection of confirmed simulation discoveries. */
export interface NotebookEntry {
  id: string;
  floor: number;
  title: string;
  content: string;
  important: boolean;
}

export interface NotebookJournal {
  seed: string;
  entries: NotebookEntry[];
}

export function notebookEntryForSearch(floor: Floor, searchableIndex: number): NotebookEntry | undefined {
  const searchable = floor.searchables[searchableIndex];
  if (!searchable || searchable.result.type !== 'clue') return undefined;
  const authored = getAuthoredClueForSearchId(searchable.result.id);
  const objectiveStep = searchable.objectiveStep;
  const generated = objectiveStep === undefined ? undefined : floor.puzzle.clueTexts[objectiveStep];
  if (generated) {
    const firstLineBreak = generated.search(/\r?\n/);
    const firstLine = firstLineBreak < 0 ? generated : generated.slice(0, firstLineBreak);
    const colon = firstLine.indexOf(': ');
    const section = firstLine.indexOf(' // ');
    const emDash = firstLine.indexOf(' — ');
    let title: string;
    let content: string;

    if (colon >= 0) {
      title = firstLine.slice(0, colon);
      content = `${firstLine.slice(colon + 2)}${firstLineBreak < 0 ? '' : generated.slice(firstLineBreak)}`.trim();
    } else if (section >= 0) {
      title = firstLine.slice(0, section);
      content = `${firstLine.slice(section + 4)}${firstLineBreak < 0 ? '' : generated.slice(firstLineBreak)}`.trim();
    } else if (firstLineBreak >= 0) {
      title = firstLine;
      content = generated.slice(firstLineBreak).replace(/^\r?\n+/, '').trim();
    } else if (emDash >= 0) {
      title = firstLine.slice(0, emDash);
      content = firstLine.slice(emDash + 3).trim();
    } else {
      title = `${floor.puzzle.title} // EVIDENCE ${(objectiveStep ?? 0) + 1}`;
      content = generated;
    }

    return {
      id: `${floor.puzzle.floor}:${searchableIndex}`,
      floor: floor.puzzle.floor,
      title: title || `${floor.puzzle.title} // EVIDENCE ${(objectiveStep ?? 0) + 1}`,
      content: content || generated,
      important: true,
    };
  }
  if (!authored) return undefined;
  return {
    id: `${floor.puzzle.floor}:${searchableIndex}`,
    floor: floor.puzzle.floor,
    title: authored.title,
    content: authored.content,
    important: false,
  };
}

export function emptyNotebookJournal(seed: bigint | string): NotebookJournal {
  return { seed: seed.toString(), entries: [] };
}

export function addNotebookDiscovery(journal: NotebookJournal, entry: NotebookEntry | undefined): NotebookJournal {
  if (!entry || journal.entries.some(existing => existing.id === entry.id)) return journal;
  return { ...journal, entries: [...journal.entries, entry] };
}

/** The recovery path and live adapter share this event-only collection step. */
export function addNotebookSearchEvents(
  journal: NotebookJournal,
  floor: Floor,
  events: readonly { type: string; index?: number }[],
): NotebookJournal {
  return events.reduce((current, event) => event.type === 'loot_searched' && event.index !== undefined
    ? addNotebookDiscovery(current, notebookEntryForSearch(floor, event.index))
    : current, journal);
}

export function discoveredObjectiveSteps(floor: Floor, searched: readonly boolean[]): Set<number> {
  const steps = new Set<number>();
  for (const index of floor.objectives.searchableIndices) {
    if (searched[index]) {
      const step = floor.searchables[index]?.objectiveStep;
      if (step !== undefined) steps.add(step);
    }
  }
  return steps;
}

