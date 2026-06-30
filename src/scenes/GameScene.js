import Phaser from 'phaser';
import { ResourceSystem }       from '../systems/ResourceSystem.js';
import { SeasonSystem }         from '../systems/SeasonSystem.js';
import { TreeSystem }           from '../systems/TreeSystem.js';
import { MutationSystem }       from '../systems/MutationSystem.js';
import { UISystem }             from '../systems/UISystem.js';
import { CodexSystem }          from '../systems/CodexSystem.js';
import { SaveSystem }           from '../systems/SaveSystem.js';
import { ForestSystem }         from '../systems/ForestSystem.js';
import { ForestRenderer }       from '../systems/ForestRenderer.js';
import { CreatureSystem }       from '../systems/CreatureSystem.js';
import { CreatureRenderer }     from '../systems/CreatureRenderer.js';
import { CreatureUISystem }     from '../systems/CreatureUISystem.js';
import { CrisisQuestSystem }    from '../systems/CrisisQuestSystem.js';
import { GeneticMemorySystem }  from '../systems/GeneticMemorySystem.js';
import { SeasonalChoiceSystem } from '../systems/SeasonalChoiceSystem.js';
import { ITEM_DROPS }           from '../config/creatures.js';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  init(data) { this._loadSave = data?.loadSave ?? false; }

  create() {
    this.resources  = new ResourceSystem();
    this.seasons    = new SeasonSystem(this._onSeasonChange.bind(this));
    this.tree       = new TreeSystem(this);
    this.mutations  = new MutationSystem();
    this.codex      = new CodexSystem();
    this.forest     = new ForestSystem();
    this.creature   = new CreatureSystem();
    this.crisisQ    = new CrisisQuestSystem(this.creature, this.seasons);
    this.genes      = new GeneticMemorySystem();
    this.seasonChoice = new SeasonalChoiceSystem(this, this.resources, this.creature);

    this.bgGfx    = this.add.graphics().setDepth(0);
    this.groundGfx= this.add.graphics().setDepth(1);
    this.flowerGfx= this.add.graphics().setDepth(2); // Bodenblumen
    this.starsGfx = this.add.graphics().setDepth(2);
    this._buildStars();
    this.particles    = this.add.graphics().setDepth(3);
    this.particleList = [];

    this.forestRenderer   = new ForestRenderer(this, this.forest);
    this.creatureRenderer = new CreatureRenderer(this, this.creature);
    if (this.tree.graphics) this.tree.graphics.setDepth(5);
    this._drawBackground(this.seasons.current);

    // ── Creature-Callbacks ──────────────────────────────────────────────
    this.creature.onQuestComplete = (quest, reward, item) => {
      if (reward.resources) this.resources.add(reward.resources);
      const msg = quest.emoji + ' ' + quest.name + ' abgeschlossen! +' + quest.reward.xp + ' XP'
        + (item ? '  ' + item.emoji + ' ' + item.name + ' gefunden!' : '');
      if (this.ui) this.ui.addEventLog(msg, 'growth');
      if (this.creatureUi) this.creatureUi.updateHUD();
    };
    this.creature.onLevelUp = (lvl) => {
      if (this.ui) {
        this.ui.addEventLog('⬆️ ' + this.creature.archetype.emoji + ' ' + this.creature.archetype.name + ' ist Level ' + lvl + '!', 'discovery');
        this.ui.showClickFeedback(this.scale.width*0.38, this.scale.height*0.70, 'LV ' + lvl, '#a0ff60');
      }
      if (this.creatureUi) this.creatureUi.updateHUD();
    };
    this.creature.onItemDrop = (item) => {
      if (this.ui) this.ui.showClickFeedback(this.scale.width*0.38, this.scale.height*0.68, item.emoji + ' ' + item.name, '#f0d840');
    };
    this.creature.onTreeUnlock = () => this._unlockTree();
    this.creature.onEvolution  = (stageIdx, stageDef) => {
      const a   = this.creature.archetype;
      const msg = '🌱 ' + a.emoji + ' ' + stageDef.name + '! Das Tier hat sich entwickelt.';
      if (this.ui) {
        this.ui.addEventLog(msg, 'discovery');
        this.ui.showClickFeedback(this.scale.width*0.38, this.scale.height*0.65, stageDef.emoji + ' ' + stageDef.name + '!', '#80ffcc');
      } else { this._introLog(msg, 'discovery'); }
      this._showEvolutionFlash(stageDef.colorTint, false);
      if (this.creatureUi) this.creatureUi.updateHUD();
    };
    this.creature.onMetamorphosis = (stageDef) => {
      this._showMetamorphosisScreen(stageDef);
      if (stageDef.unlocksMutation) {
        const mut = this.mutations.getAll().find(m => m.id === stageDef.unlocksMutation);
        if (mut) { mut.unlocked = true; if (this.ui) this.ui.addEventLog('🔓 Mutation freigeschaltet: ' + mut.name, 'discovery'); }
      }
    };

    // ── Krisen-Quest-Callbacks ─────────────────────────────────────────
    this.crisisQ.onCrisisQuestAvailable = (questDef) => {
      if (!this.creature.treeUnlocked) return;
      if (this.ui) {
        this.ui.addEventLog('🆘 ' + questDef.emoji + ' Notfall: ' + questDef.name + '! Tier kann helfen.', 'event');
        this.ui.showClickFeedback(this.scale.width*0.5, this.scale.height*0.5, '🆘 ' + questDef.name, '#ff8040');
      }
      if (this.creatureUi) this.creatureUi.offerCrisisQuest(questDef);
    };
    this.crisisQ.onCrisisQuestDone = (questDef, reward) => {
      if (reward.resources) this.resources.add(reward.resources);
      const msg = '✅ ' + questDef.emoji + ' ' + questDef.name + ' abgeschlossen! Krise abgemildert.';
      if (this.ui) this.ui.addEventLog(msg, 'growth');
      if (this.creatureUi) this.creatureUi.clearCrisisOffer();
    };

    // ── Season-Events ───────────────────────────────────────────────────
    this.seasons.onEventStart = (ev) => {
      if (!this.ui) return;
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
      const flash = this.add.rectangle(W/2, H/2, W, H, ev.color||0xffffff, 0.1).setDepth(15);
      this.tweens.add({ targets: flash, alpha: 0, duration: 1200, onComplete: () => flash.destroy() });
    };
    this.seasons.onEventEnd = () => { if (this.ui) this.ui.showEventBanner(null); };

    // ── Spielstart ───────────────────────────────────────────────────────────
    if (this._loadSave) {
      const data = SaveSystem.load();
      if (data) {
        SaveSystem.restore(data, this.resources, this.mutations, this.seasons, this.codex, this.tree);
        if (data.forest)   this.forest.restore(data.forest);
        if (data.creature) {
          this.creature.restore(data.creature);
          if (this.creature.treeUnlocked) this.forestRenderer.show();
          this._startWithCreature(false);
        } else { this._showArchetypeChoice(); }
      } else { this._showArchetypeChoice(); }
    } else { this._showArchetypeChoice(); }

    this.scale.on('resize', () => {
      this._drawBackground(this.seasons.current);
      if (this.creature.treeUnlocked) this.tree.draw(this.seasons.current.id, this.mutations.getVisuals());
    });

    // ── Tick-Loop (1s) ────────────────────────────────────────────────────────
    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (!this.creature.treeUnlocked) return;
      const mutBonuses    = this.mutations.getBonuses();
      const rootBonuses   = this.forest.getRootDepthBonus();
      const forestBonus   = this.forest.getForestBonus();
      const creatureBon   = this.creature.isReady() ? this.creature.getTreeBonuses() : {};
      const choiceBon     = this.seasonChoice.getSeasonBonuses();
      const eventEffect   = this.seasons.getEventEffect();
      const crisisReduction = this.crisisQ.getDamageReduction();
      const reducedEffect = crisisReduction > 0 ? {
        light:     (eventEffect.light     ||0)*(1-crisisReduction),
        water:     (eventEffect.water     ||0)*(1-crisisReduction),
        nutrients: (eventEffect.nutrients ||0)*(1-crisisReduction),
      } : eventEffect;

      const bonuses = {
        lightRateBonus:       (mutBonuses.lightRateBonus     ||0)+(forestBonus.light     ||0)+(creatureBon.lightRateBonus     ||0)+(this.mutations._geneticLightBonus||0)+(choiceBon.lightRateBonus||0),
        waterRateBonus:       (mutBonuses.waterRateBonus     ||0)+(forestBonus.water     ||0)+(rootBonuses.water||0)+(creatureBon.waterRateBonus||0)+(choiceBon.waterRateBonus||0),
        nutrientsRateBonus:   (mutBonuses.nutrientsRateBonus ||0)+(forestBonus.nutrients ||0)+(rootBonuses.nutrients||0)+(creatureBon.nutrientsRateBonus||0)+(choiceBon.nutrientsRateBonus||0),
        allRatesBonus:        (mutBonuses.allRatesBonus      ||0)+(rootBonuses.allRatesBonus||0)+(forestBonus.allRatesBonus||0)+(creatureBon.allRatesBonus||0)+(choiceBon.allRatesBonus||0)+(choiceBon.allRatesMalus||0),
        waterDrainReduction:  mutBonuses.waterDrainReduction  ||0,
        eventDamageReduction: (mutBonuses.eventDamageReduction||0)+(choiceBon.eventDamageReduction||0),
        winterMalusReduction: (mutBonuses.winterMalusReduction||0)+(rootBonuses.winterMalusReduction||0)+(forestBonus.winterMalusReduction||0)+(choiceBon.winterMalusReduction||0),
        waterFloor:    Math.max(mutBonuses.waterFloor||0, rootBonuses.waterFloor||0),
        resourceFloor: mutBonuses.resourceFloor||0,
        immortal:      mutBonuses.immortal||false,
      };
      this.resources.tick(this.seasons.current.id, this.tree.phaseIndex, bonuses, reducedEffect);
      if (bonuses.waterFloor>0 && this.resources.get('water')<bonuses.waterFloor)
        this.resources.add({ water: bonuses.waterFloor - this.resources.get('water') });
      const symCount = this.mutations.getActiveSymbioses();
      if (symCount>0) this.resources.add({ symbiosis: symCount*0.4 });
      if (this.forest.trees.length>0) this.resources.add({ symbiosis: this.forest.trees.length*0.2 });
      this.creature.treePhaseIndex = this.tree.phaseIndex;
      const hadNew = this.codex.check(this.resources, this.mutations.getAll(), this.seasons.current.id, this.seasons.year, this.mutations.crisesEncountered);
      if (hadNew) {
        for (const entry of this.codex.popNewUnlocks())
          this.ui.addEventLog('📖 ' + entry.icon + ' ' + entry.name + ' entdeckt!', 'discovery');
      }
      const grown = this.tree.checkGrowth(this.resources, this.mutations.getActiveSymbioses());
      if (grown) {
        this.ui.showClickFeedback(this.scale.width/2, this.scale.height*0.4, '🌱 Baum wächst!', '#a0d878');
        this.ui.addEventLog('🌳 ' + this.tree.phase.name + ' – ' + this.tree.phase.description, 'growth');
        if (this.ui.panelOpen)       this.ui._renderPanel();
        if (this.ui.forestPanelOpen) this.ui._renderForestPanel();
      }
      this._checkGameOver();
      this.ui.update();
    }});

    this.time.addEvent({ delay: 100, loop: true, callback: () => {
      if (this.ui)         this.ui.updateSeasonBar();
      if (this.creatureUi) this.creatureUi.updateHUD();
    }});

    this.time.addEvent({ delay: 30_000, loop: true, callback: () => {
      if (!this.creature.isReady()) return;
      SaveSystem.save(this.resources, this.mutations, this.seasons, this.codex, this.tree, this.forest, this.creature);
      if (this.ui) this.ui.addEventLog('💾 Autosave.', 'info');
    }});

    this.input.on('pointerdown', (ptr) => {
      if (!this.creature.treeUnlocked) return;
      if (this.ui?.panelOpen        && ptr.x < 360 && ptr.y > 110) return;
      if (this.ui?.forestPanelOpen  && ptr.x < 360 && ptr.y > 110) return;
      if (this.ui?.codexOpen) return;
      if (this.seasonChoice._active) return;
      const W = this.scale.width, H = this.scale.height;
      const cx = W/2, treeCY = H*0.78 - this.tree.phase.trunkHeight*0.5;
      if (Phaser.Math.Distance.Between(ptr.x, ptr.y, cx, treeCY) < 150) {
        this.resources.add({ light: 15 });
        this.ui.showClickFeedback(ptr.x, ptr.y, '+15 ☀️');
      }
    });

    this.time.addEvent({ delay: 700, loop: true, callback: () => this._spawnParticle() });
  }

  _showArchetypeChoice() {
    const summary = this.genes.getSummary();
    this.creatureUi = new CreatureUISystem(this, this.creature, (archetypeId) => {
      this.creature.choose(archetypeId);
      const heritage = this.genes.applyToNewRun(this.creature, this.resources, this.mutations);
      if (heritage) {
        for (const id of heritage.itemIds) {
          const item = ITEM_DROPS.find(i => i.id === id);
          if (item && !this.creature.inventory.find(i => i.id === id)) this.creature.inventory.push(item);
        }
        if (heritage.bonusDef && this.ui)
          this.ui.addEventLog('🧬 Erbe: ' + heritage.bonusDef.label + ' – ' + heritage.bonusDef.description, 'discovery');
      }
      this._startWithCreature(true);
    }, summary);
    this.creatureUi.showArchetypeChoice();
  }

  _startWithCreature(isNew) {
    if (!this.creatureUi) this.creatureUi = new CreatureUISystem(this, this.creature, () => {});
    this.creatureUi.buildHUD();
    if (this.creature.treeUnlocked) this._buildTreeUI();
    if (isNew) {
      const a = this.creature.archetype, runs = this.genes.getRuns();
      this.time.delayedCall(400,  () => this._introLog('🌿 ' + a.emoji + ' Du erwachst. Der Wald ist still.', 'discovery'));
      if (runs > 0) {
        this.time.delayedCall(1500, () => this._introLog('🧬 Du trägst die Erinnerung deiner Vorfahren.', 'discovery'));
      } else {
        this.time.delayedCall(2200, () => this._introLog('👆 Tippe auf "Quest starten" um die Welt zu erkunden.', 'info'));
        this.time.delayedCall(4500, () => this._introLog('🌱 Nach 3 Quests findest du etwas Besonderes...', 'info'));
      }
    } else {
      this.time.delayedCall(400, () => this._introLog('💾 Willkommen zurück, ' + this.creature.archetype.emoji + ' ' + this.creature.archetype.name + '.', 'discovery'));
    }
  }

  _unlockTree() {
    this._drawBackground(this.seasons.current);
    this.tree.draw(this.seasons.current.id, this.mutations.getVisuals());
    this.forestRenderer.show();
    this._buildTreeUI();
    this._introLog('🌳 Der Samen keimt. Ein Baum wird wachsen.', 'discovery');
    this.time.delayedCall(1500, () => this._introLog('🌲 Pflege den Baum – er und dein Tier stärken sich gegenseitig.', 'info'));
    this.time.delayedCall(3500, () => this._introLog('🌱 Klick auf den Baum = +15 Licht. Mutationen öffnen!', 'info'));
    const W = this.scale.width, H = this.scale.height;
    const flash = this.add.rectangle(W/2, H/2, W, H, 0x80ff40, 0.18).setDepth(15);
    this.tweens.add({ targets: flash, alpha: 0, duration: 1800, onComplete: () => flash.destroy() });
  }

  _buildTreeUI() {
    if (this.ui) return;
    this.ui = new UISystem(this, this.resources, this.seasons, this.tree, this.mutations, this.codex, this.forest);
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
      const flash = this.add.rectangle(W/2, H/2, W, H, ev.color||0xffffff, 0.1).setDepth(15);
      this.tweens.add({ targets: flash, alpha: 0, duration: 1200, onComplete: () => flash.destroy() });
    };
    this.seasons.onEventEnd = () => this.ui.showEventBanner(null);
  }

  // ── Evolution & Metamorphose ────────────────────────────────────────
  _showEvolutionFlash(color, isMeta) {
    const W = this.scale.width, H = this.scale.height;
    const flash = this.add.rectangle(W/2, H/2, W, H, color, isMeta ? 0.30 : 0.15).setDepth(20);
    this.tweens.add({ targets: flash, alpha: 0, duration: isMeta ? 2000 : 900, onComplete: () => flash.destroy() });
    this.creatureRenderer.triggerMetaGlow();
  }

  _showMetamorphosisScreen(stageDef) {
    const W = this.scale.width, H = this.scale.height;
    this._showEvolutionFlash(stageDef.colorTint, true);
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0).setDepth(50);
    this.tweens.add({ targets: ov, alpha: 0.82, duration: 600 });
    const els = [ov];
    this.time.delayedCall(400, () => {
      els.push(
        this.add.text(W/2, H*0.28, stageDef.emoji, { fontSize: '72px' }).setOrigin(0.5).setDepth(51).setAlpha(0),
        this.add.text(W/2, H*0.46, '✨ Metamorphose! ✨', {
          fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '26px', fill: '#ffe080',
        }).setOrigin(0.5).setDepth(51).setAlpha(0),
        this.add.text(W/2, H*0.56, stageDef.name, {
          fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '20px', fill: '#a0ffcc',
        }).setOrigin(0.5).setDepth(51).setAlpha(0),
      );
      const bonusLines = Object.entries(stageDef.treeBonus || {})
        .map(([k, v]) => '+' + Math.round(v*100) + '% ' + k.replace('RateBonus','').replace('allRates','Alle Raten'))
        .join('  ');
      els.push(this.add.text(W/2, H*0.64, bonusLines, { fontFamily: 'sans-serif', fontSize: '12px', fill: '#80c080' }).setOrigin(0.5).setDepth(51).setAlpha(0));
      if (stageDef.unlocksMutation) {
        const mut = this.mutations.getAll().find(m => m.id === stageDef.unlocksMutation);
        if (mut) els.push(this.add.text(W/2, H*0.71, '🔓 ' + mut.name + ' freigeschaltet!', { fontFamily: 'sans-serif', fontSize: '12px', fill: '#ffd060' }).setOrigin(0.5).setDepth(51).setAlpha(0));
      }
      for (const el of els.slice(1)) this.tweens.add({ targets: el, alpha: 1, duration: 500 });
      this.time.delayedCall(800, () => {
        const btn = this.add.rectangle(W/2, H*0.80, 200, 36, 0x1a2a1a, 0.95).setInteractive({ cursor: 'pointer' }).setDepth(51).setStrokeStyle(1, 0x60a040);
        const bTxt = this.add.text(W/2, H*0.80, 'Weiter ▶', { fontFamily: 'sans-serif', fontSize: '13px', fill: '#90d060' }).setOrigin(0.5).setDepth(52);
        els.push(btn, bTxt);
        btn.on('pointerdown', () => { for (const el of els) this.tweens.add({ targets: el, alpha: 0, duration: 400, onComplete: () => el.destroy() }); });
      });
    });
  }

  // ── Game Over ────────────────────────────────────────────────────────
  _checkGameOver() {
    if (this.mutations.getBonuses().immortal) return;
    const allEmpty = ['light','water','nutrients'].every(k => this.resources.get(k) <= 0);
    if (allEmpty && !this._gameOverShown) {
      this._gameOverShown = true;
      const { item, bonus } = this.genes.onGameOver(this.creature, this.tree.phaseIndex, this.seasons.year);
      this._showGameOver(item, bonus);
    }
  }

  _showGameOver(heritageItem, heritageBonus) {
    const W = this.scale.width, H = this.scale.height;
    const ov = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0).setDepth(50);
    this.tweens.add({ targets: ov, alpha: 0.80, duration: 1500 });
    this.time.delayedCall(800, () => {
      this.add.text(W/2, H*0.22, '🍂', { fontSize: '56px' }).setOrigin(0.5).setDepth(51);
      this.add.text(W/2, H*0.34, 'Der Baum ist gestorben.', {
        fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '28px', fill: '#c87040', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(51);
      this.add.text(W/2, H*0.43,
        'Jahr ' + this.seasons.year + '  ·  ' + this.tree.phase.name + '  ·  Wald: ' + this.forest.trees.length,
        { fontFamily: 'sans-serif', fontSize: '12px', fill: '#806050' }
      ).setOrigin(0.5).setDepth(51);
      this.add.text(W/2, H*0.52, '🐾 Dein Tier flüchtet in die Wildnis...', {
        fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '15px', fill: '#a09070',
      }).setOrigin(0.5).setDepth(51);
      let yOff = 0.60;
      if (heritageItem) {
        this.add.text(W/2, H*yOff, '🧬 Es trägt mit: ' + heritageItem.emoji + ' ' + heritageItem.name, {
          fontFamily: 'sans-serif', fontSize: '13px', fill: '#d0c080',
        }).setOrigin(0.5).setDepth(51);
        yOff += 0.07;
      }
      if (heritageBonus) {
        this.add.text(W/2, H*yOff, heritageBonus.label + ': ' + heritageBonus.description, {
          fontFamily: 'sans-serif', fontSize: '12px', fill: '#80d0a0',
        }).setOrigin(0.5).setDepth(51);
        yOff += 0.07;
      }
      const btn = this.add.rectangle(W/2, H*(yOff+0.03), 240, 40, 0x1a1208, 0.95)
        .setInteractive({ cursor: 'pointer' }).setDepth(51).setStrokeStyle(1, 0x6a3a1a);
      this.add.text(W/2, H*(yOff+0.03), '🌱 Neues Leben beginnen', {
        fontFamily: 'sans-serif', fontSize: '13px', fill: '#d09060',
      }).setOrigin(0.5).setDepth(52);
      btn.on('pointerdown', () => {
        SaveSystem.deleteSave();
        this.scene.restart({ loadSave: false });
        this._gameOverShown = false;
      });
    });
  }

  _introLog(msg, type) {
    if (this.ui) { this.ui.addEventLog(msg, type); return; }
    const W = this.scale.width;
    const txt = this.add.text(W/2, this.scale.height*0.88, msg, {
      fontFamily: 'sans-serif', fontSize: '12px', fill: type==='discovery'?'#80ffe0':'#a0b8a0',
      stroke: '#000', strokeThickness: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: { x:8, y:4 },
    }).setOrigin(0.5).setAlpha(0).setDepth(11);
    this.tweens.add({ targets: txt, alpha: 1, duration: 300 });
    this.tweens.add({ targets: txt, alpha: 0, delay: 4500, duration: 800, onComplete: () => txt.destroy() });
  }

  update(time, delta) {
    this.seasons.update(delta);
    if (this.creature.treeUnlocked) {
      this.tree.tick(delta);
      this.forest.tick(delta);
      this.forestRenderer.tick(delta, this.seasons.current.id);
    }
    this.creature.tick(delta);
    this.creatureRenderer.tick(delta);
    this.crisisQ.tick(delta);
    this._updateParticles(delta);
    this._updateStars();
    // Bodenblumen immer zeichnen (unabhängig vom Baum-Unlock)
    this._drawFlowers(this.seasons.current.id);
  }

  _drawBackground(season) {
    const W = this.scale.width, H = this.scale.height, g = this.bgGfx;
    g.clear();
    const topC = Phaser.Display.Color.HexStringToColor(season.skyTop);
    const botC = Phaser.Display.Color.HexStringToColor(season.skyBottom);
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = i/steps;
      g.fillStyle(Phaser.Display.Color.GetColor(
        Math.round(topC.red   + (botC.red   - topC.red)   * t),
        Math.round(topC.green + (botC.green - topC.green) * t),
        Math.round(topC.blue  + (botC.blue  - topC.blue)  * t)
      ), 1);
      g.fillRect(0, H*i/steps, W, H/steps+1);
    }
    this.groundGfx.clear();
    const gc = Phaser.Display.Color.HexStringToColor(season.groundColor);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(gc.red, gc.green, gc.blue), 1);
    this.groundGfx.fillRect(0, H*0.78, W, H*0.22);
    this.groundGfx.fillStyle(Phaser.Display.Color.GetColor(
      Math.min(255, gc.red+18), Math.min(255, gc.green+18), Math.min(255, gc.blue+8)
    ), 1);
    this.groundGfx.fillEllipse(W/2, H*0.78, W*1.5, 80);
  }

  // ── Bodenblumen – deterministisch (kein random pro Frame) ─────────────
  _drawFlowers(seasonId) {
    if (!this.flowerGfx) return;
    const W = this.scale.width, H = this.scale.height;
    this.flowerGfx.clear();
    if (seasonId !== 'spring' && seasonId !== 'summer') return;

    // Feste Positionen (seed-basiert via Index, kein Math.random)
    const groundY = H * 0.78;
    const basePositions = [
      0.08, 0.14, 0.21, 0.27, 0.33, 0.40, 0.47, 0.53,
      0.60, 0.67, 0.73, 0.80, 0.86, 0.92,
    ];
    const offsets    = [0, 6, -4, 8, -6, 3, -8, 5, -3, 7, -5, 2, -7, 4];
    const sizes      = [3, 2, 4, 2, 3, 2, 4, 3, 2, 4, 3, 2, 3, 4];
    const springCol  = 0xffb8d0;
    const summerCol  = 0xffee60;
    const col = seasonId === 'spring' ? springCol : summerCol;

    basePositions.forEach((xFrac, i) => {
      const fx = W * xFrac;
      const fy = groundY + offsets[i % offsets.length] - 4;
      const r  = sizes[i % sizes.length];
      this.flowerGfx.fillStyle(col, 0.85);
      this.flowerGfx.fillCircle(fx, fy, r);
      // kleiner weißer Kern
      this.flowerGfx.fillStyle(0xffffff, 0.6);
      this.flowerGfx.fillCircle(fx, fy, Math.max(1, r - 1.5));
    });
  }

  _buildStars() {
    this._stars = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random()*0.65,
      r: 0.5+Math.random()*1.2, phase: Math.random()*Math.PI*2, speed: 0.5+Math.random()*1.5,
    }));
  }

  _updateStars() {
    const W = this.scale.width, H = this.scale.height, sid = this.seasons.current.id;
    const alpha = sid==='winter'?0.7:sid==='autumn'?0.4:0.15;
    if (alpha < 0.05) { this.starsGfx.clear(); return; }
    this.starsGfx.clear();
    const t = this.time.now/1000;
    for (const s of this._stars) {
      const a = alpha*(0.6+0.4*Math.sin(s.phase+t*s.speed));
      this.starsGfx.fillStyle(0xffffff, a);
      this.starsGfx.fillCircle(s.x*W, s.y*H, s.r);
    }
    const mX = W*0.83, mY = H*0.1;
    this.starsGfx.fillStyle(0xd8dff0, alpha*0.9); this.starsGfx.fillCircle(mX, mY, 13);
    this.starsGfx.fillStyle(0xe8f0ff, 0.15*alpha); this.starsGfx.fillCircle(mX, mY, 28);
  }

  _onSeasonChange(prev, next) {
    this._drawBackground(next);
    if (this.creature.treeUnlocked) this.tree.draw(next.id, this.mutations.getVisuals());
    if (this.ui) {
      this.ui.showSeasonTransition(next);
      this.ui.addEventLog(next.emoji + ' ' + next.name + ': ' + next.description, 'season');
    }
    this.seasonChoice.onSeasonChange(next.id);
  }

  _spawnParticle() {
    const season = this.seasons.current.id, W = this.scale.width;
    const colors = { spring: 0xffb8c8, summer: 0x80ff40, autumn: 0xe06010, winter: 0xe8f0ff };
    this.particleList.push({
      x: Math.random()*W, y: -10,
      vy: 0.4+Math.random()*0.8, vx: (Math.random()-0.5)*0.7,
      size: 1.5+Math.random()*3, alpha: 0.5+Math.random()*0.4,
      color: colors[season]||0xffffff,
    });
    if (this.particleList.length > 70) this.particleList.shift();
  }

  _updateParticles(delta) {
    const H = this.scale.height;
    this.particles.clear();
    for (const p of this.particleList) {
      p.x += p.vx; p.y += p.vy*(delta/16);
      if (p.y > H) p.y = -10;
      this.particles.fillStyle(p.color, p.alpha);
      this.particles.fillCircle(p.x, p.y, p.size);
    }
  }
}
