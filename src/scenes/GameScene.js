import Phaser from 'phaser';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { TreeSystem } from '../systems/TreeSystem.js';
import { SEASONS } from '../config/seasons.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Systeme initialisieren ──────────────────────────────────────────
    this.resources = new ResourceSystem();
    this.seasons = new SeasonSystem(this._onSeasonChange.bind(this));
    this.tree = new TreeSystem(this);

    // ── Hintergrund ────────────────────────────────────────────────────
    this.bgGfx = this.add.graphics();
    this.groundGfx = this.add.graphics();

    // ── Partikel-Layer (Blätter/Schneeflocken) ─────────────────────────
    this.particles = this.add.graphics();
    this.particleList = [];

    // ── UI ─────────────────────────────────────────────────────────────
    this._buildUI();

    // ── Initiales Zeichnen ─────────────────────────────────────────────
    this._drawBackground(this.seasons.current);
    this.tree.draw(this.seasons.current.id);

    // ── Ressourcen-Tick (jede Sekunde) ─────────────────────────────────
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.resources.tick(this.seasons.current.id, this.tree.phaseIndex);
        this.tree.checkGrowth(this.resources);
        this._updateUI();
      },
    });

    // ── Jahreszeiten-Fortschrittsbalken ────────────────────────────────
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this._updateSeasonBar(),
    });

    // ── Klick auf Baum: Licht-Boost ────────────────────────────────────
    this.input.on('pointerdown', (ptr) => {
      const cx = W / 2;
      const treeCenterY = 600 - this.tree.phase.trunkHeight / 2;
      const dist = Phaser.Math.Distance.Between(ptr.x, ptr.y, cx, treeCenterY);
      if (dist < 120) {
        this.resources.spend({ light: -15 }); // negatives spend = hinzufügen
        this._showClickFeedback(ptr.x, ptr.y);
      }
    });

    // ── Partikel-Spawner ───────────────────────────────────────────────
    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => this._spawnParticle(),
    });
  }

  update(time, delta) {
    this.seasons.update(delta);
    this._updateParticles(delta);
  }

  // ────────────────────────────────────────────────────────────────────
  // Hintergrund
  // ────────────────────────────────────────────────────────────────────
  _drawBackground(season) {
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.bgGfx;
    g.clear();

    // Himmel – Gradient via 8 horizontale Streifen
    const topColor = Phaser.Display.Color.HexStringToColor(season.skyTop);
    const botColor = Phaser.Display.Color.HexStringToColor(season.skyBottom);
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(topColor.red   + t * (botColor.red   - topColor.red));
      const gg2 = Math.round(topColor.green + t * (botColor.green - topColor.green));
      const b = Math.round(topColor.blue  + t * (botColor.blue  - topColor.blue));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gg2, b), 1);
      g.fillRect(0, (H * i) / steps, W, H / steps + 1);
    }

    // Boden
    this.groundGfx.clear();
    const gc = Phaser.Display.Color.HexStringToColor(season.groundColor);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(gc.red, gc.green, gc.blue), 1);
    this.groundGfx.fillRect(0, 600, W, H - 600);

    // Gras-Hügel
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(
      Math.min(255, gc.red + 20),
      Math.min(255, gc.green + 20),
      Math.min(255, gc.blue + 10)
    ), 1);
    this.groundGfx.fillEllipse(W / 2, 600, W * 1.4, 80);
  }

  // ────────────────────────────────────────────────────────────────────
  // UI aufbauen
  // ────────────────────────────────────────────────────────────────────
  _buildUI() {
    const style = { fontFamily: 'Georgia, serif', fill: '#e8e0d0' };

    // Titel
    this.add.text(16, 14, '🌿 Rootbound', { ...style, fontSize: '22px', fill: '#a0d878' });

    // Jahreszeit
    this.seasonText = this.add.text(16, 46, '', { ...style, fontSize: '15px' });
    this.yearText   = this.add.text(16, 66, '', { ...style, fontSize: '13px', fill: '#a09888' });
    this.phaseText  = this.add.text(16, 86, '', { ...style, fontSize: '12px', fill: '#88b870' });

    // Ressourcen-Panel (rechts oben)
    const rx = 820;
    this.add.text(rx, 14, 'Ressourcen', { ...style, fontSize: '14px', fill: '#a0d878' });

    this.resTexts = {};
    this.resBars  = {};
    const resKeys = ['light', 'water', 'nutrients'];
    resKeys.forEach((key, i) => {
      const y = 36 + i * 38;
      const res = this.resources.getAll()[key];
      this.add.text(rx, y, res.emoji + ' ' + res.name, { ...style, fontSize: '13px' });
      this.resTexts[key] = this.add.text(rx + 140, y, '', { ...style, fontSize: '12px', fill: '#c0b8a8' });

      // Fortschrittsbalken Hintergrund
      this.add.rectangle(rx, y + 17, 180, 8, 0x1a1a1a).setOrigin(0, 0);
      this.resBars[key] = this.add.rectangle(rx, y + 17, 0, 8, 0xffffff).setOrigin(0, 0);
    });
    this.resBars.light.fillColor    = 0xf0d840;
    this.resBars.water.fillColor    = 0x40a0f0;
    this.resBars.nutrients.fillColor = 0x70c030;

    // Jahreszeit-Fortschrittsbalken (unten)
    this.add.rectangle(200, 748, 624, 10, 0x1a1a1a).setOrigin(0, 0);
    this.seasonBar = this.add.rectangle(200, 748, 0, 10, 0x60a040).setOrigin(0, 0);
    this.add.text(200, 733, 'Jahreszeit', { ...style, fontSize: '11px', fill: '#888' });

    // Klick-Hinweis
    this.hintText = this.add.text(512, 680, '🖱️ Klick auf den Baum für Licht-Boost', {
      ...style, fontSize: '12px', fill: '#708060', align: 'center',
    }).setOrigin(0.5);

    this._updateUI();
  }

  _updateUI() {
    const season = this.seasons.current;
    this.seasonText.setText(season.emoji + '  ' + season.name + '  –  ' + season.description);
    this.yearText.setText('Jahr ' + this.seasons.year);
    this.phaseText.setText('Baum: ' + this.tree.phase.name + (this.tree.phaseIndex < 2 ? '  →  nächste Phase: ' + this.tree.phase.description : '  ✓ Voll entwickelt'));

    for (const key of Object.keys(this.resources.getAll())) {
      const res = this.resources.getAll()[key];
      const pct = res.value / res.max;
      this.resTexts[key].setText(Math.floor(res.value) + ' / ' + res.max);
      this.resBars[key].width = Math.round(180 * pct);
    }
  }

  _updateSeasonBar() {
    const progress = this.seasons.getProgress();
    this.seasonBar.width = Math.round(624 * progress);

    // Farbe passend zur Jahreszeit
    const colors = { spring: 0x80d040, summer: 0xf0d020, autumn: 0xe06010, winter: 0x80a8d0 };
    this.seasonBar.fillColor = colors[this.seasons.current.id];
  }

  // ────────────────────────────────────────────────────────────────────
  // Jahreszeiten-Wechsel
  // ────────────────────────────────────────────────────────────────────
  _onSeasonChange(prev, next, year) {
    // Hintergrund und Baum neu zeichnen
    this._drawBackground(next);
    this.tree.draw(next.id);

    // Flash-Overlay
    const overlay = this.add.rectangle(512, 384, 1024, 768, 0xffffff, 0.18).setDepth(10);
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => overlay.destroy(),
    });

    // Benachrichtigung
    const note = this.add.text(512, 340, next.emoji + '  ' + next.name, {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      fill: '#f0e8d0',
      stroke: '#000000',
      strokeThickness: 3,
      alpha: 0,
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: note,
      alpha: 1,
      y: 310,
      duration: 600,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 1200,
      onComplete: () => note.destroy(),
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // Klick-Feedback
  // ────────────────────────────────────────────────────────────────────
  _showClickFeedback(x, y) {
    const txt = this.add.text(x, y, '+15 ☀️', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      fill: '#f0d840',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(12);

    this.tweens.add({
      targets: txt,
      y: y - 50,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // Ambient-Partikel (Blätter im Herbst, Schnee im Winter, etc.)
  // ────────────────────────────────────────────────────────────────────
  _spawnParticle() {
    const season = this.seasons.current.id;
    const W = this.scale.width;
    const colors = { spring: 0xffb8c8, summer: 0x80ff40, autumn: 0xe06010, winter: 0xe8f0ff };
    this.particleList.push({
      x: Math.random() * W,
      y: -10,
      vy: 0.5 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.8,
      size: 2 + Math.random() * 4,
      alpha: 0.6 + Math.random() * 0.4,
      color: colors[season] || 0xffffff,
      life: 1.0,
    });
    // Max 60 Partikel
    if (this.particleList.length > 60) this.particleList.shift();
  }

  _updateParticles(delta) {
    const H = this.scale.height;
    this.particles.clear();
    for (const p of this.particleList) {
      p.x += p.vx;
      p.y += p.vy * (delta / 16);
      if (p.y > H) p.y = -10;
      this.particles.fillStyle(p.color, p.alpha);
      this.particles.fillCircle(p.x, p.y, p.size);
    }
  }
}
