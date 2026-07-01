import { TREE_PHASES } from '../config/seasons.js';

/**
 * TreeSystem – Rendering + Wachstum + Symbionten.
 * 5 Phasen, 6 Ast-Levels im Urbaum, animierte Symbionten.
 */
export class TreeSystem {
  constructor(scene) {
    this.scene       = scene;
    this.phaseIndex  = 0;
    this.graphics    = scene.add.graphics();
    this.isGrowing   = false;
    this._growProgress    = 1.0;
    this._prevPhaseIndex  = 0;
    this._visuals    = {};
    this._seasonId   = 'spring';
    this._time       = 0;
    this._symbontOffsets = this._buildSymbontOffsets();
  }

  get phase()    { return TREE_PHASES[this.phaseIndex]; }
  get _cx()      { return this.scene.scale.width  * 0.5; }
  get _groundY() { return this.scene.scale.height * 0.78; }

  _buildSymbontOffsets() {
    return Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * Math.PI * 2,
      r: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
    }));
  }

  // ── Wachstum ──────────────────────────────────────────────────

  checkGrowth(resources, activeSymbioses = 0) {
    if (this.isGrowing) return false;
    const nextPhase = TREE_PHASES[this.phaseIndex + 1];
    if (!nextPhase) return false;
    const cost = nextPhase.growthCost;
    if (!cost) return false;
    const hasRes = resources.get('light')     >= cost.light &&
                   resources.get('water')     >= cost.water &&
                   resources.get('nutrients') >= cost.nutrients;
    const hasSym = activeSymbioses >= (nextPhase.requiredSymbioses || 0);
    if (hasRes && hasSym) {
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
    this._growProgress   = 0;
    this.scene.tweens.add({
      targets: this, _growProgress: 1,
      duration: 4000, ease: 'Sine.easeInOut',
      onUpdate: () => this._drawGrowing(),
      onComplete: () => {
        this.phaseIndex  = targetPhase;
        this._growProgress = 1.0;
        this.isGrowing   = false;
        this.draw(this._seasonId, this._visuals);
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
      levels:       prev.levels,
      branchLength: lerp(prev.branchLength, next.branchLength),
      branchAngle:  lerp(prev.branchAngle,  next.branchAngle),
      leafSize:     lerp(prev.leafSize,     next.leafSize),
      leafDensity:  lerp(prev.leafDensity,  next.leafDensity),
      showMycel:    prev.showMycel,
      lichens:      prev.lichens,
      symbionts:    prev.symbionts || [],
    }, this._seasonId);
  }

  // ── Zeichnen ──────────────────────────────────────────────────

  draw(seasonId, visuals = {}) {
    this._seasonId = seasonId || this._seasonId;
    this._visuals  = visuals  || this._visuals;
    if (!this.isGrowing) this._drawTree(this.phase, this._seasonId);
  }

  /** Alias so GameScene.update() can call tree.tick(delta) */
  tick(delta) {
    this.update(delta);
  }

  _drawTree(phase, seasonId) {
    const g = this.graphics;
    g.clear();
    const cx      = this._cx;
    const groundY = this._groundY;
    const v       = this._visuals;
    const t       = this._time;
    if (v.showMycel)  this._drawMycel(cx, groundY, phase, t, v);
    if (v.lichens)    this._drawLichens(cx, groundY, phase, t, v);
    this._drawRoots(cx, groundY, phase, t, v);
    this._drawTrunk(cx, groundY, phase, t, seasonId, v);
    const trunkTop = groundY - phase.trunkHeight;
    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase, t, seasonId, v);
    this._drawSymbionts(cx, groundY, phase, t, v);
  }

  update(delta) {
    this._time += delta * 0.001;
    if (!this.isGrowing) {
      this._drawTree(this.phase, this._seasonId);
    }
  }

  // ── Hilfsmethode: Kurve als Liniensegmente zeichnen ──────────
  // Phaser 3 Graphics hat KEIN quadraticBezierTo / cubicBezierTo.
  // Wir approximieren die Kurve manuell mit N Liniensegmenten.
  _drawCurve(g, x0, y0, cx1, cy1, cx2, cy2, x1, y1, steps = 16) {
    g.beginPath();
    g.moveTo(x0, y0);
    for (let i = 1; i <= steps; i++) {
      const tt = i / steps;
      const mt = 1 - tt;
      const bx = mt*mt*mt*x0 + 3*mt*mt*tt*cx1 + 3*mt*tt*tt*cx2 + tt*tt*tt*x1;
      const by = mt*mt*mt*y0 + 3*mt*mt*tt*cy1 + 3*mt*tt*tt*cy2 + tt*tt*tt*y1;
      g.lineTo(bx, by);
    }
    g.strokePath();
  }

  // ── Mycel ─────────────────────────────────────────────────────

  _drawMycel(cx, groundY, phase, t, v) {
    const g = this.graphics;
    const spread  = phase.trunkHeight * 1.4;
    const strands = 18;
    for (let i = 0; i < strands; i++) {
      const angle  = (i / strands) * Math.PI * 2;
      const r      = spread * (0.5 + 0.5 * Math.sin(t * 0.3 + i));
      const ex     = cx + Math.cos(angle) * r;
      const ey     = groundY + 8 + Math.sin(angle) * 20;
      const alpha  = 0.12 + 0.08 * Math.sin(t * 0.5 + i);
      g.lineStyle(1, 0xf0e8c0, alpha);
      g.beginPath();
      g.moveTo(cx, groundY);
      g.lineTo(ex, ey);
      g.strokePath();
    }
  }

  // ── Flechten ──────────────────────────────────────────────────

  _drawLichens(cx, groundY, phase, t, v) {
    const g    = this.graphics;
    const segs = 8;
    const trunkTop = groundY - phase.trunkHeight;
    for (let i = 0; i < segs; i++) {
      const y   = trunkTop + (phase.trunkHeight * i) / segs;
      const xOff = Math.sin(i * 2.1 + t * 0.2) * (phase.trunkWidth * 0.5);
      const r   = 3 + Math.sin(t * 0.4 + i) * 1.5;
      g.fillStyle(0x80c060, 0.35 + 0.15 * Math.sin(t * 0.3 + i));
      g.fillCircle(cx + xOff, y, r);
    }
  }

  // ── Wurzeln ───────────────────────────────────────────────────
  // FIX: quadraticBezierTo existiert nicht in Phaser 3.
  // Wir nutzen _drawCurve (kubische Bezier via Liniensegmente).

  _drawRoots(cx, groundY, phase, t, v) {
    const g         = this.graphics;
    const rootCount = 6;
    for (let i = 0; i < rootCount; i++) {
      // Fächer von links nach rechts unter dem Stamm
      const frac  = i / (rootCount - 1);            // 0 … 1
      const angle = Phaser.Math.DegToRad(-170 + frac * 160); // -170°…-10° (nach unten/seitwärts)
      const len   = phase.trunkHeight * (0.45 + 0.15 * Math.sin(i * 1.3));
      const ex    = cx  + Math.cos(angle) * len;
      const ey    = groundY + Math.abs(Math.sin(angle)) * len * 0.5;

      // Kontrollpunkte für organische Kurve
      const cp1x = cx  + Math.cos(angle) * len * 0.3 + Math.sin(i) * 10;
      const cp1y = groundY + 15 + Math.cos(i * 0.8) * 8;
      const cp2x = cx  + Math.cos(angle) * len * 0.65 + Math.sin(i * 1.4) * 8;
      const cp2y = groundY + Math.abs(Math.sin(angle)) * len * 0.3 + 10;

      const w = Math.max(1, phase.trunkWidth * 0.13 - i * 0.3);
      g.lineStyle(w, 0x5c3a1e, 0.75);
      this._drawCurve(g, cx, groundY, cp1x, cp1y, cp2x, cp2y, ex, ey, 14);

      // Feinere Nebenwurzel
      if (phase.levels >= 2) {
        const bAngle = angle + Phaser.Math.DegToRad(15 * (i % 2 === 0 ? 1 : -1));
        const bLen   = len * 0.45;
        const bx     = ex + Math.cos(bAngle) * bLen;
        const by     = ey + Math.abs(Math.sin(bAngle)) * bLen * 0.4;
        g.lineStyle(Math.max(1, w * 0.5), 0x4a2e14, 0.5);
        g.beginPath(); g.moveTo(ex, ey); g.lineTo(bx, by); g.strokePath();
      }
    }
  }

  // ── Stamm ─────────────────────────────────────────────────────

  _drawTrunk(cx, groundY, phase, t, seasonId, v) {
    const g        = this.graphics;
    const top      = groundY - phase.trunkHeight;
    const segCount = 16;
    const segH     = phase.trunkHeight / segCount;

    for (let i = 0; i < segCount; i++) {
      const fi   = i / segCount;
      // Stamm wird nach oben leicht schmaler
      const w    = phase.trunkWidth * (1 - fi * 0.38);
      const y    = groundY - i * segH;
      // Warmes Braun, heller nach oben
      const r    = Math.floor(0x62 - fi * 8);
      const gv   = Math.floor(0x3e - fi * 6);
      const b    = Math.floor(0x20 - fi * 4);
      const col  = (Math.max(0,r) << 16) | (Math.max(0,gv) << 8) | Math.max(0,b);
      g.fillStyle(col, 1);
      g.fillRect(cx - w / 2, y - segH, w, segH + 1);
    }

    // Seitliches Highlight (Lichtreflexion)
    g.fillStyle(0xb08050, 0.18);
    g.fillRect(cx - phase.trunkWidth * 0.12, top, phase.trunkWidth * 0.12, phase.trunkHeight);

    // Rinden-Textur: horizontale Knoten/Rillen
    if (phase.levels >= 2) {
      const knotCount = Math.min(5, phase.levels + 1);
      for (let i = 0; i < knotCount; i++) {
        const ky  = top + phase.trunkHeight * (0.15 + i * 0.17);
        const kw  = phase.trunkWidth * (0.55 - i * 0.05);
        g.lineStyle(1.2, 0x3a2010, 0.35);
        g.beginPath();
        g.moveTo(cx - kw, ky);
        g.lineTo(cx + kw * 0.7, ky + 5 + i * 2);
        g.strokePath();
        // Kleiner Knoten-Buckel
        g.fillStyle(0x4a2e14, 0.25);
        g.fillEllipse(cx - kw * 0.3, ky, kw * 0.4, 4);
      }
    }
  }

  // ── Äste (rekursiv) ───────────────────────────────────────────

  _drawBranches(cx, cy, angle, length, levels, phase, t, seasonId, v, depth = 0) {
    if (levels <= 0 || length < 5) return;
    const g      = this.graphics;
    // Stärkeres Wind-Wiegen bei äußeren Ästen
    const windAmp = 2.5 + depth * 0.8;
    const swing   = Math.sin(t * 0.55 + depth * 1.3) * windAmp;
    const rad     = (angle + swing) * (Math.PI / 180);
    const ex      = cx + Math.cos(rad) * length;
    const ey      = cy + Math.sin(rad) * length;
    const w       = Math.max(1, phase.trunkWidth * 0.07 * (length / phase.trunkHeight));

    // Farbe: ältere Äste dunkler
    const br = Math.max(0x30, 0x5c - depth * 4);
    g.lineStyle(w, (br << 16) | (0x28 << 8) | 0x10, 0.88);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.strokePath();

    this._drawLeaves(ex, ey, length, phase, t, seasonId, depth, v);

    const spread = phase.branchAngle;
    this._drawBranches(ex, ey, angle - spread, length * 0.68, levels - 1, phase, t, seasonId, v, depth + 1);
    this._drawBranches(ex, ey, angle + spread, length * 0.68, levels - 1, phase, t, seasonId, v, depth + 1);
    if (levels > 2) {
      this._drawBranches(ex, ey, angle, length * 0.55, levels - 1, phase, t, seasonId, v, depth + 1);
    }
  }

  // ── Blätter ───────────────────────────────────────────────────

  _drawLeaves(cx, cy, length, phase, t, seasonId, depth, v) {
    if (length < phase.trunkHeight * 0.10) return;
    const g      = this.graphics;
    const count  = Math.floor(phase.leafDensity * 5);
    const colors = this._leafColors(seasonId, v);
    const sizeVar = phase.leafSize * (0.8 + 0.4 * Math.sin(depth * 0.7));

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t * 0.12 + depth * 0.5;
      const r     = sizeVar * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.1 + t * 0.08)));
      const lx    = cx + Math.cos(angle) * r;
      const ly    = cy + Math.sin(angle) * r * 0.55;
      const col   = colors[i % colors.length];
      const alpha = 0.50 + 0.38 * Math.sin(t * 0.35 + i * 0.9 + depth);
      // Leicht rotierende Ellipsen für organischeres Aussehen
      const rot   = angle + Math.sin(t * 0.2 + i) * 0.4;
      g.fillStyle(col, alpha);
      g.fillEllipse(lx, ly,
        phase.leafSize * (1.0 + 0.3 * Math.sin(i)), 
        phase.leafSize * (0.65 + 0.2 * Math.cos(i)));
    }
  }

  _leafColors(seasonId, v) {
    const golden = v.goldenLeaves;
    if (golden) return [0xffd700, 0xffa500, 0xff8c00];
    switch (seasonId) {
      case 'spring': return [0x5ecb40, 0x7de860, 0x3aa820, 0x9aee70];
      case 'summer': return [0x28a020, 0x50c840, 0x1e8018, 0x38b828];
      case 'autumn': return [0xe05020, 0xd08010, 0xb84010, 0xe8a020, 0xc03010];
      case 'winter': return [0xd0e8f0, 0xb0d0e0, 0x8090a0];
      default:       return [0x40a030];
    }
  }

  // ── Symbionten ────────────────────────────────────────────────

  _drawSymbionts(cx, groundY, phase, t, v) {
    const list = phase.symbionts || [];
    const g    = this.graphics;

    // Pilze – mit Stiel und gewölbtem Hut
    if (list.includes('mushroom') || v.mushroomAura) {
      for (let i = 0; i < 5; i++) {
        const mx  = cx - phase.trunkWidth * 0.7 + i * phase.trunkWidth * 0.34;
        const my  = groundY - 2;
        // Stiel
        g.fillStyle(0xf0e8d0, 0.85);
        g.fillRect(mx - 2, my - 7, 4, 8);
        // Hut
        g.fillStyle(0xb03010, 0.80);
        g.fillEllipse(mx, my - 8, 13, 7);
        // Hut-Glanz
        g.fillStyle(0xffffff, 0.25);
        g.fillEllipse(mx - 2, my - 10, 5, 3);
        // Punkte
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(mx + 2, my - 9, 1);
        g.fillCircle(mx - 2, my - 8, 0.8);
      }
    }

    // Moos
    if (list.includes('moss') || v.mossLayer) {
      for (let i = 0; i < 10; i++) {
        const mx  = cx - phase.trunkWidth * 0.5 + i * phase.trunkWidth * 0.11;
        const my  = groundY - 4 - i * 1.5;
        g.fillStyle(0x508030, 0.40 + 0.20 * Math.sin(t * 0.3 + i));
        g.fillCircle(mx, my, 4.5 + Math.sin(t * 0.4 + i) * 1.5);
      }
    }

    // Eule – mit Augenringen
    if (list.includes('owl')) {
      const ox = cx + phase.trunkWidth * 0.65;
      const oy = groundY - phase.trunkHeight * 0.55 + Math.sin(t * 0.5) * 3;
      // Körper
      g.fillStyle(0x7a5838, 0.88); g.fillEllipse(ox, oy, 15, 20);
      // Kopf
      g.fillStyle(0x8a6040, 0.88); g.fillCircle(ox, oy - 11, 8);
      // Augenringe
      g.fillStyle(0xf8e8a0, 0.9); g.fillCircle(ox - 3, oy - 12, 4.5);
      g.fillStyle(0xf8e8a0, 0.9); g.fillCircle(ox + 3, oy - 12, 4.5);
      // Pupillen
      g.fillStyle(0x101010, 1); g.fillCircle(ox - 3, oy - 12, 2.2);
      g.fillStyle(0x101010, 1); g.fillCircle(ox + 3, oy - 12, 2.2);
      // Schnabel
      g.fillStyle(0xe0a020, 0.9); g.fillTriangle(ox - 1.5, oy - 10, ox + 1.5, oy - 10, ox, oy - 7);
      // Ohren
      g.fillStyle(0x7a5838, 0.8);
      g.fillTriangle(ox - 5, oy - 18, ox - 8, oy - 24, ox - 2, oy - 18);
      g.fillTriangle(ox + 5, oy - 18, ox + 8, oy - 24, ox + 2, oy - 18);
    }

    // Hirsch
    if (list.includes('deer')) {
      const dx = cx - phase.trunkWidth * 1.3 + Math.sin(t * 0.22) * 7;
      const dy = groundY - 10;
      // Körper
      g.fillStyle(0xc08050, 0.82); g.fillEllipse(dx, dy, 22, 14);
      // Hals + Kopf
      g.fillStyle(0xb07040, 0.82); g.fillEllipse(dx + 8, dy - 7, 10, 12);
      g.fillStyle(0xb87848, 0.82); g.fillCircle(dx + 11, dy - 12, 6);
      // Geweih links
      g.lineStyle(2, 0x7a5020, 0.9);
      g.beginPath(); g.moveTo(dx + 10, dy - 17); g.lineTo(dx + 7,  dy - 26); g.strokePath();
      g.beginPath(); g.moveTo(dx + 7,  dy - 23); g.lineTo(dx + 3,  dy - 26); g.strokePath();
      g.beginPath(); g.moveTo(dx + 7,  dy - 23); g.lineTo(dx + 5,  dy - 27); g.strokePath();
      // Geweih rechts
      g.beginPath(); g.moveTo(dx + 13, dy - 17); g.lineTo(dx + 16, dy - 26); g.strokePath();
      g.beginPath(); g.moveTo(dx + 16, dy - 23); g.lineTo(dx + 20, dy - 26); g.strokePath();
      g.beginPath(); g.moveTo(dx + 16, dy - 23); g.lineTo(dx + 18, dy - 27); g.strokePath();
      // Beine
      g.lineStyle(2, 0x8a5828, 0.75);
      for (let i = 0; i < 4; i++) {
        const lx = dx - 6 + i * 5;
        g.beginPath(); g.moveTo(lx, dy + 6); g.lineTo(lx, dy + 14); g.strokePath();
      }
    }

    // Glühwürmchen
    if (list.includes('firefly') || v.glowingSpores) {
      for (let i = 0; i < 8; i++) {
        const off = this._symbontOffsets[i];
        const fx  = cx + Math.cos(off.angle + t * 0.4) * phase.trunkHeight * 0.8;
        const fy  = groundY - phase.trunkHeight * 0.3 + Math.sin(off.angle + t * 0.6) * 40;
        const a   = 0.5 + 0.5 * Math.sin(t * off.speed + off.phase);
        // Leuchthof
        g.fillStyle(0xc0ff40, a * 0.3); g.fillCircle(fx, fy, 5);
        // Kern
        g.fillStyle(0xd8ff60, a); g.fillCircle(fx, fy, 2);
      }
    }

    // Biene – mit Flügeln
    if (list.includes('bee')) {
      const bx = cx + Math.cos(t * 1.2) * phase.trunkHeight * 0.6;
      const by = groundY - phase.trunkHeight * 0.5 + Math.sin(t * 1.5) * 30;
      // Flügel (flackern schnell)
      const wa = 0.4 + 0.5 * Math.sin(t * 18);
      g.fillStyle(0xd0f0ff, wa);
      g.fillEllipse(bx - 4, by - 4, 8, 5);
      g.fillEllipse(bx + 4, by - 4, 8, 5);
      // Körper
      g.fillStyle(0xf0c020, 0.92); g.fillEllipse(bx, by, 8, 5);
      // Streifen
      g.fillStyle(0x202020, 0.70); g.fillRect(bx - 2, by - 1, 4, 1.5);
      // Kopf
      g.fillStyle(0xd0a010, 0.9); g.fillCircle(bx + 4, by, 2.5);
    }
  }

  // ── Persistenz ──────────────────────────────────────────────

  serialize() {
    return { phaseIndex: this.phaseIndex };
  }

  restore(data) {
    if (!data) return;
    this.phaseIndex = data.phaseIndex ?? 0;
  }
}
