import { TREE_PHASES, SEASONS } from '../config/seasons.js';

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
    this._windTime = 0;

    // Continuous redraw loop so wind animation is always live
    scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        this._windTime += 0.05;
        if (!this.isGrowing) this._drawTree(this.phase, this._seasonId);
      },
    });
  }

  get phase() {
    return TREE_PHASES[this.phaseIndex];
  }

  /** Dynamic canvas center based on actual renderer size */
  get _cx() { return this.scene.scale.width / 2; }
  get _groundY() { return this.scene.scale.height * 0.78; }

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
        this._drawTree(this.phase, this._seasonId);
      },
    });
  }

  _drawGrowing() {
    const prev = TREE_PHASES[this._prevPhaseIndex];
    const next = TREE_PHASES[this._prevPhaseIndex + 1];
    if (!next) { this._drawTree(this.phase, this._seasonId); return; }

    const t = this._growProgress;
    const lerp = (a, b) => a + (b - a) * t;

    const interpolated = {
      trunkHeight:  lerp(prev.trunkHeight,  next.trunkHeight),
      trunkWidth:   lerp(prev.trunkWidth,   next.trunkWidth),
      levels:       Math.round(lerp(prev.levels, next.levels)),
      branchSpread: lerp(prev.branchSpread, next.branchSpread),
      leafColor:    this._lerpColor(prev.leafColor, next.leafColor, t),
    };

    this._drawTree(interpolated, this._seasonId);
  }

  _lerpColor(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
    return (Math.round(r1 + (r2 - r1) * t) << 16) |
           (Math.round(g1 + (g2 - g1) * t) << 8)  |
            Math.round(b1 + (b2 - b1) * t);
  }

  draw(seasonId = 'spring', mutations = []) {
    this._mutations = mutations;
    this._seasonId = seasonId;
    this._drawTree(this.phase, seasonId);
  }

  // ── Seasonal leaf color ───────────────────────────────────────────────────
  _getLeafColor(baseLeafColor, seasonId) {
    // Check mutation overrides first
    const hasBio  = this._mutations && this._mutations.find(m => m.id === 'bioluminescence' && m.active);
    const hasSun  = this._mutations && this._mutations.find(m => m.id === 'sun_crown' && m.active);
    if (hasBio) return 0x40ff80;
    if (hasSun) return 0xf0d020;

    // Season tint
    const tints = {
      spring: 0x4ab83a,
      summer: 0x2a7a10,
      autumn: 0xd06020,
      winter: 0x2a3822,
    };
    return tints[seasonId] ?? baseLeafColor;
  }

  // ── Main draw ─────────────────────────────────────────────────────────────
  _drawTree(phase, seasonId = 'spring') {
    this.graphics.clear();

    const cx      = this._cx;
    const groundY = this._groundY;
    const t       = this._windTime;

    const hasMycel    = this._mutations && this._mutations.find(m => m.id === 'mycel_bridge'    && m.active);
    const hasFireBark = this._mutations && this._mutations.find(m => m.id === 'fire_bark'       && m.active);
    const hasBio      = this._mutations && this._mutations.find(m => m.id === 'bioluminescence' && m.active);

    if (hasMycel) this._drawMycel(cx, groundY, phase, t);
    this._drawRoots(cx, groundY, phase, t);
    this._drawTrunk(cx, groundY, phase, hasFireBark);

    // Bioluminescent trunk glow
    if (hasBio) {
      const gAlpha = 0.08 + Math.sin(t * 1.5) * 0.04;
      this.graphics.fillStyle(0x40ff80, gAlpha);
      this.graphics.fillEllipse(cx, groundY - phase.trunkHeight * 0.5, phase.trunkWidth * 6, phase.trunkHeight);
    }

    const trunkTop = groundY - phase.trunkHeight;
    const leafColor = this._getLeafColor(phase.leafColor, seasonId);
    const leafAlpha = (seasonId === 'winter') ? 0.25 : 1.0;

    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase, leafColor, leafAlpha, t, hasBio);
  }

  // ── Mycel network ─────────────────────────────────────────────────────────
  _drawMycel(cx, groundY, phase, t) {
    const g = this.graphics;
    const spread = phase.trunkHeight * 1.2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pulse = 0.2 + Math.sin(t * 0.8 + i) * 0.1;
      g.lineStyle(1, 0x90c060, pulse);
      const ex = cx + Math.cos(angle) * spread;
      const ey = groundY + Math.sin(angle) * spread * 0.3 + 20;
      const mx = cx + Math.cos(angle) * spread * 0.5 + Math.sin(t + i) * 15;
      const my = groundY + 25 + Math.cos(t * 0.6 + i) * 8;
      g.beginPath();
      g.moveTo(cx, groundY + 10);
      g.lineTo(mx, my);
      g.lineTo(ex, ey);
      g.strokePath();
    }
  }

  // ── Trunk ─────────────────────────────────────────────────────────────────
  _drawTrunk(cx, groundY, phase, hasFireBark) {
    const g   = this.graphics;
    const top = groundY - phase.trunkHeight;

    const baseColors = hasFireBark
      ? [0x6a2010, 0x8a3018, 0xaa4820]
      : [0x3d2010, 0x5a3018, 0x7a4820];

    const segH = phase.trunkHeight / 3;
    for (let i = 0; i < 3; i++) {
      g.fillStyle(baseColors[i], 1);
      const w = phase.trunkWidth * (1 - i * 0.15);
      g.fillRect(cx - w / 2, top + i * segH, w, segH + 1);
    }

    // Bark highlight stripe
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(cx - phase.trunkWidth * 0.15, top, phase.trunkWidth * 0.15, phase.trunkHeight);
  }

  // ── Roots ─────────────────────────────────────────────────────────────────
  _drawRoots(cx, groundY, phase, t) {
    const g = this.graphics;
    const extraRoots = this._mutations && this._mutations.find(m => m.id === 'deep_roots' && m.active) ? 2 : 0;
    const rootCount  = 3 + this.phaseIndex + extraRoots;

    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI + Math.PI * 0.1;
      const len   = phase.trunkHeight * 0.25;
      const sway  = Math.sin(t * 0.4 + i * 0.9) * 3;

      g.lineStyle(phase.trunkWidth * 0.35, 0x3d2010, 0.7);
      g.beginPath();
      g.moveTo(cx, groundY);
      g.lineTo(
        cx + Math.cos(angle) * len + sway,
        groundY + Math.sin(angle) * len * 0.4
      );
      g.strokePath();
    }
  }

  // ── Branches (recursive) ─────────────────────────────────────────────────
  _drawBranches(x, y, angle, length, depth, phase, leafColor, leafAlpha, t, hasBio) {
    if (depth === 0 || length < 8) return;

    const g   = this.graphics;
    const rad = (angle * Math.PI) / 180;

    // Wind sway increases toward tips
    const depthRatio = depth / phase.levels;
    const swayAmount = (1 - depthRatio) * 6; // tips sway more
    const sway       = Math.sin(t * 0.9 + x * 0.012 + depth * 0.4) * swayAmount;

    const ex = x + Math.cos(rad) * length + sway;
    const ey = y + Math.sin(rad) * length;

    const thickness = Math.max(1.5, phase.trunkWidth * 0.15 * depthRatio);
    g.lineStyle(thickness, 0x5a3820, 1);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(ex, ey);
    g.strokePath();

    if (depth === 1) {
      const leafR = 12 + this.phaseIndex * 4;

      // Leaf cluster
      g.fillStyle(leafColor, leafAlpha * 0.85);
      g.fillCircle(ex, ey, leafR);

      // Darker inner shadow
      g.fillStyle(leafColor, leafAlpha * 0.3);
      g.fillCircle(ex + leafR * 0.2, ey + leafR * 0.2, leafR * 0.6);

      // Bioluminescent pulsing glow ring
      if (hasBio) {
        const glowA = 0.18 + Math.sin(t * 2 + x * 0.05) * 0.1;
        g.fillStyle(0x80ffb0, glowA);
        g.fillCircle(ex, ey, leafR * 1.7);
      }

      // Specular highlight
      g.fillStyle(0xffffff, 0.12);
      g.fillCircle(ex - leafR * 0.25, ey - leafR * 0.3, leafR * 0.4);
    }

    const spread = phase.branchSpread / phase.levels;
    this._drawBranches(ex, ey, angle - spread, length * 0.7, depth - 1, phase, leafColor, leafAlpha, t, hasBio);
    this._drawBranches(ex, ey, angle + spread, length * 0.7, depth - 1, phase, leafColor, leafAlpha, t, hasBio);
  }
}
