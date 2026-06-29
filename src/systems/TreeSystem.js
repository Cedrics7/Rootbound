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
      levels:       Math.round(lerp(prev.levels, next.levels)),
      branchSpread: lerp(prev.branchSpread, next.branchSpread),
      leafColor:    this._lerpColor(prev.leafColor, next.leafColor, t),
    }, this._seasonId);
  }

  _lerpColor(c1, c2, t) {
    const r1=(c1>>16)&0xff,g1=(c1>>8)&0xff,b1=c1&0xff;
    const r2=(c2>>16)&0xff,g2=(c2>>8)&0xff,b2=c2&0xff;
    return ((Math.round(r1+(r2-r1)*t)<<16)|(Math.round(g1+(g2-g1)*t)<<8)|Math.round(b1+(b2-b1)*t));
  }

  // ── Öffentliche API ────────────────────────────────────────────

  draw(seasonId = 'spring', visuals = {}) {
    this._visuals  = visuals;
    this._seasonId = seasonId;
  }

  tick(delta) {
    this._time += delta;
    if (!this.isGrowing) this._drawTree(this.phase, this._seasonId);
  }

  // ── Wind ─────────────────────────────────────────────────────

  _windStrength(s) { return {spring:1.0,summer:0.6,autumn:2.0,winter:1.5}[s]??1.0; }

  // ── Haupt-Render ─────────────────────────────────────────────

  _drawTree(phase, seasonId) {
    this.graphics.clear();
    const cx = this._cx, groundY = this._groundY;
    const t  = this._time / 1000;
    const v  = this._visuals;

    if (v.showMycel)  this._drawMycel(cx, groundY, phase, t, v);
    if (v.lichens)    this._drawLichens(cx, groundY, phase, t, v);
    this._drawRoots(cx, groundY, phase, t, v);
    this._drawTrunk(cx, groundY, phase, t, seasonId, v);
    const trunkTop = groundY - phase.trunkHeight;
    this._drawBranches(cx, trunkTop, -90, phase.trunkHeight * 0.55, phase.levels, phase, t, seasonId, v);
    this._drawSymbionts(cx, groundY, phase, t, v);
  }

  // ── Myzel ───────────────────────────────────────────────────

  _drawMycel(cx, groundY, phase, t, v) {
    const g = this.graphics;
    const density = v.mycelDensity || 1;
    const count   = 9 * density;
    const spread  = phase.trunkHeight * 1.4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const alpha = (v.mycelGlow ? 0.3 : 0.15) + 0.1 * Math.sin(t * 1.5 + i);
      const color = v.mycelGlow ? 0xc0ff80 : 0x90c060;
      g.lineStyle(1, color, alpha);
      const ex = cx + Math.cos(angle) * spread;
      const ey = groundY + Math.sin(angle) * spread * 0.22 + 15;
      const mx = cx + Math.cos(angle) * spread * 0.45 + Math.sin(t + i) * 8;
      const my = groundY + 20 + Math.cos(t * 0.7 + i) * 6;
      g.beginPath(); g.moveTo(cx, groundY + 8); g.lineTo(mx, my); g.lineTo(ex, ey); g.strokePath();
      g.fillStyle(color, v.mycelGlow ? 0.5 : 0.3);
      g.fillCircle(ex, ey, v.mycelGlow ? 4 : 3);
    }
    // Pilze am Boden
    for (let i = 0; i < 3 * density; i++) {
      const mx2 = cx + Math.cos(i * 1.3) * spread * 0.6;
      const my2 = groundY + Math.sin(i * 0.9) * 10 + 5;
      g.fillStyle(0xe0a060, 0.7);
      g.fillCircle(mx2, my2, 4 + i % 3);
      g.fillStyle(0x8a3010, 0.85);
      g.fillRect(mx2 - 1.5, my2, 3, 6);
    }
  }

  // ── Flechten ───────────────────────────────────────────────

  _drawLichens(cx, groundY, phase, t, v) {
    const g = this.graphics;
    const trunkTop = groundY - phase.trunkHeight;
    const segs     = v.lichenDense ? 12 : 6;
    const color    = v.lichenGlow ? 0x90ffb0 : 0x70a050;
    for (let i = 0; i < segs; i++) {
      const y   = trunkTop + (phase.trunkHeight * i) / segs;
      const xOff = Math.sin(i * 2.1 + t * 0.2) * (phase.trunkWidth * 0.5);
      const r   = 3 + (i % 3) * 1.5;
      const alpha = v.lichenGlow ? 0.6 : 0.4;
      g.fillStyle(color, alpha);
      g.fillCircle(cx + xOff, y, r);
      g.fillCircle(cx - xOff * 0.7, y + 4, r * 0.7);
    }
  }

  // ── Stamm ───────────────────────────────────────────────────

  _drawTrunk(cx, groundY, phase, t, seasonId, v) {
    const g   = this.graphics;
    const top = groundY - phase.trunkHeight;
    const wind = this._windStrength(seasonId);
    let baseColors = v.trunkColorTint
      ? [v.trunkColorTint, (v.trunkColorTint + 0x202020) & 0xffffff, (v.trunkColorTint + 0x404040) & 0xffffff]
      : [0x3d2010, 0x5a3018, 0x7a4820];
    const segCount = 7;
    const segH     = phase.trunkHeight / segCount;
    for (let i = 0; i < segCount; i++) {
      const fi   = i / segCount;
      const w    = phase.trunkWidth * (1 - fi * 0.33);
      const sway = Math.sin(t * 0.9 + i * 0.25) * fi * wind * 4;
      const y0   = top + i * segH;
      const col  = baseColors[Math.min(i, baseColors.length - 1)];
      g.fillStyle(col, 1);
      g.fillRect(cx - w / 2 + sway, y0, w, segH + 1);
    }
    // Highlight
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(cx - phase.trunkWidth * 0.15, top, phase.trunkWidth * 0.15, phase.trunkHeight);
    // Narben (dicke Rinde)
    if (v.trunkScar) {
      g.lineStyle(1.5, 0x201008, 0.5);
      for (let i = 0; i < 4; i++) {
        const sy = top + phase.trunkHeight * (0.2 + i * 0.18);
        g.beginPath(); g.moveTo(cx - phase.trunkWidth * 0.4, sy);
        g.lineTo(cx + phase.trunkWidth * 0.3, sy + 6); g.strokePath();
      }
    }
    // Glanz (Feuerrinde / Weltrinde)
    if (v.trunkGlow) {
      g.fillStyle(v.trunkGlow, 0.12);
      g.fillRect(cx - phase.trunkWidth * 0.6, top, phase.trunkWidth * 1.2, phase.trunkHeight);
    }
  }

  // ── Wurzeln ─────────────────────────────────────────────────

  _drawRoots(cx, groundY, phase, t, v) {
    const g          = this.graphics;
    const baseCount  = 3 + this.phaseIndex;
    const total      = baseCount + (v.rootExtra || 0);
    const len        = phase.trunkHeight * 0.32 + (v.rootExtra || 0) * 5;
    const color      = v.rootGlow ? 0x70e040 : 0x3d2010;
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI + Math.PI * 0.06;
      const sway  = Math.sin(t * 0.4 + i * 0.8) * 2;
      const alpha = v.rootGlow ? 0.85 : 0.75;
      g.lineStyle(Math.max(1.5, phase.trunkWidth * 0.33 - i * 0.2), color, alpha);
      g.beginPath();
      g.moveTo(cx, groundY);
      g.lineTo(cx + Math.cos(angle) * len + sway, groundY + Math.sin(angle) * len * 0.42);
      g.strokePath();
    }
    if (v.rootGlow) {
      // Leuchtende Wurzel-Spitzen
      for (let i = 0; i < Math.min(total, 8); i++) {
        const angle = (i / total) * Math.PI + Math.PI * 0.06;
        const tx    = cx + Math.cos(angle) * len * 0.9;
        const ty    = groundY + Math.sin(angle) * len * 0.38;
        g.fillStyle(0xa0ff60, 0.35 + 0.15 * Math.sin(t + i));
        g.fillCircle(tx, ty, 5);
      }
    }
  }

  // ── Äste (rekursiv) ────────────────────────────────────────────

  _drawBranches(x, y, angle, length, depth, phase, t, seasonId, v) {
    if (depth === 0 || length < 7) return;
    const g    = this.graphics;
    const wind = this._windStrength(seasonId);
    const rad  = (angle * Math.PI) / 180;
    const sway = Math.sin(t * 0.9 + depth * 0.7 + x * 0.005) * (phase.levels - depth + 1) * wind * 1.4;
    const ex   = x + Math.cos(rad) * length + sway;
    const ey   = y + Math.sin(rad) * length;
    const thick = Math.max(1, phase.trunkWidth * 0.12 * (depth / phase.levels));
    g.lineStyle(thick, 0x5a3820, 1);
    g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.strokePath();
    if (depth === 1) this._drawLeaf(ex, ey, phase, t, seasonId, v);
    const spread = phase.branchSpread / phase.levels;
    this._drawBranches(ex, ey, angle - spread, length * 0.68, depth - 1, phase, t, seasonId, v);
    this._drawBranches(ex, ey, angle + spread, length * 0.68, depth - 1, phase, t, seasonId, v);
  }

  // ── Blatt ─────────────────────────────────────────────────────

  _drawLeaf(x, y, phase, t, seasonId, v) {
    const g = this.graphics;
    const seasonColors = { spring: 0x4ab830, summer: 0x2a8010, autumn: 0xc85010, winter: 0x1a3018 };
    let leafColor = v.leafColor ?? (seasonColors[seasonId] ?? phase.leafColor);
    if (seasonId === 'winter' && Math.random() < 0.65) return;
    if (seasonId === 'autumn' && Math.random() < 0.22) return;
    const baseR  = 9 + this.phaseIndex * 3.5;
    const sizeM  = 1 + (v.leafSizeBonus || 0);
    const leafR  = baseR * sizeM;
    const pulse  = v.leafGlow ? 1 + 0.15 * Math.sin(t * 2.5 + x * 0.05) : 1;
    g.fillStyle(leafColor, 0.88);
    g.fillCircle(x, y, leafR * pulse);
    if (v.leafGlow) {
      const glowR = v.glowRadius ?? 1.6;
      g.fillStyle(leafColor, 0.18);
      g.fillCircle(x, y, leafR * glowR * pulse);
    }
    if (seasonId === 'spring' && Math.random() < 0.28) {
      g.fillStyle(0xffb8c8, 0.7);
      g.fillCircle(x, y, leafR * 0.32);
    }
    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(x - leafR * 0.28, y - leafR * 0.32, leafR * 0.38);
  }

  // ── Symbionten ──────────────────────────────────────────────

  _drawSymbionts(cx, groundY, phase, t, v) {
    const g = this.graphics;
    const list = v.symbionts || [];
    const trunkTop = groundY - phase.trunkHeight;

    // Moos auf Stamm
    if (v.lichens && list.includes('moss')) {
      for (let i = 0; i < 8; i++) {
        const y = trunkTop + phase.trunkHeight * (0.3 + i * 0.08);
        g.fillStyle(0x50a040, 0.5);
        g.fillCircle(cx - phase.trunkWidth * 0.55, y, 4);
      }
    }

    // Eule auf Ast
    if (list.includes('owl')) {
      const owlX = cx + phase.trunkWidth * 2.2;
      const owlY = trunkTop + phase.trunkHeight * 0.25 + Math.sin(t * 0.3) * 3;
      g.fillStyle(0x605040, 0.9);
      g.fillCircle(owlX, owlY, 8);
      g.fillStyle(0xffd060, 0.9);
      g.fillCircle(owlX - 3, owlY - 2, 2.5);
      g.fillCircle(owlX + 3, owlY - 2, 2.5);
    }

    // Hirsch am Boden
    if (list.includes('deer')) {
      const dx = cx + phase.trunkHeight * 0.55;
      const dy = groundY - 18 + Math.sin(t * 0.2) * 2;
      g.fillStyle(0xa06030, 0.85);
      g.fillRect(dx, dy, 14, 10);
      g.fillRect(dx + 4, dy - 8, 6, 8);
      g.fillStyle(0x804020, 0.9);
      // Geweih
      g.lineStyle(1.5, 0x804020, 0.9);
      g.beginPath(); g.moveTo(dx + 5, dy - 8); g.lineTo(dx + 2, dy - 18); g.strokePath();
      g.beginPath(); g.moveTo(dx + 9, dy - 8); g.lineTo(dx + 12, dy - 18); g.strokePath();
    }

    // Glühwürmchen
    if (list.includes('firefly')) {
      const count = 6;
      for (let i = 0; i < count; i++) {
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
}
