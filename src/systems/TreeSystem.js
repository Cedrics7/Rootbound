import { TREE_PHASES } from '../config/seasons.js';

export class TreeSystem {
  constructor(scene) {
    this.scene = scene;
    this.phaseIndex = 0;
    this.graphics = scene.add.graphics();
    this.isGrowing = false;
    // Interner Wachstumsfortschritt für Animation (0→1)
    this._growProgress = 1.0;
    this._prevPhaseIndex = 0;
  }

  get phase() {
    return TREE_PHASES[this.phaseIndex];
  }

  /**
   * Prüfe und starte Wachstum.
   * @param {ResourceSystem} resources
   * @param {number} activeSymbioses - Anzahl aktiver Symbiose-Mutationen
   * @returns {boolean}
   */
  checkGrowth(resources, activeSymbioses = 0) {
    if (this.isGrowing) return false;
    const nextPhase = TREE_PHASES[this.phaseIndex + 1];
    if (!nextPhase) return false; // bereits max

    const cost = nextPhase.growthCost;
    if (!cost) return false;

    // Ressourcen-Check
    const hasResources =
      resources.get('light')     >= cost.light     &&
      resources.get('water')     >= cost.water     &&
      resources.get('nutrients') >= cost.nutrients;

    // Symbiose-Check
    const hasSymbioses = activeSymbioses >= (nextPhase.requiredSymbioses || 0);

    if (hasResources && hasSymbioses) {
      // Ressourcen bezahlen
      resources.spend(cost);
      this._startGrowth(this.phaseIndex + 1);
      return true;
    }
    return false;
  }

  _startGrowth(targetPhase) {
    if (this.isGrowing) return;
    this.isGrowing = true;
    this._prevPhaseIndex = this.phaseIndex;
    this._growProgress = 0;

    this.scene.tweens.add({
      targets: this,
      _growProgress: 1,
      duration: 3000,
      ease: 'Sine.easeInOut',
      onUpdate: () => this._drawGrowing(),
      onComplete: () => {
        this.phaseIndex = targetPhase;
        this._growProgress = 1.0;
        this.isGrowing = false;
        this.draw();
      },
    });
  }

  /** Zeichnet den Baum interpoliert zwischen prev und next Phase */
  _drawGrowing() {
    const prev = TREE_PHASES[this._prevPhaseIndex];
    const next = TREE_PHASES[this._prevPhaseIndex + 1];
    if (!next) { this.draw(); return; }

    const t = this._growProgress;
    const lerp = (a, b) => a + (b - a) * t;

    const interpolated = {
      trunkHeight:  lerp(prev.trunkHeight,  next.trunkHeight),
      trunkWidth:   lerp(prev.trunkWidth,   next.trunkWidth),
      levels:       Math.round(lerp(prev.levels, next.levels)),
      branchSpread: lerp(prev.branchSpread, next.branchSpread),
      leafColor:    this._lerpColor(prev.leafColor, next.leafColor, t),
    };

    this._drawTree(interpolated);
  }

  _lerpColor(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return (r << 16) | (g << 8) | b;
  }

  draw(seasonId = 'spring', mutations = []) {
    this._mutations = mutations;
    this._drawTree(this.phase, seasonId);
  }

  _drawTree(phase, seasonId = 'spring') {
    this.graphics.clear();

    const cx = 512;
    const groundY = 600;

    // Myzel-Netz zeichnen (wenn Mutation aktiv)
    const hasMycel = this._mutations && this._mutations.find(m => m.id === 'mycel_bridge' && m.active);
    if (hasMycel) {
      this._drawMycel(cx, groundY, phase);
    }

    this._drawRoots(cx, groundY, phase);
    this._drawTrunk(cx, groundY, phase);

    const trunkTop = groundY - phase.trunkHeight;
    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase);
  }

  _drawMycel(cx, groundY, phase) {
    const g = this.graphics;
    g.lineStyle(1, 0x90c060, 0.3);
    const spread = phase.trunkHeight * 1.2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ex = cx + Math.cos(angle) * spread;
      const ey = groundY + Math.sin(angle) * spread * 0.3 + 20;
      g.beginPath();
      g.moveTo(cx, groundY + 10);
      // Kurviger Weg
      const mx = cx + Math.cos(angle) * spread * 0.5 + (Math.random() - 0.5) * 40;
      const my = groundY + 25 + Math.random() * 20;
      g.lineTo(mx, my);
      g.lineTo(ex, ey);
      g.strokePath();
    }
  }

  _drawTrunk(cx, groundY, phase) {
    const g = this.graphics;
    const top = groundY - phase.trunkHeight;

    // Mutation: Feuerfeste Rinde → rötlicher Stamm
    const hasFireBark = this._mutations && this._mutations.find(m => m.id === 'fire_bark' && m.active);
    const baseColors = hasFireBark
      ? [0x6a2010, 0x8a3018, 0xaa4820]
      : [0x3d2010, 0x5a3018, 0x7a4820];

    const segH = phase.trunkHeight / 3;
    for (let i = 0; i < 3; i++) {
      g.fillStyle(baseColors[i], 1);
      const w = phase.trunkWidth * (1 - i * 0.15);
      g.fillRect(cx - w / 2, top + i * segH, w, segH + 1);
    }
  }

  _drawRoots(cx, groundY, phase) {
    const g = this.graphics;
    const extraRoots = this._mutations && this._mutations.find(m => m.id === 'deep_roots' && m.active) ? 2 : 0;
    g.lineStyle(phase.trunkWidth * 0.4, 0x3d2010, 0.7);
    const rootCount = 3 + this.phaseIndex + extraRoots;
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

    const thickness = Math.max(1.5, phase.trunkWidth * 0.15 * (depth / phase.levels));
    g.lineStyle(thickness, 0x5a3820, 1);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(ex, ey);
    g.strokePath();

    if (depth === 1) {
      // Blatt-Farbe aus Mutation oder Phase
      const bioMut = this._mutations && this._mutations.find(m => m.id === 'bioluminescence' && m.active);
      const sunMut = this._mutations && this._mutations.find(m => m.id === 'sun_crown' && m.active);
      let leafColor = phase.leafColor;
      if (bioMut) leafColor = 0x40ff80;
      if (sunMut) leafColor = 0xf0d020;

      const leafR = 12 + this.phaseIndex * 4;
      g.fillStyle(leafColor, 0.85);
      g.fillCircle(ex, ey, leafR);

      // Biolumineszenz-Glow
      if (bioMut) {
        g.fillStyle(0x80ffb0, 0.25);
        g.fillCircle(ex, ey, leafR * 1.6);
      }

      // Lichtreflex
      g.fillStyle(0xffffff, 0.12);
      g.fillCircle(ex - leafR * 0.25, ey - leafR * 0.3, leafR * 0.4);
    }

    const spread = phase.branchSpread / phase.levels;
    this._drawBranches(ex, ey, angle - spread, length * 0.7, depth - 1, phase);
    this._drawBranches(ex, ey, angle + spread, length * 0.7, depth - 1, phase);
  }
}
