import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { RunPreparationToasts } from '../src/components/RunPreparationToasts';
import { emptyRunPreparationStages, updateRunPreparationStage } from '../src/game/runPreparation';

describe('run preparation toast stack', () => {
  it('anchors the preparation stack to the safe top-right corner', () => {
    const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
    const stackRule = styles.match(/\.run-toast-stack\s*\{[^}]+\}/)?.[0] ?? '';
    expect(stackRule).toContain('position: fixed');
    expect(stackRule).toContain('top: max(20px');
    expect(stackRule).toContain('right: max(20px');
    expect(stackRule).not.toContain('left:');
    expect(styles).toContain('width: min(380px, calc(100vw - 32px))');
  });

  it('shows only actual active, most recent completed, and failed pipeline stages', () => {
    let stages = emptyRunPreparationStages();
    stages = updateRunPreparationStage(stages, 'hemi-reference', 'completed');
    stages = updateRunPreparationStage(stages, 'bitcoin-reference', 'completed');
    stages = updateRunPreparationStage(stages, 'ethereum-reference', 'active');
    stages = updateRunPreparationStage(stages, 'hemi-transaction', 'failed');
    const html = renderToStaticMarkup(<RunPreparationToasts stages={stages} visible />);
    expect(html).toContain('Read Bitcoin block data');
    expect(html).toContain('Read Ethereum block data');
    expect(html).toContain('Find the canonical Hemi transaction');
    expect(html).not.toContain('Read confirmed Hemi block data');
    expect((html.match(/class="run-toast /g) ?? []).length).toBe(3);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('does not render when preparation has ended, leaving countdown and main actions unobstructed', () => {
    expect(renderToStaticMarkup(<RunPreparationToasts stages={emptyRunPreparationStages()} visible={false} />)).toBe('');
  });
});
