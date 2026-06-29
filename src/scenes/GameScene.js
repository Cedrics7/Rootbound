import Phaser from 'phaser';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { TreeSystem } from '../systems/TreeSystem.js';
import { MutationSystem } from '../systems/MutationSystem.js';
import { UISystem } from '../systems/UISystem.js';
import { CodexSystem } from '../systems/CodexSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Systeme
    this.resources = new ResourceSystem();
    this.seasons   = new SeasonSystem(this._onSeasonChange.bind(this));
    this.tree      = new TreeSystem(this);
    this.mutations = new MutationSystem();
    this.codex     = new CodexSystem();

    // Hintergrund-Layer (Himmel + Boden)
    this.bgGfx     = this.add.graphics().setDepth(0);
    this.groundGfx = this.add.graphics().setDepth(1);

    // Sterne-Layer (nur nachts / Winter sichtbar)
    this.starsGfx  = this.add.graphics().setDepth(2);
    this._buildStars();

    // Partikel
    this.particles    = this.add.graphics().setDepth(3);
    this.particleList = [];

    // Baum-Graphics-Layer hat depth 4 (im TreeSystem gesetzt)
    this.tree.graphics.setDepth(4);

    // Saison-Ereignis-Callbacks
    this.seasons.onEventStart = (ev) => {
      this.ui.showEventBanner(ev);
      this.ui.addEventLog(ev.emoji + ' ' + ev.name + ' – ' + ev.description, 'event');
      this.mutations.onCrisis(ev.id);
      const flash = this.add.rectangle(W / 2, H / 2, W, H, ev.color || 0xffffff, 0.1).setDepth(15);
      this.tweens.add({ targets: flash, alpha: 0, duration: 1200, onComplete: () => flash.destroy() });
    };
    this.seasons.onEventEnd = () => this.ui.showEventBanner(null);

    // UI (nach allen Systemen)
    this.ui = new UISystem(this, this.resources, this.seasons, this.tree, this.mutations, this.codex);

    // Initiales Zeichnen
    this._drawBackground(this.seasons.current);
    this.tree.draw(this.seasons.current.id, this.mutations.getAll());

    // Ressourcen-Tick (1 s)
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const bonuses     = this.mutations.getBonuses();
        const eventEffect = this.seasons.getEventEffect();
        this.resources.tick(this.seasons.current.id, this.tree.phaseIndex, bonuses, eventEffect);

        // Codex prüfen
        const hadNew = this.codex.check(
          this.resources,
          this.mutations.getAll(),
          this.seasons.current.id,
          this.seasons.year,
          this.mutations.crisesEncountered
        );
        if (hadNew) {
          for (const entry of this.codex.popNewUnlocks()) {
            this.ui.addEventLog('📖 ' + entry.icon + ' ' + entry.name + ' entdeckt!', 'discovery');
          }
        }

        const grown = this.tree.checkGrowth(this.resources, this.mutations.getActiveSymbioses());
        if (grown) {
          this.ui.showClickFeedback(W / 2, H * 0.4, '🌱 Baum wächst!', '#a0d878');
          this.ui.addEventLog('🌳 ' + this.tree.phase.name + ' – ' + this.tree.phase.description, 'growth');
          if (this.ui.panelOpen) this.ui._renderPanel();
        }
        this.ui.update();
      },
    });

    // Jahreszeit-Fortschrittsbalken (100 ms)
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.ui.updateSeasonBar(),
    });

    // Klick auf Baum: Licht-Boost
    this.input.on('pointerdown', (ptr) => {
      if (this.ui.panelOpen && ptr.x < 330 && ptr.y > 100) return;
      const cx = W / 2;
      const treeCenterY = H * 0.78 - this.tree.phase.trunkHeight * 0.5;
      const dist = Phaser.Math.Distance.Between(ptr.x, ptr.y, cx, treeCenterY);
      if (dist < 140) {
        this.resources.add({ light: 15 });
        this.ui.showClickFeedback(ptr.x, ptr.y, '+15 ☀️');
      }
    });

    // Partikel-Spawner
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this._spawnParticle(),
    });

    // Einführungs-Log
    this.time.delayedCall(500, () => {
      this.ui.addEventLog('🌳 Du erwachst. Uralt. Verwurzelt. Das Ökosystem beginnt.', 'discovery');
    });
    this.time.delayedCall(2500, () => {
      this.ui.addEventLog('🌱 Klicke auf deinen Baum für +15 Licht. Öffne Mutationen um zu wachsen.', 'info');
    });
  }

  update(time, delta) {
    this.seasons.update(delta);
    this.tree.tick(delta);          // Wind-Animation jeden Frame
    this._updateParticles(delta);
    this._updateStars();
  }

  // ── Hintergrund ────────────────────────────────────────────────────

  _drawBackground(season) {
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.bgGfx;
    g.clear();

    const topColor = Phaser.Display.Color.HexStringToColor(season.skyTop);
    const botColor = Phaser.Display.Color.HexStringToColor(season.skyBottom);
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t  = i / steps;
      const r  = Math.round(topColor.red   + t * (botColor.red   - topColor.red));
      const gg = Math.round(topColor.green + t * (botColor.green - topColor.green));
      const b  = Math.round(topColor.blue  + t * (botColor.blue  - topColor.blue));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gg, b), 1);
      g.fillRect(0, (H * i) / steps, W, H / steps + 1);
    }

    // Boden
    this.groundGfx.clear();
    const gc = Phaser.Display.Color.HexStringToColor(season.groundColor);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(gc.red, gc.green, gc.blue), 1);
    this.groundGfx.fillRect(0, H * 0.78, W, H * 0.22);
    // Boden-Ellipse für Weichheit
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(
      Math.min(255, gc.red   + 18),
      Math.min(255, gc.green + 18),
      Math.min(255, gc.blue  + 8)
    ), 1);
    this.groundGfx.fillEllipse(W / 2, H * 0.78, W * 1.5, 80);
  }

  // ── Sterne ─────────────────────────────────────────────────────────

  _buildStars() {
    this._stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.65,
      r: 0.5 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));
  }

  _updateStars() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const sid = this.seasons.current.id;
    // Sterne nur in dunklen Jahreszeiten/Nacht sichtbar
    const alpha = sid === 'winter' ? 0.7 : sid === 'autumn' ? 0.4 : 0.15;
    if (alpha < 0.05) { this.starsGfx.clear(); return; }

    this.starsGfx.clear();
    const t = this.time.now / 1000;
    for (const s of this._stars) {
      const a = alpha * (0.6 + 0.4 * Math.sin(s.phase + t * s.speed));
      this.starsGfx.fillStyle(0xffffff, a);
      this.starsGfx.fillCircle(s.x * W, s.y * H, s.r);
    }
    // Mond
    const moonX = W * 0.83;
    const moonY = H * 0.1;
    this.starsGfx.fillStyle(0xd8dff0, alpha * 0.9);
    this.starsGfx.fillCircle(moonX, moonY, 13);
    this.starsGfx.fillStyle(0xe8f0ff, 0.15 * alpha);
    this.starsGfx.fillCircle(moonX, moonY, 28);
  }

  // ── Saison-Wechsel ──────────────────────────────────────────────────

  _onSeasonChange(prev, next) {
    this._drawBackground(next);
    this.tree.draw(next.id, this.mutations.getAll());
    this.ui.showSeasonTransition(next);
    this.ui.addEventLog(next.emoji + ' ' + next.name + ': ' + next.description, 'season');
  }

  // ── Partikel ────────────────────────────────────────────────────────

  _spawnParticle() {
    const season = this.seasons.current.id;
    const W = this.scale.width;
    const colors = {
      spring: 0xffb8c8,
      summer: 0x80ff40,
      autumn: 0xe06010,
      winter: 0xe8f0ff,
    };
    this.particleList.push({
      x: Math.random() * W,
      y: -10,
      vy: 0.4 + Math.random() * 0.8,
      vx: (Math.random() - 0.5) * 0.7,
      size: 1.5 + Math.random() * 3,
      alpha: 0.5 + Math.random() * 0.4,
      color: colors[season] || 0xffffff,
    });
    if (this.particleList.length > 70) this.particleList.shift();
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
