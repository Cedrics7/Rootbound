import { TREE_PHASES } from '../config/seasons.js';

/**
 * TreeSystem – Rendering + Wachstum + Symbionten.
 * 5 Phasen, 6 Ast-Levels im Urbaum, animierte Symbionten (Pilze, Moos, Eule, Hirsch).
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
    // Feste zufällige Offsets damit Symbionten nicht bei jedem Frame springen
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

  _drawRoots(cx, groundY, phase, t, v) {
    const g       = this.graphics;
    const rootCount = 5;
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI - Math.PI * 0.15;
      const len   = phase.trunkHeight * 0.55;
      const ex    = cx + Math.cos(angle + Math.PI * 0.5) * len;
      const ey    = groundY + Math.sin(angle + Math.PI * 0.5) * len * 0.35;
      const w     = Math.max(1, phase.trunkWidth * 0.12 - i * 0.4);
      g.lineStyle(w, 0x5c3a1e, 0.7);
      g.beginPath();
      g.moveTo(cx, groundY);
      g.quadraticBezierTo(
        cx + (ex - cx) * 0.4, groundY + 20,
        ex, ey
      );
      g.strokePath();
    }
  }

  // ── Stamm ─────────────────────────────────────────────────────

  _drawTrunk(cx, groundY, phase, t, seasonId, v) {
    const g        = this.graphics;
    const top      = groundY - phase.trunkHeight;
    const segCount = 12;
    const segH     = phase.trunkHeight / segCount;
    for (let i = 0; i < segCount; i++) {
      const fi   = i / segCount;
      const w    = phase.trunkWidth * (1 - fi * 0.33);
      const y    = groundY - i * segH;
      const dark = Math.floor(0x5c * (1 - fi * 0.2));
      const light= Math.floor(0x3a * (1 - fi * 0.15));
      const col  = (dark << 16) | (light << 8) | Math.floor(0x1e * (1 - fi * 0.1));
      g.fillStyle(col, 1);
      g.fillRect(cx - w / 2, y - segH, w, segH + 1);
    }
    // Highlight-Streifen
    g.fillStyle(0xa0724a, 0.25);
    g.fillRect(cx - phase.trunkWidth * 0.15, top, phase.trunkWidth * 0.15, phase.trunkHeight);
    // Astnarben
    if (phase.levels >= 2) {
      for (let i = 0; i < 3; i++) {
        const sy = top + phase.trunkHeight * (0.2 + i * 0.18);
        g.beginPath(); g.moveTo(cx - phase.trunkWidth * 0.4, sy);
        g.lineTo(cx + phase.trunkWidth * 0.3, sy + 6); g.strokePath();
      }
    }
  }

  // ── Äste (rekursiv) ───────────────────────────────────────────

  _drawBranches(cx, cy, angle, length, levels, phase, t, seasonId, v, depth = 0) {
    if (levels <= 0 || length < 6) return;
    const g      = this.graphics;
    const swing  = Math.sin(t * 0.6 + depth) * 2;
    const rad    = (angle + swing) * (Math.PI / 180);
    const ex     = cx + Math.cos(rad) * length;
    const ey     = cy + Math.sin(rad) * length;
    const w      = Math.max(1, phase.trunkWidth * 0.08 * (length / phase.trunkHeight));
    g.lineStyle(w, 0x5c3a1e, 0.85);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(ex, ey);
    g.strokePath();
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
    if (length < phase.trunkHeight * 0.12) return;
    const g     = this.graphics;
    const count = Math.floor(phase.leafDensity * 4);
    const colors = this._leafColors(seasonId, v);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t * 0.15;
      const r     = phase.leafSize * (0.4 + 0.6 * Math.random());
      const lx    = cx + Math.cos(angle) * r;
      const ly    = cy + Math.sin(angle) * r * 0.6;
      const col   = colors[i % colors.length];
      const alpha = 0.55 + 0.35 * Math.sin(t * 0.4 + i + depth);
      g.fillStyle(col, alpha);
      g.fillEllipse(lx, ly, phase.leafSize * 1.1, phase.leafSize * 0.75);
    }
  }

  _leafColors(seasonId, v) {
    const golden = v.goldenLeaves;
    if (golden) return [0xffd700, 0xffa500, 0xff8c00];
    switch (seasonId) {
      case 'spring': return [0x5ecb40, 0x7de860, 0x3aa820];
      case 'summer': return [0x28a020, 0x50c840, 0x1e8018];
      case 'autumn': return [0xe05020, 0xd08010, 0xb84010, 0xe8a020];
      case 'winter': return [0xd0e8f0, 0xb0d0e0, 0x8090a0];
      default:       return [0x40a030];
    }
  }

  // ── Symbionten ────────────────────────────────────────────────

  _drawSymbionts(cx, groundY, phase, t, v) {
    const list = phase.symbionts || [];
    const g    = this.graphics;

    // Pilze
    if (list.includes('mushroom') || v.mushroomAura) {
      for (let i = 0; i < 5; i++) {
        const off = this._symbontOffsets[i];
        const mx  = cx - phase.trunkWidth * 0.6 + i * phase.trunkWidth * 0.3;
        const my  = groundY + 2;
        g.fillStyle(0xb03010, 0.75);
        g.fillEllipse(mx, my, 12, 6);
        g.fillStyle(0xf8f0e0, 0.9);
        g.fillRect(mx - 2, my, 4, 7);
      }
    }

    // Moos
    if (list.includes('moss') || v.mossLayer) {
      for (let i = 0; i < 8; i++) {
        const off = this._symbontOffsets[i + 5];
        const mx  = cx - phase.trunkWidth * 0.4 + i * phase.trunkWidth * 0.1;
        const my  = groundY - 4 - i * 2;
        g.fillStyle(0x508030, 0.45 + 0.2 * Math.sin(t * 0.3 + i));
        g.fillCircle(mx, my, 4 + Math.sin(t * 0.4 + i) * 1.5);
      }
    }

    // Eule
    if (list.includes('owl')) {
      const ox = cx + phase.trunkWidth * 0.6;
      const oy = groundY - phase.trunkHeight * 0.55 + Math.sin(t * 0.5) * 4;
      g.fillStyle(0x806040, 0.85); g.fillEllipse(ox, oy, 14, 18);
      g.fillStyle(0xf0e0a0, 0.9);  g.fillCircle(ox - 3, oy - 3, 4);
      g.fillStyle(0xf0e0a0, 0.9);  g.fillCircle(ox + 3, oy - 3, 4);
      g.fillStyle(0x202020, 1);    g.fillCircle(ox - 3, oy - 3, 2);
      g.fillStyle(0x202020, 1);    g.fillCircle(ox + 3, oy - 3, 2);
    }

    // Hirsch
    if (list.includes('deer')) {
      const dx = cx - phase.trunkWidth * 1.2 + Math.sin(t * 0.2) * 8;
      const dy = groundY - 10;
      g.fillStyle(0xc08050, 0.8); g.fillEllipse(dx, dy, 20, 14);
      g.fillStyle(0xc08050, 0.8); g.fillCircle(dx + 8, dy - 6, 7);
      g.lineStyle(2, 0x806030, 0.9);
      g.beginPath(); g.moveTo(dx + 10, dy - 12); g.lineTo(dx + 14, dy - 22); g.strokePath();
      g.beginPath(); g.moveTo(dx + 10, dy - 12); g.lineTo(dx + 6,  dy - 22); g.strokePath();
    }

    // Glühwürmchen
    if (list.includes('firefly') || v.glowingSpores) {
      for (let i = 0; i < 8; i++) {
        const off = this._symbontOffsets[i];
        const fx  = cx + Math.cos(off.angle + t * 0.4) * phase.trunkHeight * 0.8;
        const fy  = groundY - phase.trunkHeight * 0.3 + Math.sin(off.angle + t * 0.6) * 40;
        const a   = 0.5 + 0.5 * Math.sin(t * off.speed + off.phase);
        g.fillStyle(0xc0ff40, a);
        g.fillCircle(fx, fy, 2.5);
      }
    }

    // Biene
    if (list.includes('bee')) {
      const bx = cx + Math.cos(t * 1.2) * phase.trunkHeight * 0.6;
      const by = groundY - phase.trunkHeight * 0.5 + Math.sin(t * 1.5) * 30;
      g.fillStyle(0xf0c020, 0.9);
      g.fillCircle(bx, by, 4);
      g.fillStyle(0x202020, 0.7);
      g.fillRect(bx - 2, by - 1, 4, 2);
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
