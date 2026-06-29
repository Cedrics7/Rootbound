import Phaser from 'phaser';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { TreeSystem } from '../systems/TreeSystem.js';
import { MutationSystem } from '../systems/MutationSystem.js';
import { UISystem } from '../systems/UISystem.js';
import { SEASONS } from '../config/seasons.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Systeme initialisieren ──────────────────────────────────────
    this.resources = new ResourceSystem();
    this.seasons   = new SeasonSystem(this._onSeasonChange.bind(this));
    this.tree      = new TreeSystem(this);
    this.mutations = new MutationSystem();

    // Saison-Ereignis-Callbacks
    this.seasons.onEventStart = (ev) => {
      this.ui.showEventBanner(ev);
      // Krisen-Mutation freischalten
      this.mutations.onCrisis(ev.id);
      // Visuelles Flash
      const flash = this.add.rectangle(512, 384, 1024, 768, ev.color || 0xffffff, 0.12).setDepth(10);
      this.tweens.add({ targets: flash, alpha: 0, duration: 1200, onComplete: () => flash.destroy() });
    };
    this.seasons.onEventEnd = () => this.ui.showEventBanner(null);

    // ── Hintergrund ─────────────────────────────────────────────────
    this.bgGfx     = this.add.graphics();
    this.groundGfx = this.add.graphics();

    // ── Partikel-Layer ───────────────────────────────────────────────
    this.particles    = this.add.graphics();
    this.particleList = [];

    // ── UI initialisieren (nach Systemen, weil es auf sie referenziert)
    this.ui = new UISystem(this, this.resources, this.seasons, this.tree, this.mutations);

    // ── Initiales Zeichnen ───────────────────────────────────────────
    this._drawBackground(this.seasons.current);
    this.tree.draw(this.seasons.current.id, this.mutations.getAll());

    // ── Ressourcen-Tick (jede Sekunde) ───────────────────────────────
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const bonuses     = this.mutations.getBonuses();
        const eventEffect = this.seasons.getEventEffect();
        this.resources.tick(
          this.seasons.current.id,
          this.tree.phaseIndex,
          bonuses,
          eventEffect,
        );
        // Wachstum prüfen (Kosten werden in checkGrowth bezahlt)
        const grown = this.tree.checkGrowth(this.resources, this.mutations.getActiveSymbioses());
        if (grown) {
          this.ui.showClickFeedback(512, 400, '🌱 Baum wächst!', '#a0d878');
          // Panel neu rendern falls offen
          if (this.ui.panelOpen) this.ui._renderPanel();
        }
        this.ui.update();
      },
    });

    // ── Jahreszeiten-Fortschrittsbalken ──────────────────────────────
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.ui.updateSeasonBar(),
    });

    // ── Klick auf Baum: Licht-Boost ──────────────────────────────────
    this.input.on('pointerdown', (ptr) => {
      // Klick nicht aufs Panel weiterleiten
      if (ptr.x < 330 && ptr.y > 100 && ptr.y < 600 && this.ui.panelOpen) return;

      const cx = W / 2;
      const treeCenterY = 600 - this.tree.phase.trunkHeight / 2;
      const dist = Phaser.Math.Distance.Between(ptr.x, ptr.y, cx, treeCenterY);
      if (dist < 120) {
        this.resources.spend({ light: -15 }); // negatives spend = hinzufügen
        this.ui.showClickFeedback(ptr.x, ptr.y, '+15 ☀️');
      }
    });

    // ── Partikel-Spawner ─────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────────────────
  // Hintergrund
  // ────────────────────────────────────────────────────────────────
  _drawBackground(season) {
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.bgGfx;
    g.clear();

    const topColor = Phaser.Display.Color.HexStringToColor(season.skyTop);
    const botColor = Phaser.Display.Color.HexStringToColor(season.skyBottom);
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r  = Math.round(topColor.red   + t * (botColor.red   - topColor.red));
      const gg = Math.round(topColor.green + t * (botColor.green - topColor.green));
      const b  = Math.round(topColor.blue  + t * (botColor.blue  - topColor.blue));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gg, b), 1);
      g.fillRect(0, (H * i) / steps, W, H / steps + 1);
    }

    this.groundGfx.clear();
    const gc = Phaser.Display.Color.HexStringToColor(season.groundColor);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(gc.red, gc.green, gc.blue), 1);
    this.groundGfx.fillRect(0, 600, W, H - 600);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(
      Math.min(255, gc.red + 20),
      Math.min(255, gc.green + 20),
      Math.min(255, gc.blue + 10)
    ), 1);
    this.groundGfx.fillEllipse(W / 2, 600, W * 1.4, 80);
  }

  // ────────────────────────────────────────────────────────────────
  // Jahreszeiten-Wechsel
  // ────────────────────────────────────────────────────────────────
  _onSeasonChange(prev, next, year) {
    this._drawBackground(next);
    this.tree.draw(next.id, this.mutations.getAll());
    this.ui.showSeasonTransition(next);
  }

  // ────────────────────────────────────────────────────────────────
  // Partikel
  // ────────────────────────────────────────────────────────────────
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
