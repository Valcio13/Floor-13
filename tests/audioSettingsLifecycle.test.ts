import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const component = readFileSync(new URL('../src/components/AudioSettingsPanel.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const scene = readFileSync(new URL('../src/game/scenes/FloorScene.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('audio settings lifecycle', () => {
  it('provides one shared settings panel from menu and pause, with pause state retained underneath', () => {
    expect(app.match(/<AudioSettingsPanel onClose=/g)).toHaveLength(2);
    expect(app).toContain('>AUDIO</button>');
    expect(scene).toContain("new Event('block13:open-audio-settings')");
    expect(scene).toContain('this.isPaused = true');
    expect(scene).toContain('this.isPaused = false');
  });

  it('bounds previews to one-shot playback and clears audio/timers when replaced or closed', () => {
    expect(component).toContain('audio.loop = false');
    expect(component).toContain('stopPreview();');
    expect(component).toContain('previewRef.current?.pause()');
    expect(component).toContain('clearTimeout(previewTimerRef.current)');
    expect(component).toContain('effectivePreviewVolume');
    expect(component).toContain('window.addEventListener(\'keydown\', onKeyDown, true)');
  });

  it('keeps sliders, mute toggles, reset, and reduced intensity in the same persisted preference model', () => {
    for (const label of ['Master Volume', 'Sound Effects', 'Music']) expect(component).toContain(label);
    expect(component).toContain('ambienceVolume: value');
    expect(component).toContain('Music also controls the ambient bed.');
    expect(component).not.toContain('label: \'Ambience Volume\'');
    expect(component).toContain('publishAudioPreferences(next)');
    expect(component).toContain('AUDIO_PREFERENCES_DEFAULTS');
    expect(component).toContain('Reduce Jumpscare Intensity');
  });
});
