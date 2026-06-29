import { TREE_PHASES, SEASONS } from '../config/seasons.js';

/**
 * TreeSystem – rendert den Baum mit Wind-Animation, dynamischen Koordinaten,
 * Jahreszeit-Optik und Mutations-Visualisierungen.
 */
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
<<<<<<< HEAD
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
=======
    this._time = 0; // ms, für Wind-Sway
>>>>>>> origin/main
  }

  get phase() {
    return TREE_PHASES[this.phaseIndex];
  }

<<<<<<< HEAD
  /** Dynamic canvas center based on actual renderer size */
  get _cx() { return this.scene.scale.width / 2; }
  get _groundY() { return this.scene.scale.height * 0.78; }
=======
  // ── Wachstum ─────────────────────────────────────────────────────────
>>>>>>> origin/main

  checkGrowth(resources, activeSymbioses = 0) {
    if (this.isGrowing) return false;
    const nextPhase = TREE_PHASES[this.phaseIndex + 1];
    if (!nextPhase) return false;
<<<<<<< HEAD

=======
>>>>>>> origin/main
    const cost = nextPhase.growthCost;
    if (!cost) return false;

    const hasResources =
      resources.get('light')     >= cost.light     &&
      resources.get('water')     >= cost.water     &&
      resources.get('nutrients') >= cost.nutrients;
<<<<<<< HEAD

=======
>>>>>>> origin/main
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
<<<<<<< HEAD
        this._drawTree(this.phase, this._seasonId);
=======
        this.draw(this._seasonId, this._mutations);
>>>>>>> origin/main
      },
    });
  }

  _drawGrowing() {
    const prev = TREE_PHASES[this._prevPhaseIndex];
    const next = TREE_PHASES[this._prevPhaseIndex + 1];
<<<<<<< HEAD
    if (!next) { this._drawTree(this.phase, this._seasonId); return; }

=======
    if (!next) { this.draw(); return; }
>>>>>>> origin/main
    const t = this._growProgress;
    const lerp = (a, b) => a + (b - a) * t;
    this._drawTree({
      trunkHeight:  lerp(prev.trunkHeight,  next.trunkHeight),
      trunkWidth:   lerp(prev.trunkWidth,   next.trunkWidth),
      levels:       Math.round(lerp(prev.levels, next.levels)),
      branchSpread: lerp(prev.branchSpread, next.branchSpread),
      leafColor:    this._lerpColor(prev.leafColor, next.leafColor, t),
<<<<<<< HEAD
    };

    this._drawTree(interpolated, this._seasonId);
=======
    }, this._seasonId);
>>>>>>> origin/main
  }

  _lerpColor(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
<<<<<<< HEAD
    return (Math.round(r1 + (r2 - r1) * t) << 16) |
           (Math.round(g1 + (g2 - g1) * t) << 8)  |
            Math.round(b1 + (b2 - b1) * t);
=======
    return ((Math.round(r1 + (r2 - r1) * t) << 16) |
            (Math.round(g1 + (g2 - g1) * t) << 8)  |
             Math.round(b1 + (b2 - b1) * t));
>>>>>>> origin/main
  }

  // ── Öffentliche API ──────────────────────────────────────────────────

  draw(seasonId = 'spring', mutations = []) {
    this._mutations = mutations;
    this._seasonId = seasonId;
<<<<<<< HEAD
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
=======
    // Kein direktes Zeichnen hier – update() übernimmt den Loop
  }

  /**
   * Wird jedes Frame vom GameScene.update() aufgerufen.
   * @param {number} delta ms seit letztem Frame
   */
  tick(delta) {
    this._time += delta;
    if (!this.isGrowing) {
      this._drawTree(this.phase, this._seasonId);
    }
  }

  // ── Rendering ────────────────────────────────────────────────────────

>>>>>>> origin/main
  _drawTree(phase, seasonId = 'spring') {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const cx      = W * 0.5;
    const groundY = H * 0.78;
    const t       = this._time / 1000; // Sekunden für Sinus

    this.graphics.clear();

<<<<<<< HEAD
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
=======
    // Myzel-Netz
    const hasMycel = this._mutations.find(m => m.id === 'mycel_bridge' && m.active);
    if (hasMycel) this._drawMycel(cx, groundY, phase, t);

    this._drawRoots(cx, groundY, phase, t);
    this._drawTrunk(cx, groundY, phase, t, seasonId);

    const trunkTop = groundY - phase.trunkHeight;
    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase, t, seasonId);

    // Tiere (Emojis als Text-Objekte werden extern verwaltet)
  }

  // Windstärke je nach Jahreszeit
  _windStrength(seasonId) {
    return { spring: 1.0, summer: 0.6, autumn: 2.0, winter: 1.5 }[seasonId] ?? 1.0;
  }

  _drawMycel(cx, groundY, phase, t) {
    const g = this.graphics;
    const spread = phase.trunkHeight * 1.3;
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      // Pulsierendes Leuchten
      const alpha = 0.15 + 0.1 * Math.sin(t * 1.5 + i);
      g.lineStyle(1, 0x90c060, alpha);
      const ex = cx + Math.cos(angle) * spread;
      const ey = groundY + Math.sin(angle) * spread * 0.25 + 15;
      const mx = cx + Math.cos(angle) * spread * 0.45 + Math.sin(t + i) * 8;
      const my = groundY + 20 + Math.cos(t * 0.7 + i) * 6;
      g.beginPath();
      g.moveTo(cx, groundY + 8);
>>>>>>> origin/main
      g.lineTo(mx, my);
      g.lineTo(ex, ey);
      g.strokePath();
      // Knoten
      g.fillStyle(0xb0e060, 0.3);
      g.fillCircle(ex, ey, 3);
    }
  }

<<<<<<< HEAD
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
=======
  _drawRoots(cx, groundY, phase, t) {
    const g = this.graphics;
    const extraRoots = this._mutations.find(m => m.id === 'deep_roots' && m.active) ? 3 : 0;
    const rootCount  = 3 + this.phaseIndex + extraRoots;
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI + Math.PI * 0.08;
      const len   = phase.trunkHeight * 0.28 + extraRoots * 8;
      const sway  = Math.sin(t * 0.4 + i * 0.8) * 2;
      g.lineStyle(Math.max(1.5, phase.trunkWidth * 0.35 - i * 0.3), 0x3d2010, 0.75);
>>>>>>> origin/main
      g.beginPath();
      g.moveTo(cx, groundY);
      g.lineTo(
        cx + Math.cos(angle) * len + sway,
<<<<<<< HEAD
        groundY + Math.sin(angle) * len * 0.4
=======
        groundY + Math.sin(angle) * len * 0.45
>>>>>>> origin/main
      );
      g.strokePath();
    }
  }

<<<<<<< HEAD
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
=======
  _drawTrunk(cx, groundY, phase, t, seasonId) {
    const g = this.graphics;
    const top = groundY - phase.trunkHeight;
    const wind = this._windStrength(seasonId);

    const hasFireBark = this._mutations.find(m => m.id === 'fire_bark' && m.active);
    const baseColors  = hasFireBark
      ? [0x5a1808, 0x7a2810, 0x9a3818]
      : [0x3d2010, 0x5a3018, 0x7a4820];

    const segCount = 6;
    const segH = phase.trunkHeight / segCount;
    for (let i = 0; i < segCount; i++) {
      const fi   = i / segCount;
      const w    = phase.trunkWidth * (1 - fi * 0.35);
      // Wind-Sway nimmt zur Spitze hin zu
      const sway = Math.sin(t * 0.9 + i * 0.25) * fi * wind * 4;
      const y0   = top + i * segH;
      const color = baseColors[Math.min(i, baseColors.length - 1)];
      g.fillStyle(color, 1);
      g.fillRect(cx - w / 2 + sway, y0, w, segH + 1);
      // Rindenlinien
      if (i % 2 === 0) {
        g.lineStyle(0.4, 0x000000, 0.2);
        g.beginPath();
        g.moveTo(cx - w / 2 + sway, y0 + segH * 0.5);
        g.lineTo(cx + w / 2 + sway, y0 + segH * 0.5);
        g.strokePath();
      }
    }
  }

  _drawBranches(x, y, angle, length, depth, phase, t, seasonId) {
    if (depth === 0 || length < 8) return;

    const g    = this.graphics;
    const wind = this._windStrength(seasonId);
    const rad  = (angle * Math.PI) / 180;
    // Sway nimmt mit Tiefe zu (Enden wippen stärker)
    const sway = Math.sin(t * 0.9 + depth * 0.7 + x * 0.005) * (phase.levels - depth + 1) * wind * 1.5;
    const ex   = x + Math.cos(rad) * length + sway;
    const ey   = y + Math.sin(rad) * length;

    const thickness = Math.max(1, phase.trunkWidth * 0.13 * (depth / phase.levels));
>>>>>>> origin/main
    g.lineStyle(thickness, 0x5a3820, 1);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(ex, ey);
    g.strokePath();

    if (depth === 1) {
<<<<<<< HEAD
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
=======
      this._drawLeaf(ex, ey, phase, t, seasonId);
    }

    const spread = phase.branchSpread / phase.levels;
    this._drawBranches(ex, ey, angle - spread, length * 0.7, depth - 1, phase, t, seasonId);
    this._drawBranches(ex, ey, angle + spread, length * 0.7, depth - 1, phase, t, seasonId);
  }

  _drawLeaf(x, y, phase, t, seasonId) {
    const g = this.graphics;

    // Mutation Override
    const bioMut  = this._mutations.find(m => m.id === 'bioluminescence' && m.active);
    const sunMut  = this._mutations.find(m => m.id === 'sun_crown'       && m.active);

    // Jahreszeit-Blattfarbe
    const seasonColors = {
      spring: 0x4ab830,
      summer: 0x2a8010,
      autumn: 0xc85010,
      winter: 0x1a3018,
    };
    let leafColor = seasonColors[seasonId] ?? phase.leafColor;
    if (bioMut) leafColor = 0x40ff80;
    if (sunMut) leafColor = 0xf0d020;

    // Winter: kaum Blätter, zufällig auslassen
    if (seasonId === 'winter' && Math.random() < 0.65) return;
    // Herbst: Teil-Laubfall
    if (seasonId === 'autumn' && Math.random() < 0.25) return;

    const leafR = 10 + this.phaseIndex * 4;
    // Pulsieren bei Biolumineszenz
    const pulse = bioMut ? 1 + 0.15 * Math.sin(t * 2.5 + x * 0.05) : 1;

    g.fillStyle(leafColor, 0.88);
    g.fillCircle(x, y, leafR * pulse);

    // Biolumineszenz-Glow
    if (bioMut) {
      g.fillStyle(0x80ffb0, 0.2);
      g.fillCircle(x, y, leafR * 1.7 * pulse);
    }

    // Blüten im Frühling
    if (seasonId === 'spring' && Math.random() < 0.3) {
      g.fillStyle(0xffb8c8, 0.7);
      g.fillCircle(x, y, leafR * 0.35);
    }

    // Lichtreflex
    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(x - leafR * 0.28, y - leafR * 0.32, leafR * 0.38);
>>>>>>> origin/main
  }
}
