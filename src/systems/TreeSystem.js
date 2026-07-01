import { TREE_PHASES } from '../config/seasons.js';
import Phaser from 'phaser';

/**
 * TreeSystem – Rendering + Wachstum + Symbionten.
 * Verbesserte Grafik: Polygon-Blätter, Laubdach-Cluster, Rinden-Textur,
 * saisonale Aura. Kein quadraticBezierTo – alles via _drawCurve.
 */
export class TreeSystem {
  constructor(scene) {
    this.scene      = scene;
    this.phaseIndex = 0;
    this.graphics   = scene.add.graphics();
    this.isGrowing  = false;
    this._growProgress   = 1.0;
    this._prevPhaseIndex = 0;
    this._visuals   = {};
    this._seasonId  = 'spring';
    this._time      = 0;
    this._symbontOffsets = this._buildSymbontOffsets();
    // Fixe Blatt-Offsets damit sie nicht pro Frame neu berechnet werden
    this._leafCache = {};
  }

  get phase()    { return TREE_PHASES[this.phaseIndex]; }
  get _cx()      { return this.scene.scale.width  * 0.5; }
  get _groundY() { return this.scene.scale.height * 0.78; }

  _buildSymbontOffsets() {
    return Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      r:     0.5 + (i * 0.037 % 0.5),
      phase: (i * 0.41) % (Math.PI * 2),
      speed: 0.4 + (i * 0.09 % 0.8),
    }));
  }

  // ─── Wachstum ────────────────────────────────────────────────────────────

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
    this._leafCache      = {};
    this.scene.tweens.add({
      targets: this, _growProgress: 1,
      duration: 4500, ease: 'Sine.easeInOut',
      onUpdate:  () => this._drawGrowing(),
      onComplete: () => {
        this.phaseIndex    = targetPhase;
        this._growProgress = 1.0;
        this.isGrowing     = false;
        this._leafCache    = {};
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
      levels:       Math.round(lerp(prev.levels, next.levels)),
      branchLength: lerp(prev.branchLength, next.branchLength),
      branchAngle:  lerp(prev.branchAngle,  next.branchAngle),
      leafSize:     lerp(prev.leafSize,     next.leafSize),
      leafDensity:  lerp(prev.leafDensity,  next.leafDensity),
      showMycel:    prev.showMycel,
      lichens:      prev.lichens,
      symbionts:    prev.symbionts || [],
    }, this._seasonId);
  }

  // ─── Zeichnen ─────────────────────────────────────────────────────────────

  draw(seasonId, visuals = {}) {
    this._seasonId = seasonId || this._seasonId;
    this._visuals  = visuals  || this._visuals;
    if (!this.isGrowing) this._drawTree(this.phase, this._seasonId);
  }

  tick(delta)  { this.update(delta); }

  update(delta) {
    this._time += delta * 0.001;
    if (!this.isGrowing) this._drawTree(this.phase, this._seasonId);
  }

  _drawTree(phase, seasonId) {
    const g       = this.graphics;
    g.clear();
    const cx      = this._cx;
    const groundY = this._groundY;
    const v       = this._visuals;
    const t       = this._time;

    this._drawSeasonalAura(cx, groundY, phase, t, seasonId);
    if (v.showMycel)  this._drawMycel(cx, groundY, phase, t);
    if (v.lichens)    this._drawLichens(cx, groundY, phase, t);
    this._drawRoots(cx, groundY, phase, t);
    this._drawTrunk(cx, groundY, phase, t, seasonId);
    const trunkTop = groundY - phase.trunkHeight;
    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase, t, seasonId, 0);
    this._drawCanopyGlow(cx, trunkTop, phase, t, seasonId);
    this._drawSymbionts(cx, groundY, phase, t, v);
  }

  // ─── Bezier-Hilfsmethode (Phaser 3 hat kein quadraticBezierTo) ────────────

  _drawCurve(g, x0, y0, cx1, cy1, cx2, cy2, x1, y1, steps = 14) {
    g.beginPath();
    g.moveTo(x0, y0);
    for (let i = 1; i <= steps; i++) {
      const u = i / steps, m = 1 - u;
      g.lineTo(
        m*m*m*x0 + 3*m*m*u*cx1 + 3*m*u*u*cx2 + u*u*u*x1,
        m*m*m*y0 + 3*m*m*u*cy1 + 3*m*u*u*cy2 + u*u*u*y1,
      );
    }
    g.strokePath();
  }

  // ─── Saisonale Aura ────────────────────────────────────────────────────────

  _drawSeasonalAura(cx, groundY, phase, t, seasonId) {
    if (phase.levels < 2) return;
    const g      = this.graphics;
    const cy     = groundY - phase.trunkHeight * 0.65;
    const radius = phase.trunkHeight * 0.75;
    const auraColors = {
      spring: [0x80ff80, 0x40e040],
      summer: [0x60ff40, 0x20c020],
      autumn: [0xff8020, 0xe05010],
      winter: [0xa0c8ff, 0x6090d0],
    };
    const [c1] = auraColors[seasonId] || [0x80ff80];
    const pulse = 0.03 + 0.025 * Math.sin(t * 0.8);
    g.fillStyle(c1, pulse);
    g.fillCircle(cx, cy, radius);
  }

  // ─── Laubdach-Glühen ─────────────────────────────────────────────────────

  _drawCanopyGlow(cx, trunkTop, phase, t, seasonId) {
    if (phase.levels < 3) return;
    const g      = this.graphics;
    const cy     = trunkTop - phase.trunkHeight * 0.15;
    const r      = phase.trunkHeight * 0.55;
    const colors = this._leafColors(seasonId, this._visuals);
    const alpha  = 0.06 + 0.04 * Math.sin(t * 0.6);
    g.fillStyle(colors[0], alpha);
    g.fillEllipse(cx, cy, r * 2.2, r * 1.4);
  }

  // ─── Myzel ────────────────────────────────────────────────────────────────

  _drawMycel(cx, groundY, phase, t) {
    const g      = this.graphics;
    const spread = phase.trunkHeight * 1.5;
    for (let i = 0; i < 20; i++) {
      const ang   = (i / 20) * Math.PI * 2;
      const r     = spread * (0.45 + 0.55 * Math.abs(Math.sin(t * 0.28 + i * 0.5)));
      const ex    = cx + Math.cos(ang) * r;
      const ey    = groundY + 6 + Math.sin(ang) * 18;
      const alpha = 0.10 + 0.08 * Math.sin(t * 0.45 + i);
      g.lineStyle(1, 0xf0e8c0, alpha);
      g.beginPath(); g.moveTo(cx, groundY); g.lineTo(ex, ey); g.strokePath();
    }
  }

  // ─── Flechten ─────────────────────────────────────────────────────────────

  _drawLichens(cx, groundY, phase, t) {
    const g       = this.graphics;
    const top     = groundY - phase.trunkHeight;
    const segs    = 10;
    for (let i = 0; i < segs; i++) {
      const y    = top + (phase.trunkHeight * i) / segs;
      const side = i % 2 === 0 ? 1 : -1;
      const xOff = side * (phase.trunkWidth * 0.38 + Math.sin(i * 1.9 + t * 0.18) * 4);
      const r    = 3.5 + Math.sin(t * 0.38 + i) * 1.8;
      g.fillStyle(0x70b050, 0.32 + 0.16 * Math.sin(t * 0.28 + i));
      g.fillCircle(cx + xOff, y, r);
    }
  }

  // ─── Wurzeln ──────────────────────────────────────────────────────────────

  _drawRoots(cx, groundY, phase, t) {
    const g         = this.graphics;
    const rootCount = 7;
    for (let i = 0; i < rootCount; i++) {
      const frac  = i / (rootCount - 1);
      const angle = Phaser.Math.DegToRad(-165 + frac * 150);
      const len   = phase.trunkHeight * (0.42 + 0.18 * Math.abs(Math.sin(i * 1.2)));
      const ex    = cx  + Math.cos(angle) * len;
      const ey    = groundY + Math.abs(Math.sin(angle)) * len * 0.45;
      const cp1x  = cx  + Math.cos(angle) * len * 0.28 + Math.sin(i * 0.9) * 12;
      const cp1y  = groundY + 18 + Math.cos(i * 0.7) * 10;
      const cp2x  = cx  + Math.cos(angle) * len * 0.62 + Math.sin(i * 1.3) * 9;
      const cp2y  = groundY + Math.abs(Math.sin(angle)) * len * 0.28 + 8;
      const w     = Math.max(1.2, phase.trunkWidth * 0.14 - i * 0.25);
      g.lineStyle(w, 0x5c3a1e, 0.78);
      this._drawCurve(g, cx, groundY, cp1x, cp1y, cp2x, cp2y, ex, ey, 16);
      // Sub-Wurzel
      if (phase.levels >= 2 && i % 2 === 0) {
        const ba  = angle + Phaser.Math.DegToRad(i % 2 === 0 ? 18 : -18);
        const bl  = len * 0.42;
        const bx  = ex + Math.cos(ba) * bl;
        const by  = ey + Math.abs(Math.sin(ba)) * bl * 0.38;
        g.lineStyle(Math.max(1, w * 0.45), 0x4a2e14, 0.52);
        g.beginPath(); g.moveTo(ex, ey); g.lineTo(bx, by); g.strokePath();
      }
    }
  }

  // ─── Stamm ────────────────────────────────────────────────────────────────

  _drawTrunk(cx, groundY, phase, t, seasonId) {
    const g        = this.graphics;
    const top      = groundY - phase.trunkHeight;
    const segCount = 20;
    const segH     = phase.trunkHeight / segCount;

    for (let i = 0; i < segCount; i++) {
      const fi   = i / segCount;
      const w    = phase.trunkWidth * (1 - fi * 0.40);
      const y    = groundY - i * segH;
      const r    = Math.max(0, Math.floor(0x62 - fi * 10));
      const gv   = Math.max(0, Math.floor(0x3e - fi * 8));
      const b    = Math.max(0, Math.floor(0x20 - fi * 5));
      g.fillStyle((r << 16) | (gv << 8) | b, 1);
      g.fillRect(cx - w / 2, y - segH, w, segH + 1);
    }

    // Highlight-Streifen links
    g.fillStyle(0xb08858, 0.20);
    g.fillRect(cx - phase.trunkWidth * 0.14, top, phase.trunkWidth * 0.13, phase.trunkHeight);

    // Rinden-Zickzack-Textur
    const knotCount = Math.min(6, phase.levels + 2);
    for (let i = 0; i < knotCount; i++) {
      const ky = top + phase.trunkHeight * (0.12 + i * 0.15);
      const kw = phase.trunkWidth * (0.52 - i * 0.03);
      g.lineStyle(1.4, 0x3a2010, 0.28);
      // Zickzack statt gerade Linie
      g.beginPath();
      const steps = 5;
      for (let s = 0; s <= steps; s++) {
        const sx  = (cx - kw) + (kw * 2 * s / steps);
        const sy  = ky + (s % 2 === 0 ? 0 : 4);
        if (s === 0) g.moveTo(sx, sy); else g.lineTo(sx, sy);
      }
      g.strokePath();
      // Knoten-Ellipse
      g.fillStyle(0x3a2010, 0.18);
      g.fillEllipse(cx + Math.sin(i * 1.7) * kw * 0.4, ky + 2, kw * 0.32, 5);
    }
  }

  // ─── Äste (rekursiv) ──────────────────────────────────────────────────────

  _drawBranches(cx, cy, angle, length, levels, phase, t, seasonId, depth) {
    if (levels <= 0 || length < 4) return;
    const g       = this.graphics;
    const windAmp = 1.8 + depth * 1.1;
    const swing   = Math.sin(t * 0.52 + depth * 1.4 + cx * 0.01) * windAmp;
    const rad     = (angle + swing) * (Math.PI / 180);
    const ex      = cx + Math.cos(rad) * length;
    const ey      = cy + Math.sin(rad) * length;
    const w       = Math.max(0.8, phase.trunkWidth * 0.068 * (length / phase.trunkHeight));
    const br      = Math.max(0x28, 0x5a - depth * 5);
    g.lineStyle(w, (br << 16) | (0x26 << 8) | 0x0e, 0.90);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.strokePath();

    // Blätter an Astenden UND Astmitte bei späteren Phasen
    this._drawLeafCluster(ex, ey, length, phase, t, seasonId, depth);
    if (levels > 3 && length > phase.trunkHeight * 0.08) {
      const mx = cx + Math.cos(rad) * length * 0.5;
      const my = cy + Math.sin(rad) * length * 0.5;
      this._drawLeafCluster(mx, my, length * 0.5, phase, t, seasonId, depth + 1);
    }

    const spread = phase.branchAngle;
    this._drawBranches(ex, ey, angle - spread, length * 0.67, levels - 1, phase, t, seasonId, depth + 1);
    this._drawBranches(ex, ey, angle + spread, length * 0.67, levels - 1, phase, t, seasonId, depth + 1);
    if (levels > 2) {
      this._drawBranches(ex, ey, angle, length * 0.52, levels - 1, phase, t, seasonId, depth + 1);
    }
  }

  // ─── Blatt-Cluster (dichte Laubmassen) ───────────────────────────────────
  // WICHTIG: Schwellenwert sehr niedrig, damit auch Phase 0/1 Blätter hat.

  _drawLeafCluster(cx, cy, length, phase, t, seasonId, depth) {
    // Nur für sehr kurze Äste in der allerersten Phase weglassen
    if (length < 8) return;
    const g      = this.graphics;
    const count  = Math.max(3, Math.floor(phase.leafDensity * 6));
    const colors = this._leafColors(seasonId, this._visuals);
    const sz     = Math.max(6, phase.leafSize);

    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2;
      const wobble    = Math.sin(t * 0.28 + i * 0.9 + depth * 0.6) * 0.35;
      const finalAng  = baseAngle + wobble;
      const spread    = sz * (0.30 + 0.55 * Math.abs(Math.sin(i * 1.05 + t * 0.07)));
      const lx        = cx + Math.cos(finalAng) * spread;
      const ly        = cy + Math.sin(finalAng) * spread * 0.62;
      const col       = colors[i % colors.length];
      const alpha     = 0.55 + 0.35 * Math.sin(t * 0.32 + i * 0.85 + depth);

      // Polygon-Blatt (6-Eck leicht verformt) statt einfacher Ellipse
      this._drawLeafShape(g, lx, ly, sz * (0.55 + 0.35 * Math.sin(i * 0.7)),
        finalAng, col, alpha);
    }

    // Zusätzliche Ellipse als Grundlage für Laubdichte
    const baseCol   = colors[0];
    const baseAlpha = 0.18 + 0.12 * Math.sin(t * 0.4 + depth);
    g.fillStyle(baseCol, baseAlpha);
    g.fillEllipse(cx, cy, sz * 1.8, sz * 1.2);
  }

  _drawLeafShape(g, cx, cy, size, rotation, color, alpha) {
    g.fillStyle(color, alpha);
    // Einfache Ellipse mit leichter Neigung – zuverlässig in Phaser 3
    const w = size * 1.15;
    const h = size * 0.72;
    g.fillEllipse(cx, cy, w, h);
    // Blattrippe
    const blen = size * 0.4;
    g.lineStyle(0.6, color, alpha * 0.5);
    g.beginPath();
    g.moveTo(cx - Math.cos(rotation) * blen * 0.5, cy - Math.sin(rotation) * blen * 0.5);
    g.lineTo(cx + Math.cos(rotation) * blen * 0.5, cy + Math.sin(rotation) * blen * 0.5);
    g.strokePath();
  }

  _leafColors(seasonId, v) {
    if (v?.goldenLeaves) return [0xffd700, 0xffa500, 0xff8c00, 0xffb830];
    switch (seasonId) {
      case 'spring': return [0x5ecb40, 0x7de860, 0x3aa820, 0x9aee70, 0x4ab838];
      case 'summer': return [0x28a020, 0x50c840, 0x1e8018, 0x38b828, 0x60d050];
      case 'autumn': return [0xe05020, 0xd08010, 0xb84010, 0xe8a020, 0xc03010, 0xf0b840];
      case 'winter': return [0xd0e8f0, 0xb0d0e0, 0x8090a0, 0xc0d8ee];
      default:       return [0x40a030, 0x58b840];
    }
  }

  // ─── Symbionten ───────────────────────────────────────────────────────────

  _drawSymbionts(cx, groundY, phase, t, v) {
    const list = phase.symbionts || [];
    const g    = this.graphics;

    if (list.includes('mushroom') || v.mushroomAura) {
      for (let i = 0; i < 5; i++) {
        const mx = cx - phase.trunkWidth * 0.7 + i * phase.trunkWidth * 0.34;
        const my = groundY - 2;
        g.fillStyle(0xf0e8d0, 0.88); g.fillRect(mx - 2, my - 8, 4, 9);
        g.fillStyle(0xb03010, 0.82); g.fillEllipse(mx, my - 9, 14, 8);
        g.fillStyle(0xffffff, 0.28); g.fillEllipse(mx - 2, my - 11, 5, 3);
        g.fillStyle(0xffffff, 0.65); g.fillCircle(mx + 2.5, my - 10, 1.2);
        g.fillStyle(0xffffff, 0.55); g.fillCircle(mx - 1.5, my - 9,  0.9);
      }
    }

    if (list.includes('moss') || v.mossLayer) {
      for (let i = 0; i < 12; i++) {
        const mx = cx - phase.trunkWidth * 0.55 + i * phase.trunkWidth * 0.10;
        const my = groundY - 3 - (i % 3) * 2;
        g.fillStyle(0x508030, 0.38 + 0.22 * Math.sin(t * 0.28 + i));
        g.fillCircle(mx, my, 4.5 + Math.sin(t * 0.38 + i) * 1.8);
      }
    }

    if (list.includes('owl')) {
      const ox = cx + phase.trunkWidth * 0.72;
      const oy = groundY - phase.trunkHeight * 0.58 + Math.sin(t * 0.48) * 3;
      g.fillStyle(0x7a5838, 0.90); g.fillEllipse(ox, oy, 16, 22);
      g.fillStyle(0x8a6040, 0.90); g.fillCircle(ox, oy - 12, 9);
      g.fillStyle(0xf8e8a0, 0.92); g.fillCircle(ox - 3.5, oy - 13, 4.8);
      g.fillStyle(0xf8e8a0, 0.92); g.fillCircle(ox + 3.5, oy - 13, 4.8);
      g.fillStyle(0x101010, 1);    g.fillCircle(ox - 3.5, oy - 13, 2.4);
      g.fillStyle(0x101010, 1);    g.fillCircle(ox + 3.5, oy - 13, 2.4);
      g.fillStyle(0xe0a020, 0.92);
      g.fillTriangle(ox - 2, oy - 10.5, ox + 2, oy - 10.5, ox, oy - 7.5);
      g.fillStyle(0x7a5838, 0.82);
      g.fillTriangle(ox - 5, oy - 20, ox - 8.5, oy - 27, ox - 2, oy - 20);
      g.fillTriangle(ox + 5, oy - 20, ox + 8.5, oy - 27, ox + 2, oy - 20);
    }

    if (list.includes('deer')) {
      const dx = cx - phase.trunkWidth * 1.35 + Math.sin(t * 0.20) * 7;
      const dy = groundY - 11;
      g.fillStyle(0xc08050, 0.84); g.fillEllipse(dx, dy, 24, 15);
      g.fillStyle(0xb07040, 0.84); g.fillEllipse(dx + 9, dy - 7, 11, 13);
      g.fillStyle(0xba7848, 0.84); g.fillCircle(dx + 12, dy - 12, 6.5);
      g.lineStyle(2.2, 0x7a5020, 0.92);
      const antlerBase = [[dx+10,dy-18],[dx+14,dy-17]];
      for (const [bx,by] of antlerBase) {
        const dir = bx < cx ? -1 : 1;
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + dir*3, by-10); g.strokePath();
        g.beginPath(); g.moveTo(bx + dir*3, by-7); g.lineTo(bx + dir*7, by-10); g.strokePath();
        g.beginPath(); g.moveTo(bx + dir*3, by-7); g.lineTo(bx + dir*5, by-12); g.strokePath();
      }
      g.lineStyle(2, 0x8a5828, 0.78);
      for (let i = 0; i < 4; i++) {
        const lx = dx - 7 + i * 6;
        g.beginPath(); g.moveTo(lx, dy+6); g.lineTo(lx + (i%2 ? 1:-1), dy+15); g.strokePath();
      }
    }

    if (list.includes('firefly') || v.glowingSpores) {
      for (let i = 0; i < 10; i++) {
        const off = this._symbontOffsets[i];
        const fx  = cx + Math.cos(off.angle + t * 0.38) * phase.trunkHeight * 0.82;
        const fy  = groundY - phase.trunkHeight * 0.28 + Math.sin(off.angle + t * 0.55) * 44;
        const a   = 0.45 + 0.55 * Math.sin(t * off.speed + off.phase);
        g.fillStyle(0xc0ff40, a * 0.28); g.fillCircle(fx, fy, 6);
        g.fillStyle(0xd8ff60, a);        g.fillCircle(fx, fy, 2.2);
      }
    }

    if (list.includes('bee')) {
      const bx = cx + Math.cos(t * 1.18) * phase.trunkHeight * 0.62;
      const by = groundY - phase.trunkHeight * 0.52 + Math.sin(t * 1.48) * 32;
      const wa = 0.38 + 0.52 * Math.abs(Math.sin(t * 20));
      g.fillStyle(0xc8f0ff, wa);
      g.fillEllipse(bx - 4.5, by - 4, 9, 6);
      g.fillEllipse(bx + 4.5, by - 4, 9, 6);
      g.fillStyle(0xf0c020, 0.94); g.fillEllipse(bx, by, 9, 6);
      g.fillStyle(0x202020, 0.72); g.fillRect(bx - 2, by - 1, 5, 1.8);
      g.fillStyle(0xd0a010, 0.92); g.fillCircle(bx + 4.5, by, 2.8);
    }
  }

  // ─── Persistenz ───────────────────────────────────────────────────────────

  serialize() { return { phaseIndex: this.phaseIndex }; }
  restore(data) {
    if (!data) return;
    this.phaseIndex = data.phaseIndex ?? 0;
    this._leafCache = {};
  }
}
