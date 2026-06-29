import { TREE_PHASES } from '../config/seasons.js';

export class TreeSystem {
  constructor(scene) {
    this.scene = scene;
    this.phaseIndex = 0;
    this.graphics = scene.add.graphics();
    this.isGrowing = false;
    this._growProgress = 1.0;
    this._prevPhaseIndex = 0;
    this._mutations = [];
    this._seasonId = 'spring';
    this._time = 0;
  }

  get phase() {
    return TREE_PHASES[this.phaseIndex];
  }

  get _cx()      { return this.scene.scale.width  * 0.5; }
  get _groundY() { return this.scene.scale.height * 0.78; }

  // ── Wachstum ────────────────────────────────────────────────────

  checkGrowth(resources, activeSymbioses = 0) {
    if (this.isGrowing) return false;
    const nextPhase = TREE_PHASES[this.phaseIndex + 1];
    if (!nextPhase) return false;
    const cost = nextPhase.growthCost;
    if (!cost) return false;

    const hasResources =
      resources.get('light')     >= cost.light     &&
      resources.get('water')     >= cost.water     &&
      resources.get('nutrients') >= cost.nutrients;
    const hasSymbioses = activeSymbioses >= (nextPhase.requiredSymbioses || 0);

    if (hasResources && hasSymbioses) {
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
        this.draw(this._seasonId, this._mutations);
      },
    });
  }

  _drawGrowing() {
    const prev = TREE_PHASES[this._prevPhaseIndex];
    const next = TREE_PHASES[this._prevPhaseIndex + 1];
    if (!next) { this.draw(); return; }
    const t    = this._growProgress;
    const lerp = (a, b) => a + (b - a) * t;
    this._drawTree({
      trunkHeight:  lerp(prev.trunkHeight,  next.trunkHeight),
      trunkWidth:   lerp(prev.trunkWidth,   next.trunkWidth),
      levels:       Math.round(lerp(prev.levels, next.levels)),
      branchSpread: lerp(prev.branchSpread, next.branchSpread),
      leafColor:    this._lerpColor(prev.leafColor, next.leafColor, t),
    }, this._seasonId);
  }

  _lerpColor(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
    return ((Math.round(r1 + (r2 - r1) * t) << 16) |
            (Math.round(g1 + (g2 - g1) * t) << 8)  |
             Math.round(b1 + (b2 - b1) * t));
  }

  // ── Öffentliche API ─────────────────────────────────────────────────

  draw(seasonId = 'spring', mutations = []) {
    this._mutations = mutations;
    this._seasonId  = seasonId;
  }

  /** Wird jeden Frame von GameScene.update() aufgerufen */
  tick(delta) {
    this._time += delta;
    if (!this.isGrowing) {
      this._drawTree(this.phase, this._seasonId);
    }
  }

  // ── Windstärke ───────────────────────────────────────────────────

  _windStrength(seasonId) {
    return { spring: 1.0, summer: 0.6, autumn: 2.0, winter: 1.5 }[seasonId] ?? 1.0;
  }

  // ── Haupt-Render ─────────────────────────────────────────────────

  _drawTree(phase, seasonId = 'spring') {
    this.graphics.clear();
    const cx      = this._cx;
    const groundY = this._groundY;
    const t       = this._time / 1000;

    const hasMycel = this._mutations.find(m => m.id === 'mycel_bridge' && m.active);
    if (hasMycel) this._drawMycel(cx, groundY, phase, t);

    this._drawRoots(cx, groundY, phase, t);
    this._drawTrunk(cx, groundY, phase, t, seasonId);

    const trunkTop = groundY - phase.trunkHeight;
    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase, t, seasonId);
  }

  // ── Myzel ──────────────────────────────────────────────────────────

  _drawMycel(cx, groundY, phase, t) {
    const g      = this.graphics;
    const spread = phase.trunkHeight * 1.3;
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const alpha = 0.15 + 0.1 * Math.sin(t * 1.5 + i);
      g.lineStyle(1, 0x90c060, alpha);
      const ex = cx + Math.cos(angle) * spread;
      const ey = groundY + Math.sin(angle) * spread * 0.25 + 15;
      const mx = cx + Math.cos(angle) * spread * 0.45 + Math.sin(t + i) * 8;
      const my = groundY + 20 + Math.cos(t * 0.7 + i) * 6;
      g.beginPath();
      g.moveTo(cx, groundY + 8);
      g.lineTo(mx, my);
      g.lineTo(ex, ey);
      g.strokePath();
      g.fillStyle(0xb0e060, 0.3);
      g.fillCircle(ex, ey, 3);
    }
  }

  // ── Stamm ───────────────────────────────────────────────────────────

  _drawTrunk(cx, groundY, phase, t, seasonId) {
    const g    = this.graphics;
    const top  = groundY - phase.trunkHeight;
    const wind = this._windStrength(seasonId);

    const hasFireBark = this._mutations.find(m => m.id === 'fire_bark' && m.active);
    const baseColors  = hasFireBark
      ? [0x5a1808, 0x7a2810, 0x9a3818]
      : [0x3d2010, 0x5a3018, 0x7a4820];

    const segCount = 6;
    const segH     = phase.trunkHeight / segCount;
    for (let i = 0; i < segCount; i++) {
      const fi    = i / segCount;
      const w     = phase.trunkWidth * (1 - fi * 0.35);
      const sway  = Math.sin(t * 0.9 + i * 0.25) * fi * wind * 4;
      const y0    = top + i * segH;
      const color = baseColors[Math.min(i, baseColors.length - 1)];
      g.fillStyle(color, 1);
      g.fillRect(cx - w / 2 + sway, y0, w, segH + 1);
    }
    // Highlight-Streifen
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(cx - phase.trunkWidth * 0.15, top, phase.trunkWidth * 0.15, phase.trunkHeight);
  }

  // ── Wurzeln ─────────────────────────────────────────────────────────

  _drawRoots(cx, groundY, phase, t) {
    const g         = this.graphics;
    const extraRoots = this._mutations.find(m => m.id === 'deep_roots' && m.active) ? 3 : 0;
    const rootCount  = 3 + this.phaseIndex + extraRoots;
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI + Math.PI * 0.08;
      const len   = phase.trunkHeight * 0.28 + extraRoots * 8;
      const sway  = Math.sin(t * 0.4 + i * 0.8) * 2;
      g.lineStyle(Math.max(1.5, phase.trunkWidth * 0.35 - i * 0.3), 0x3d2010, 0.75);
      g.beginPath();
      g.moveTo(cx, groundY);
      g.lineTo(
        cx + Math.cos(angle) * len + sway,
        groundY + Math.sin(angle) * len * 0.45
      );
      g.strokePath();
    }
  }

  // ── Äste (rekursiv) ──────────────────────────────────────────────────

  _drawBranches(x, y, angle, length, depth, phase, t, seasonId) {
    if (depth === 0 || length < 8) return;

    const g    = this.graphics;
    const wind = this._windStrength(seasonId);
    const rad  = (angle * Math.PI) / 180;
    const sway = Math.sin(t * 0.9 + depth * 0.7 + x * 0.005) * (phase.levels - depth + 1) * wind * 1.5;
    const ex   = x + Math.cos(rad) * length + sway;
    const ey   = y + Math.sin(rad) * length;

    const thickness = Math.max(1, phase.trunkWidth * 0.13 * (depth / phase.levels));
    g.lineStyle(thickness, 0x5a3820, 1);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(ex, ey);
    g.strokePath();

    if (depth === 1) {
      this._drawLeaf(ex, ey, phase, t, seasonId);
    }

    const spread = phase.branchSpread / phase.levels;
    this._drawBranches(ex, ey, angle - spread, length * 0.7, depth - 1, phase, t, seasonId);
    this._drawBranches(ex, ey, angle + spread, length * 0.7, depth - 1, phase, t, seasonId);
  }

  // ── Blatt ───────────────────────────────────────────────────────────

  _drawLeaf(x, y, phase, t, seasonId) {
    const g      = this.graphics;
    const bioMut = this._mutations.find(m => m.id === 'bioluminescence' && m.active);
    const sunMut = this._mutations.find(m => m.id === 'sun_crown'       && m.active);

    const seasonColors = { spring: 0x4ab830, summer: 0x2a8010, autumn: 0xc85010, winter: 0x1a3018 };
    let leafColor = seasonColors[seasonId] ?? phase.leafColor;
    if (bioMut) leafColor = 0x40ff80;
    if (sunMut) leafColor = 0xf0d020;

    if (seasonId === 'winter' && Math.random() < 0.65) return;
    if (seasonId === 'autumn' && Math.random() < 0.25) return;

    const leafR = 10 + this.phaseIndex * 4;
    const pulse = bioMut ? 1 + 0.15 * Math.sin(t * 2.5 + x * 0.05) : 1;

    g.fillStyle(leafColor, 0.88);
    g.fillCircle(x, y, leafR * pulse);

    if (bioMut) {
      g.fillStyle(0x80ffb0, 0.2);
      g.fillCircle(x, y, leafR * 1.7 * pulse);
    }

    if (seasonId === 'spring' && Math.random() < 0.3) {
      g.fillStyle(0xffb8c8, 0.7);
      g.fillCircle(x, y, leafR * 0.35);
    }

    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(x - leafR * 0.28, y - leafR * 0.32, leafR * 0.38);
  }
}
