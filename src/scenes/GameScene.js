import Phaser from 'phaser';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { TreeSystem } from '../systems/TreeSystem.js';
import { MutationSystem } from '../systems/MutationSystem.js';
import { UISystem } from '../systems/UISystem.js';
import { CodexSystem } from '../systems/CodexSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this._loadSave = data?.loadSave ?? false;
  }

  create() {
    // Systeme
    this.resources = new ResourceSystem();
    this.seasons   = new SeasonSystem(this._onSeasonChange.bind(this));
    this.tree      = new TreeSystem(this);
    this.mutations = new MutationSystem();
    this.codex     = new CodexSystem();

    // Spielstand laden wenn vorhanden
    if (this._loadSave) {
      const data = SaveSystem.load();
      if (data) SaveSystem.restore(data, this.resources, this.mutations, this.seasons, this.codex, this.tree);
    }

    // Hintergrund-Layer
    this.bgGfx     = this.add.graphics().setDepth(0);
    this.groundGfx = this.add.graphics().setDepth(1);

    // Sterne-Layer
    this.starsGfx = this.add.graphics().setDepth(2);
    this._buildStars();

    // Partikel-Layer
    this.particles    = this.add.graphics().setDepth(3);
    this.particleList = [];

    // Baum-Layer
    this.tree.graphics.setDepth(4);

    // Saison-Ereignis-Callbacks
    this.seasons.onEventStart = (ev) => {
      this.ui.showEventBanner(ev);
      this.ui.addEventLog(ev.emoji + ' ' + ev.name + ' – ' + ev.description, 'event');
      this.mutations.onCrisis(ev.id);
      // fire_bark nach Krise sichtbar freischalten
      if (ev.id === 'drought') {
        const fb = this.mutations.getAll().find(m => m.id === 'fire_bark');
        if (fb) fb.unlocked = true;
        if (this.ui.panelOpen) this.ui._renderPanel();
      }
      const discovered = this.codex.onCrisis(ev.id);
      if (discovered) {
        const entry = this.codex.getAll().find(e => e.id === discovered);
        if (entry) this.ui.addEventLog('📖 ' + entry.icon + ' ' + entry.name + ' entdeckt!', 'discovery');
      }
      const W = this.scale.width;
      const H = this.scale.height;
      const flash = this.add.rectangle(W / 2, H / 2, W, H, ev.color || 0xffffff, 0.1).setDepth(15);
      this.tweens.add({ targets: flash, alpha: 0, duration: 1200, onComplete: () => flash.destroy() });
    };
    this.seasons.onEventEnd = () => this.ui.showEventBanner(null);

    // UI (nach allen Systemen)
    this.ui = new UISystem(this, this.resources, this.seasons, this.tree, this.mutations, this.codex);

    // Initiales Zeichnen
    this._drawBackground(this.seasons.current);
    this.tree.draw(this.seasons.current.id, this.mutations.getAll());

    // Resize
    this.scale.on('resize', () => {
      this._drawBackground(this.seasons.current);
      this.tree.draw(this.seasons.current.id, this.mutations.getAll());
    });

    // Ressourcen-Tick (1 s)
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const bonuses     = this.mutations.getBonuses();
        const eventEffect = this.seasons.getEventEffect();
        this.resources.tick(this.seasons.current.id, this.tree.phaseIndex, bonuses, eventEffect);

        // Symbiose passiv erhöhen durch aktive Symbiose-Mutationen
        const symCount = this.mutations.getActiveSymbioses();
        if (symCount > 0) this.resources.add({ symbiosis: symCount * 0.3 });

        // Codex-Freischaltungen prüfen
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

        // Baum-Wachstum
        const grown = this.tree.checkGrowth(this.resources, this.mutations.getActiveSymbioses());
        if (grown) {
          this.ui.showClickFeedback(
            this.scale.width / 2, this.scale.height * 0.4,
            '🌱 Baum wächst!', '#a0d878'
          );
          this.ui.addEventLog('🌳 ' + this.tree.phase.name + ' – ' + this.tree.phase.description, 'growth');
          if (this.ui.panelOpen) this.ui._renderPanel();
        }

        // Game-Over prüfen
        this._checkGameOver();

        this.ui.update();
      },
    });

    // Jahreszeit-Fortschrittsbalken (100 ms)
    this.time.addEvent({
      delay: 100, loop: true,
      callback: () => this.ui.updateSeasonBar(),
    });

    // Autosave alle 30 s
    this.time.addEvent({
      delay: 30_000, loop: true,
      callback: () => {
        const ok = SaveSystem.save(this.resources, this.mutations, this.seasons, this.codex, this.tree);
        if (ok) this.ui.addEventLog('💾 Spielstand gespeichert.', 'info');
      },
    });

    // Klick auf Baum
    this.input.on('pointerdown', (ptr) => {
      const W = this.scale.width;
      const H = this.scale.height;
      if (this.ui.panelOpen && ptr.x < 340 && ptr.y > 100) return;
      if (this.ui.codexOpen) return;
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
      delay: 700, loop: true,
      callback: () => this._spawnParticle(),
    });

    // Intro-Logs
    if (!this._loadSave) {
      this.time.delayedCall(500,  () => this.ui.addEventLog('🌳 Du erwachst. Uralt. Verwurzelt. Das Ökosystem beginnt.', 'discovery'));
      this.time.delayedCall(2500, () => this.ui.addEventLog('🌱 Klicke auf deinen Baum für +15 Licht. Öffne Mutationen um zu wachsen.', 'info'));
    } else {
      this.time.delayedCall(500, () => this.ui.addEventLog('💾 Spielstand geladen. Willkommen zurück.', 'discovery'));
    }
  }

  update(time, delta) {
    this.seasons.update(delta);
    this.tree.tick(delta);
    this._updateParticles(delta);
    this._updateStars();
  }

  // ── Game Over ───────────────────────────────────────────────

  _checkGameOver() {
    // Game Over wenn alle Ressourcen gleichzeitig 0 sind
    const allEmpty = ['light', 'water', 'nutrients'].every(
      k => this.resources.get(k) <= 0
    );
    if (allEmpty && !this._gameOverShown) {
      this._gameOverShown = true;
      this._showGameOver();
    }
  }

  _showGameOver() {
    const W = this.scene.scene.scale.width  || this.scale.width;
    const H = this.scale.height;
    // Verdunkeln
    const overlay = this.add.rectangle(this.scale.width / 2, H / 2, this.scale.width, H, 0x000000, 0).setDepth(50);
    this.tweens.add({ targets: overlay, alpha: 0.75, duration: 1500 });

    this.time.delayedCall(800, () => {
      this.add.text(this.scale.width / 2, H * 0.35, '🍂', { fontSize: '64px' }).setOrigin(0.5).setDepth(51);
      this.add.text(this.scale.width / 2, H * 0.50, 'Der Baum ist gestorben.', {
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: '32px', fill: '#c87040', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(51);
      this.add.text(this.scale.width / 2, H * 0.60, 'Jahr ' + this.seasons.year + ' – ' + this.tree.phase.name, {
        fontFamily: 'sans-serif', fontSize: '15px', fill: '#806050',
      }).setOrigin(0.5).setDepth(51);

      // Neu starten
      const btn = this.add.rectangle(this.scale.width / 2, H * 0.72, 220, 42, 0x2a1a0a, 0.95)
        .setInteractive({ cursor: 'pointer' }).setDepth(51).setStrokeStyle(1, 0x6a3a1a);
      this.add.text(this.scale.width / 2, H * 0.72, '🌱 Neu starten', {
        fontFamily: 'sans-serif', fontSize: '15px', fill: '#d09060',
      }).setOrigin(0.5).setDepth(52);
      btn.on('pointerdown', () => {
        SaveSystem.deleteSave();
        this.scene.restart({ loadSave: false });
        this._gameOverShown = false;
      });
    });
  }

  // ── Hintergrund ──────────────────────────────────────────────

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
    this.groundGfx.clear();
    const gc = Phaser.Display.Color.HexStringToColor(season.groundColor);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(gc.red, gc.green, gc.blue), 1);
    this.groundGfx.fillRect(0, H * 0.78, W, H * 0.22);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(
      Math.min(255, gc.red + 18), Math.min(255, gc.green + 18), Math.min(255, gc.blue + 8)
    ), 1);
    this.groundGfx.fillEllipse(W / 2, H * 0.78, W * 1.5, 80);
  }

  // ── Sterne ───────────────────────────────────────────────────

  _buildStars() {
    this._stars = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random() * 0.65,
      r: 0.5 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));
  }

  _updateStars() {
    const W   = this.scale.width;
    const H   = this.scale.height;
    const sid = this.seasons.current.id;
    const alpha = sid === 'winter' ? 0.7 : sid === 'autumn' ? 0.4 : 0.15;
    if (alpha < 0.05) { this.starsGfx.clear(); return; }
    this.starsGfx.clear();
    const t = this.time.now / 1000;
    for (const s of this._stars) {
      const a = alpha * (0.6 + 0.4 * Math.sin(s.phase + t * s.speed));
      this.starsGfx.fillStyle(0xffffff, a);
      this.starsGfx.fillCircle(s.x * W, s.y * H, s.r);
    }
    const moonX = W * 0.83, moonY = H * 0.1;
    this.starsGfx.fillStyle(0xd8dff0, alpha * 0.9);
    this.starsGfx.fillCircle(moonX, moonY, 13);
    this.starsGfx.fillStyle(0xe8f0ff, 0.15 * alpha);
    this.starsGfx.fillCircle(moonX, moonY, 28);
  }

  // ── Saison-Wechsel ───────────────────────────────────────────

  _onSeasonChange(prev, next) {
    this._drawBackground(next);
    this.tree.draw(next.id, this.mutations.getAll());
    if (this.ui) {
      this.ui.showSeasonTransition(next);
      this.ui.addEventLog(next.emoji + ' ' + next.name + ': ' + next.description, 'season');
    }
  }

  // ── Partikel ─────────────────────────────────────────────────

  _spawnParticle() {
    const season = this.seasons.current.id;
    const W      = this.scale.width;
    const colors = { spring: 0xffb8c8, summer: 0x80ff40, autumn: 0xe06010, winter: 0xe8f0ff };
    this.particleList.push({
      x: Math.random() * W, y: -10,
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
