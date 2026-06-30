import Phaser from 'phaser';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { TreeSystem } from '../systems/TreeSystem.js';
import { MutationSystem } from '../systems/MutationSystem.js';
import { UISystem } from '../systems/UISystem.js';
import { CodexSystem } from '../systems/CodexSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { ForestSystem } from '../systems/ForestSystem.js';
import { ForestRenderer } from '../systems/ForestRenderer.js';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) { this._loadSave = data?.loadSave ?? false; }

  create() {
    this.resources = new ResourceSystem();
    this.seasons   = new SeasonSystem(this._onSeasonChange.bind(this));
    this.tree      = new TreeSystem(this);
    this.mutations = new MutationSystem();
    this.codex     = new CodexSystem();
    this.forest    = new ForestSystem();

    if (this._loadSave) {
      const data = SaveSystem.load();
      if (data) {
        SaveSystem.restore(data, this.resources, this.mutations, this.seasons, this.codex, this.tree);
        if (data.forest) this.forest.restore(data.forest);
      }
    }

    this.bgGfx     = this.add.graphics().setDepth(0);
    this.groundGfx = this.add.graphics().setDepth(1);
    this.starsGfx  = this.add.graphics().setDepth(2);
    this._buildStars();
    this.particles    = this.add.graphics().setDepth(3);
    this.particleList = [];

    this.forestRenderer = new ForestRenderer(this, this.forest);

    // Hauptbaum-Graphics auf depth 5 setzen (nach TreeSystem-Erstellung)
    if (this.tree.graphics) this.tree.graphics.setDepth(5);

    this.seasons.onEventStart = (ev) => {
      this.ui.showEventBanner(ev);
      this.ui.addEventLog(ev.emoji + ' ' + ev.name + ' – ' + ev.description, 'event');
      this.mutations.onCrisis(ev.id);
      if (this.ui.panelOpen) this.ui._renderPanel();
      const discovered = this.codex.onCrisis(ev.id);
      if (discovered) {
        const entry = this.codex.getAll().find(e => e.id === discovered);
        if (entry) this.ui.addEventLog('📖 ' + entry.icon + ' ' + entry.name + ' entdeckt!', 'discovery');
      }
      const W = this.scale.width, H = this.scale.height;
      const flash = this.add.rectangle(W / 2, H / 2, W, H, ev.color || 0xffffff, 0.1).setDepth(15);
      this.tweens.add({ targets: flash, alpha: 0, duration: 1200, onComplete: () => flash.destroy() });
    };
    this.seasons.onEventEnd = () => this.ui.showEventBanner(null);

    this.ui = new UISystem(this, this.resources, this.seasons, this.tree, this.mutations, this.codex, this.forest);

    this._drawBackground(this.seasons.current);
    this.tree.draw(this.seasons.current.id, this.mutations.getVisuals());

    this.scale.on('resize', () => {
      this._drawBackground(this.seasons.current);
      this.tree.draw(this.seasons.current.id, this.mutations.getVisuals());
    });

    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      const mutBonuses  = this.mutations.getBonuses();
      const rootBonuses = this.forest.getRootDepthBonus();
      const forestBonus = this.forest.getForestBonus();
      const eventEffect = this.seasons.getEventEffect();

      const bonuses = {
        lightRateBonus:       (mutBonuses.lightRateBonus     || 0) + (forestBonus.light     || 0),
        waterRateBonus:       (mutBonuses.waterRateBonus     || 0) + (forestBonus.water     || 0) + (rootBonuses.water || 0),
        nutrientsRateBonus:   (mutBonuses.nutrientsRateBonus || 0) + (forestBonus.nutrients || 0) + (rootBonuses.nutrients || 0),
        allRatesBonus:        (mutBonuses.allRatesBonus      || 0) + (rootBonuses.allRatesBonus || 0) + (forestBonus.allRatesBonus || 0),
        waterDrainReduction:  mutBonuses.waterDrainReduction  || 0,
        eventDamageReduction: mutBonuses.eventDamageReduction || 0,
        winterMalusReduction: (mutBonuses.winterMalusReduction || 0) + (rootBonuses.winterMalusReduction || 0) + (forestBonus.winterMalusReduction || 0),
        waterFloor:    Math.max(mutBonuses.waterFloor || 0, rootBonuses.waterFloor || 0),
        resourceFloor: mutBonuses.resourceFloor || 0,
        immortal:      mutBonuses.immortal || false,
      };

      this.resources.tick(this.seasons.current.id, this.tree.phaseIndex, bonuses, eventEffect);

      if (bonuses.waterFloor > 0 && this.resources.get('water') < bonuses.waterFloor) {
        this.resources.add({ water: bonuses.waterFloor - this.resources.get('water') });
      }

      const symCount = this.mutations.getActiveSymbioses();
      if (symCount > 0) this.resources.add({ symbiosis: symCount * 0.4 });
      if (this.forest.trees.length > 0) this.resources.add({ symbiosis: this.forest.trees.length * 0.2 });

      const hadNew = this.codex.check(
        this.resources, this.mutations.getAll(),
        this.seasons.current.id, this.seasons.year, this.mutations.crisesEncountered
      );
      if (hadNew) {
        for (const entry of this.codex.popNewUnlocks()) {
          this.ui.addEventLog('📖 ' + entry.icon + ' ' + entry.name + ' entdeckt!', 'discovery');
        }
      }

      const grown = this.tree.checkGrowth(this.resources, this.mutations.getActiveSymbioses());
      if (grown) {
        this.ui.showClickFeedback(this.scale.width / 2, this.scale.height * 0.4, '🌱 Baum wächst!', '#a0d878');
        this.ui.addEventLog('🌳 ' + this.tree.phase.name + ' – ' + this.tree.phase.description, 'growth');
        if (this.ui.panelOpen)       this.ui._renderPanel();
        if (this.ui.forestPanelOpen) this.ui._renderForestPanel();
      }

      this._checkGameOver();
      this.ui.update();
    }});

    this.time.addEvent({ delay: 100,    loop: true, callback: () => this.ui.updateSeasonBar() });
    this.time.addEvent({ delay: 30_000, loop: true, callback: () => {
      SaveSystem.save(this.resources, this.mutations, this.seasons, this.codex, this.tree, this.forest);
      this.ui.addEventLog('💾 Autosave.', 'info');
    }});

    this.input.on('pointerdown', (ptr) => {
      if (this.ui.panelOpen       && ptr.x < 360 && ptr.y > 110) return;
      if (this.ui.forestPanelOpen && ptr.x < 360 && ptr.y > 110) return;
      if (this.ui.codexOpen) return;
      const W = this.scale.width, H = this.scale.height;
      const cx = W / 2, treeCY = H * 0.78 - this.tree.phase.trunkHeight * 0.5;
      const dist = Phaser.Math.Distance.Between(ptr.x, ptr.y, cx, treeCY);
      if (dist < 150) {
        this.resources.add({ light: 15 });
        this.ui.showClickFeedback(ptr.x, ptr.y, '+15 ☀️');
      }
    });

    this.time.addEvent({ delay: 700, loop: true, callback: () => this._spawnParticle() });

    if (!this._loadSave) {
      this.time.delayedCall(500,  () => this.ui.addEventLog('🌳 Du erwachst. Uralt. Verwurzelt.', 'discovery'));
      this.time.delayedCall(2500, () => this.ui.addEventLog('🌱 Klick auf den Baum = +15 Licht. Mutationen öffnen!', 'info'));
      this.time.delayedCall(5000, () => this.ui.addEventLog('🌲 Pflanze Bäume im Wald-Panel, um Ressourcen zu steigern.', 'info'));
    } else {
      this.time.delayedCall(500, () => this.ui.addEventLog('💾 Willkommen zurück, alter Baum.', 'discovery'));
    }
  }

  update(time, delta) {
    this.seasons.update(delta);
    this.tree.tick(delta);
    this.forest.tick(delta);
    this.forestRenderer.tick(delta, this.seasons.current.id);
    this._updateParticles(delta);
    this._updateStars();
  }

  _checkGameOver() {
    if (this.mutations.getBonuses().immortal) return;
    const allEmpty = ['light', 'water', 'nutrients'].every(k => this.resources.get(k) <= 0);
    if (allEmpty && !this._gameOverShown) {
      this._gameOverShown = true;
      this._showGameOver();
    }
  }

  _showGameOver() {
    const W = this.scale.width, H = this.scale.height;
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50);
    this.tweens.add({ targets: ov, alpha: 0.75, duration: 1500 });
    this.time.delayedCall(800, () => {
      this.add.text(W / 2, H * 0.35, '🍂', { fontSize: '64px' }).setOrigin(0.5).setDepth(51);
      this.add.text(W / 2, H * 0.50, 'Der Baum ist gestorben.', {
        fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '32px', fill: '#c87040', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(51);
      this.add.text(W / 2, H * 0.60,
        'Jahr ' + this.seasons.year + ' – ' + this.tree.phase.name + ' – Wald: ' + this.forest.trees.length + ' Bäume',
        { fontFamily: 'sans-serif', fontSize: '14px', fill: '#806050' }
      ).setOrigin(0.5).setDepth(51);
      const btn = this.add.rectangle(W / 2, H * 0.72, 220, 42, 0x2a1a0a, 0.95)
        .setInteractive({ cursor: 'pointer' }).setDepth(51).setStrokeStyle(1, 0x6a3a1a);
      this.add.text(W / 2, H * 0.72, '🌱 Neu starten', {
        fontFamily: 'sans-serif', fontSize: '15px', fill: '#d09060',
      }).setOrigin(0.5).setDepth(52);
      btn.on('pointerdown', () => {
        SaveSystem.deleteSave();
        this.scene.restart({ loadSave: false });
        this._gameOverShown = false;
      });
    });
  }

  _drawBackground(season) {
    const W = this.scale.width, H = this.scale.height, g = this.bgGfx;
    g.clear();
    const topC = Phaser.Display.Color.HexStringToColor(season.skyTop);
    const botC = Phaser.Display.Color.HexStringToColor(season.skyBottom);
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      g.fillStyle(Phaser.Display.Color.GetColor(
        Math.round(topC.red   + (botC.red   - topC.red)   * t),
        Math.round(topC.green + (botC.green - topC.green) * t),
        Math.round(topC.blue  + (botC.blue  - topC.blue)  * t)
      ), 1);
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

  _buildStars() {
    this._stars = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random() * 0.65,
      r: 0.5 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));
  }

  _updateStars() {
    const W = this.scale.width, H = this.scale.height, sid = this.seasons.current.id;
    const alpha = sid === 'winter' ? 0.7 : sid === 'autumn' ? 0.4 : 0.15;
    if (alpha < 0.05) { this.starsGfx.clear(); return; }
    this.starsGfx.clear();
    const t = this.time.now / 1000;
    for (const s of this._stars) {
      const a = alpha * (0.6 + 0.4 * Math.sin(s.phase + t * s.speed));
      this.starsGfx.fillStyle(0xffffff, a);
      this.starsGfx.fillCircle(s.x * W, s.y * H, s.r);
    }
    const mX = W * 0.83, mY = H * 0.1;
    this.starsGfx.fillStyle(0xd8dff0, alpha * 0.9); this.starsGfx.fillCircle(mX, mY, 13);
    this.starsGfx.fillStyle(0xe8f0ff, 0.15 * alpha); this.starsGfx.fillCircle(mX, mY, 28);
  }

  _onSeasonChange(prev, next) {
    this._drawBackground(next);
    this.tree.draw(next.id, this.mutations.getVisuals());
    if (this.ui) {
      this.ui.showSeasonTransition(next);
      this.ui.addEventLog(next.emoji + ' ' + next.name + ': ' + next.description, 'season');
    }
  }

  _spawnParticle() {
    const season = this.seasons.current.id, W = this.scale.width;
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
