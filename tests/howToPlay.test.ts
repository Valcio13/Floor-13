import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const panel = readFileSync(new URL('../src/components/HowToPlayPanel.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('how to play menu panel', () => {
  it('exposes a secondary menu action and mounts the panel without changing run actions', () => {
    expect(app).toContain('HOW TO PLAY');
    expect(app).toContain('>AUDIO</button>');
    expect(app).toContain('>CREDITS</button>');
    expect(app).toContain('menu-secondary-actions');
    expect(app).toContain('<HowToPlayPanel onClose={closeHowToPlay} />');
    expect(app).toContain('setAudioSettingsOpen(false)');
    expect(app).toContain('setCreditsOpen(false)');
  });

  it('documents the implemented player controls and core loop', () => {
    expect(panel).toContain('Explore. Investigate. Survive.');
    expect(panel).toContain('Search apartments and corridors for useful objects and evidence.');
    expect(panel).toContain('Collect clues, review your notebook, and solve puzzles.');
    expect(panel).toContain('Avoid hostile creatures and manage your flashlight battery.');
    expect(panel).toContain('Complete each floor&apos;s objectives to unlock the way forward.');
    for (const control of ['WASD / ARROWS', '>Move<', '>Interact<', '>Flashlight<', '>Notebook<', '>Pause<']) {
      expect(panel).toContain(control);
    }
  });

  it('supports Escape dismissal, focus trapping, and focus restoration', () => {
    expect(panel).toContain('event.key !== \'Escape\'');
    expect(panel).toContain('event.key !== \'Tab\'');
    expect(panel).toContain('previousFocusRef.current?.focus()');
    expect(panel).toContain('aria-modal="true"');
    expect(panel).toContain('aria-label="Close how to play"');
  });
});
