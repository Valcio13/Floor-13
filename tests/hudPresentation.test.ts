import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scene = readFileSync(new URL('../src/game/scenes/FloorScene.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('in-game HUD presentation', () => {
  it('keeps objective and evidence state in the compact left HUD', () => {
    expect(scene).toContain('EVIDENCE  ${objectiveProgress}/${evidenceTotal}');
    expect(scene).toContain('this.block13ObjectiveStatus');
    expect(scene).toContain('this.hudFloorText.setText(floorDisplay)');
    expect(scene).toContain('this.hudEvidenceText.setText(evidenceLine)');
    expect(scene).not.toContain('hudLeftPanel');
    expect(scene).not.toContain('hudRightPanel');
  });

  it('presents health, battery, and flashlight state in the right resource cluster', () => {
    expect(scene).toContain('this.hudRightText.setText');
    expect(scene).toContain('FLASHLIGHT  ${flashStatus}');
    expect(scene).toContain('this.batteryBarFill.fillRect');
    expect(scene).toContain('this.healthBarText.setText(`${Math.floor(this.runState.hp)}/100`)');
    expect(scene).toContain('this.batteryBarText.setText(`${formatWholePercent(this.runState.battery)}%`)');
    expect(scene).toContain("? ['BATTERY EMPTY']");
    expect(scene).toContain('this.hudWarningsText.setText(batteryWarnings.join');
    expect(scene).toContain('wordWrap: { width: 224, useAdvancedWrap: true }, maxLines: 1');
    expect(scene).not.toContain("batteryWarnings.push('FLASHLIGHT OUT')");
    expect(scene.indexOf('const healthBarY = 24')).toBeLessThan(scene.indexOf('const batteryBarY = 46'));
    expect(scene.indexOf('const batteryBarY = 46')).toBeLessThan(scene.indexOf('this.hudRightText = this.add.text(resourceRight, 66'));
    expect(scene.indexOf('this.hudRightText = this.add.text(resourceRight, 66')).toBeLessThan(scene.indexOf('this.hudWarningsText = this.add.text(resourceRight - 232, 86'));
  });

  it('hides the permanent controls and debug legend during normal play', () => {
    expect(scene).toContain('}).setScrollFactor(0).setDepth(100).setVisible(false);');
    expect(scene).toContain("event.code !== 'F1'");
    expect(scene).toContain('this.controlsHint?.setVisible(!this.controlsHint.visible)');
    expect(scene).toContain('&& this.authoritativeSimulation?.state.floor === 3');
  });

  it('keeps secondary information in the bottom corners', () => {
    expect(scene).toContain('this.hudCurseText.setText(`CURSE');
    expect(scene).toContain('this.hudScoreText.setText(`SCORE');
    expect(scene).toContain('this.cameras.main.height - 18');
  });
});
