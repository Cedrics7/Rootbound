import { TREE_PHASES } from '../config/seasons.js';

export class TreeSystem {
  constructor(scene) {
    this.scene = scene;
    this.phaseIndex = 0;
    this.graphics = scene.add.graphics();
    this.isGrowing = false;
  }

  get phase() {
    return TREE_PHASES[this.phaseIndex];
  }

  // Prüfe ob der Baum wachsen kann
  checkGrowth(resources) {
    const nextPhase = TREE_PHASES[this.phaseIndex + 1];
    if (!nextPhase) return false; // bereits max

    if (resources.get('light') >= nextPhase.requiredLight) {
      this.growTo(this.phaseIndex + 1);
      return true;
    }
    return false;
  }

  growTo(phaseIndex) {
    if (this.isGrowing) return;
    this.isGrowing = true;

    // Tween für sanftes Wachstum
    this.scene.tweens.add({
      targets: this,
      duration: 2000,
      ease: 'Sine.easeOut',
      onUpdate: () => this.draw(),
      onComplete: () => {
        this.phaseIndex = phaseIndex;
        this.isGrowing = false;
        this.draw();
      },
    });
  }

  draw(seasonId = 'spring') {
    this.graphics.clear();

    const cx = 512;  // Mitte der 1024px Canvas
    const groundY = 600;
    const phase = this.phase;

    // Wurzeln zeichnen
    this._drawRoots(cx, groundY, phase);

    // Stamm
    this._drawTrunk(cx, groundY, phase);

    // Krone (rekursive Äste)
    const trunkTop = groundY - phase.trunkHeight;
    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase);
  }

  _drawTrunk(cx, groundY, phase) {
    const g = this.graphics;
    const top = groundY - phase.trunkHeight;

    // Stamm-Gradient (dunkel unten, heller oben) – vereinfacht mit 3 Rechtecken
    const colors = [0x3d2010, 0x5a3018, 0x7a4820];
    const segH = phase.trunkHeight / 3;
    for (let i = 0; i < 3; i++) {
      g.fillStyle(colors[i], 1);
      const w = phase.trunkWidth * (1 - i * 0.15);
      g.fillRect(cx - w / 2, top + i * segH, w, segH + 1);
    }
  }

  _drawRoots(cx, groundY, phase) {
    const g = this.graphics;
    g.lineStyle(phase.trunkWidth * 0.4, 0x3d2010, 0.7);
    const rootCount = 3 + this.phaseIndex;
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI + Math.PI * 0.1;
      const len = phase.trunkHeight * 0.25;
      g.beginPath();
      g.moveTo(cx, groundY);
      g.lineTo(
        cx + Math.cos(angle) * len,
        groundY + Math.sin(angle) * len * 0.4
      );
      g.strokePath();
    }
  }

  _drawBranches(x, y, angle, length, depth, phase) {
    if (depth === 0 || length < 8) return;

    const g = this.graphics;
    const rad = (angle * Math.PI) / 180;
    const ex = x + Math.cos(rad) * length;
    const ey = y + Math.sin(rad) * length;

    // Astdicke nimmt mit Tiefe ab
    const thickness = Math.max(1.5, phase.trunkWidth * 0.15 * (depth / phase.levels));
    g.lineStyle(thickness, 0x5a3820, 1);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(ex, ey);
    g.strokePath();

    // Blätter an Endpunkten der letzten Ebene
    if (depth === 1) {
      const leafR = 12 + this.phaseIndex * 4;
      g.fillStyle(phase.leafColor, 0.85);
      g.fillCircle(ex, ey, leafR);
      // Lichtreflex
      g.fillStyle(0xffffff, 0.12);
      g.fillCircle(ex - leafR * 0.25, ey - leafR * 0.3, leafR * 0.4);
    }

    // Rekursiv linker und rechter Ast
    const spread = phase.branchSpread / phase.levels;
    this._drawBranches(ex, ey, angle - spread, length * 0.7, depth - 1, phase);
    this._drawBranches(ex, ey, angle + spread, length * 0.7, depth - 1, phase);
  }
}
