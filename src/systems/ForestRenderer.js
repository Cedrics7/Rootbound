import { ROOT_DEPTH_LEVELS, FOREST_TREE_TYPES } from '../config/forest.js';

/**
 * ForestRenderer – zeichnet Waldbäume links/rechts vom Hauptbaum
 * und die tiefen Wurzelschichten unter der Erdoberfläche.
 *
 * Wird von GameScene jeden Frame aufgerufen (tick).
 */
export class ForestRenderer {
  constructor(scene, forestSystem) {
    this.scene   = scene;
    this.forest  = forestSystem;
    this.gfx     = scene.add.graphics().setDepth(3);   // hinter Hauptbaum (depth 4)
    this.rootGfx = scene.add.graphics().setDepth(2);   // Wurzel-Schichten noch weiter hinten
    this._time   = 0;
  }

  get _W()       { return this.scene.scale.width; }
  get _H()       { return this.scene.scale.height; }
  get _groundY() { return this._H * 0.78; }
  get _cx()      { return this._W * 0.5; }

  tick(delta, seasonId) {
    this._time += delta;
    this.gfx.clear();
    this.rootGfx.clear();
    this._drawRootDepths();
    this._drawForestTrees(seasonId);
  }

  // ── Tiefe Wurzelschichten ──────────────────────────────────────────────

  _drawRootDepths() {
    const g  = this.rootGfx;
    const W  = this._W;
    const H  = this._H;
    const gY = this._groundY;
    const cx = this._cx;
    const t  = this._time / 1000;
    const unlocked = this.forest.getUnlockedDepths();

    for (const depth of ROOT_DEPTH_LEVELS) {
      const isUnlocked = this.forest.isUnlocked(depth.id);
      const y = gY + H * depth.visual.depth * 0.28; // max 28% unter Boden sichtbar
      const alpha = isUnlocked ? 0.22 : 0.06;
      const color = depth.visual.color;

      // Horizontale Schicht-Linie
      g.lineStyle(isUnlocked ? 1.5 : 0.8, color, alpha);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.strokePath();

      // Schicht-Beschriftung (nur freigeschaltete)
      if (isUnlocked) {
        // Schicht-Färbung links
        g.fillStyle(color, alpha * 0.5);
        g.fillRect(0, y, W, 12);
      }
    }

    // Haupt-Wurzeln tief nach unten zeichnen (nur wenn >1 Ebene frei)
    if (unlocked.length > 1) {
      this._drawDeepRoots(cx, gY, unlocked, t);
    }
  }

  _drawDeepRoots(cx, gY, unlockedDepths, t) {
    const g = this.rootGfx;
    const H = this._H;
    const deepest = unlockedDepths[unlockedDepths.length - 1];
    const maxDepthY = gY + H * deepest.visual.depth * 0.28;

    // Zentrale Pfahlwurzel
    g.lineStyle(3, 0x4a2808, 0.7);
    g.beginPath();
    g.moveTo(cx, gY);
    g.lineTo(cx + Math.sin(t * 0.2) * 4, maxDepthY);
    g.strokePath();

    // Seitenwurzeln pro Tiefenebene
    unlockedDepths.forEach((depth, i) => {
      const y     = gY + H * depth.visual.depth * 0.28;
      const count = 2 + i;
      for (let j = 0; j < count; j++) {
        const side  = j % 2 === 0 ? 1 : -1;
        const spread = (30 + j * 25) * side;
        const sway  = Math.sin(t * 0.4 + j + i) * 3;
        const alpha = depth.visual.lineStyle === 'glow' ? 0.65 : 0.45;
        const color = depth.visual.color;
        g.lineStyle(Math.max(1, 3 - i * 0.4), color, alpha);
        g.beginPath();
        g.moveTo(cx, y - 10);
        g.lineTo(cx + spread + sway, y + 8);
        g.strokePath();
      }

      // Grundwasser: Leucht-Effekt
      if (depth.id === 'groundwater') {
        const pulse = 0.3 + 0.2 * Math.sin(t * 1.5);
        g.fillStyle(0x40a0f0, pulse);
        g.fillEllipse(cx, y + 6, 120, 10);
        for (let k = 0; k < 5; k++) {
          const bx = cx + (k - 2) * 28 + Math.sin(t * 0.8 + k) * 5;
          g.fillStyle(0x60c0ff, 0.4 + 0.2 * Math.sin(t + k));
          g.fillCircle(bx, y + 6, 4);
        }
      }

      // Fossilschicht: Knochen-Silhouetten
      if (depth.id === 'fossil') {
        g.fillStyle(0xd0c090, 0.25);
        g.fillEllipse(cx - 60, y + 4, 22, 8);
        g.fillEllipse(cx + 40, y + 6, 16, 6);
        g.fillCircle(cx + 80, y + 3, 6);
      }

      // Erdadern: Pulsierender Kern
      if (depth.id === 'earthcore') {
        const corePulse = 0.4 + 0.3 * Math.sin(t * 2.2);
        g.fillStyle(0xff6020, corePulse);
        g.fillEllipse(cx, y + 5, 80, 12);
        g.lineStyle(1, 0xff8040, 0.5);
        for (let k = 0; k < 6; k++) {
          const angle = (k / 6) * Math.PI * 2 + t * 0.5;
          g.beginPath();
          g.moveTo(cx, y + 5);
          g.lineTo(cx + Math.cos(angle) * 50, y + 5 + Math.sin(angle) * 8);
          g.strokePath();
        }
      }
    });
  }

  // ── Waldbäume ────────────────────────────────────────────────────────────

  _drawForestTrees(seasonId) {
    const g   = this.gfx;
    const gY  = this._groundY;
    const cx  = this._cx;
    const W   = this._W;
    const t   = this._time / 1000;

    // Slot-Positionen: abwechselnd links/rechts, mit zunehmendem Abstand
    const slotX = this._slotPositions();

    for (const tree of this.forest.trees) {
      const x = cx + slotX[tree.slot];
      this._drawForestTree(x, gY, tree, seasonId, t);
    }
  }

  _slotPositions() {
    // Slots: 0=links nah, 1=rechts nah, 2=links mittel, 3=rechts mittel ...
    const W = this._W;
    const base = W * 0.14;
    return [
      -base,       +base,
      -base * 1.9, +base * 1.9,
      -base * 2.8, +base * 2.8,
      -base * 3.6, +base * 3.6,
      -base * 4.2, +base * 4.2,
      -base * 4.8, +base * 4.8,
    ];
  }

  _drawForestTree(x, gY, treeEntry, seasonId, t) {
    const g    = this.gfx;
    const type = treeEntry.type;
    if (!type) return;
    const wind   = { spring:0.9, summer:0.5, autumn:1.8, winter:1.4 }[seasonId] ?? 1;
    const scale  = treeEntry.level === 1 ? 0.7 : 1.0;
    const tH     = type.trunkHeight * scale;
    const tW     = Math.max(4, tH * 0.08);
    const top    = gY - tH;

    // Stamm
    g.fillStyle(type.trunkColor, 1);
    g.fillRect(x - tW / 2, top, tW, tH);

    // Highlight
    g.fillStyle(0xffffff, 0.05);
    g.fillRect(x - tW * 0.15, top, tW * 0.15, tH);

    // Krone (rekursiv äste)
    const branchLen = tH * 0.55;
    this._forestBranch(x, top, -90, branchLen, type.levels, type, t, seasonId, wind, scale);

    // Wurzel-Verbindung zum Hauptbaum (Myzel-Linie unten)
    const cx = this._cx;
    if (this.forest.isUnlocked('humus')) {
      const alpha = 0.12 + 0.06 * Math.sin(t * 1.2 + x);
      g.lineStyle(1, 0x80c040, alpha);
      g.beginPath();
      g.moveTo(x, gY + 4);
      g.bezierCurveTo(x, gY + 18, cx, gY + 18, cx, gY + 4);
      g.strokePath();
    }
  }

  _forestBranch(x, y, angle, len, depth, type, t, seasonId, wind, scale) {
    if (depth === 0 || len < 5) return;
    const g   = this.gfx;
    const rad = (angle * Math.PI) / 180;
    const sway = Math.sin(t * 0.8 + depth * 0.6 + x * 0.003) * depth * wind * 1.2;
    const ex  = x + Math.cos(rad) * len + sway;
    const ey  = y + Math.sin(rad) * len;
    const thick = Math.max(1, (type.trunkHeight * scale * 0.06) * (depth / type.levels));
    g.lineStyle(thick, type.trunkColor, 0.9);
    g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.strokePath();
    if (depth === 1) this._forestLeaf(ex, ey, type, t, seasonId, scale);
    const spread = type.branchSpread / type.levels;
    this._forestBranch(ex, ey, angle - spread, len * 0.7, depth - 1, type, t, seasonId, wind, scale);
    this._forestBranch(ex, ey, angle + spread, len * 0.7, depth - 1, type, t, seasonId, wind, scale);
  }

  _forestLeaf(x, y, type, t, seasonId, scale) {
    const g = this.gfx;
    const seasonColors = { spring: 0x60c840, summer: 0x3a8820, autumn: 0xb84010, winter: 0x1a2818 };
    let col = seasonColors[seasonId] ?? type.leafColor;
    if (seasonId === 'winter' && Math.random() < 0.7) return;
    if (seasonId === 'autumn' && Math.random() < 0.3) return;
    const r = (6 + Math.random() * 3) * scale;
    g.fillStyle(col, 0.78);
    g.fillCircle(x, y, r);
    if (seasonId === 'spring' && Math.random() < 0.25) {
      g.fillStyle(0xffb8c8, 0.6);
      g.fillCircle(x, y, r * 0.3);
    }
  }
}
