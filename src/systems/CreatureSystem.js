import { CREATURE_ARCHETYPES, QUEST_TYPES, ITEM_DROPS, LEVEL_XP, getEvolutionStage } from '../config/creatures.js';

export class CreatureSystem {
  constructor() {
    this.archetype       = null;
    this.level           = 1;
    this.xp              = 0;
    this.inventory       = [];
    this.questState      = null;
    this.treeUnlocked    = false;
    this.seedQuestShown  = false;
    this.questsDone      = 0;
    this.evolutionStage  = 0;
    this.metamorphosed   = false;
    this.treePhaseIndex  = 0;   // wird von GameScene nach jedem Wachstum gesetzt
    this._memoryQuestHaste = 0;

    this.onQuestComplete  = null;
    this.onLevelUp        = null;
    this.onEvolution      = null;
    this.onMetamorphosis  = null;
    this.onTreeUnlock     = null;
    this.onItemDrop       = null;
  }

  choose(archetypeId) {
    this.archetype = CREATURE_ARCHETYPES.find(a => a.id === archetypeId) || CREATURE_ARCHETYPES[0];
  }

  isReady() { return !!this.archetype; }

  currentStage() {
    if (!this.archetype) return null;
    return getEvolutionStage(this.archetype, this.level);
  }

  // ── Quests ─────────────────────────────────────────────────────────────
  startQuest(questId) {
    if (this.questState) return { ok: false, reason: 'Quest läuft bereits.' };
    const quest = QUEST_TYPES.find(q => q.id === questId);
    if (!quest) return { ok: false, reason: 'Unbekannte Quest.' };
    if (quest.unique && this.treeUnlocked) return { ok: false, reason: 'Bereits gepflanzt.' };
    let duration = quest.duration;
    const qBonus = (this.archetype?.questBonus?.[quest.type] || 0)
                 + this._itemQuestBonus(quest.type)
                 + (quest.type !== 'plant_seed' ? this._memoryQuestHaste : 0);
    this._memoryQuestHaste = 0;
    duration = Math.max(5000, Math.round(duration * (1 - qBonus)));
    this.questState = { quest, startTime: Date.now(), duration };
    return { ok: true, duration };
  }

  _startCrisisQuest(questDef) {
    if (this.questState) return { ok: false, reason: 'Quest läuft bereits.' };
    this.questState = { quest: questDef, startTime: Date.now(), duration: questDef.duration };
    return { ok: true, duration: questDef.duration };
  }

  tick(delta) {
    if (!this.questState) return;
    if (Date.now() - this.questState.startTime >= this.questState.duration) this._completeQuest();
  }

  getQuestProgress() {
    if (!this.questState) return 0;
    return Math.min(1, (Date.now() - this.questState.startTime) / this.questState.duration);
  }

  isOnQuest()    { return !!this.questState; }
  currentQuest() { return this.questState?.quest || null; }

  _completeQuest() {
    const { quest } = this.questState;
    this.questState = null;
    this.questsDone++;
    const reward = { ...quest.reward };
    let droppedItem = null;
    if (Math.random() < (reward.itemChance || 0)) {
      droppedItem = this._rollItem();
      if (droppedItem) { this.inventory.push(droppedItem); this.onItemDrop?.(droppedItem); }
    }
    this._addXP(reward.xp || 0);
    if (quest.id === 'plant_seed') { this.treeUnlocked = true; this.onTreeUnlock?.(); }
    this.onQuestComplete?.(quest, reward, droppedItem);
  }

  shouldOfferSeedQuest() {
    return !this.treeUnlocked && !this.seedQuestShown && this.questsDone >= 3;
  }
  markSeedQuestShown() { this.seedQuestShown = true; }

  // Gibt verfügbare Quests gefiltert nach Baumphase zurück
  getAvailableQuests() {
    return QUEST_TYPES.filter(q => {
      if (q.unique) return !this.treeUnlocked && this.questsDone >= 3;
      return (q.minPhase ?? 0) <= this.treePhaseIndex;
    });
  }

  // ── XP & Level & Evolution ───────────────────────────────────────────
  _addXP(amount) {
    this.xp += amount;
    while (this.level < LEVEL_XP.length && this.xp >= LEVEL_XP[this.level]) {
      this.xp -= LEVEL_XP[this.level];
      this.level++;
      this.onLevelUp?.(this.level);
      this._checkEvolution();
    }
  }

  _checkEvolution() {
    if (!this.archetype) return;
    const stages = this.archetype.evolution;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (this.level >= stages[i].level && this.evolutionStage < i) {
        this.evolutionStage = i;
        if (stages[i].metamorphosis && !this.metamorphosed) {
          this.metamorphosed = true;
          this.onMetamorphosis?.(stages[i]);
        } else {
          this.onEvolution?.(i, stages[i]);
        }
        break;
      }
    }
  }

  getXPProgress() { return Math.min(1, this.xp / (LEVEL_XP[this.level] ?? 999)); }
  getXPNeeded()   { return LEVEL_XP[this.level] ?? 999; }

  // ── Boni ───────────────────────────────────────────────────────────────
  getTreeBonuses() {
    const stage = this.currentStage();
    const base = {
      ...(this.archetype?.treeBonus || {}),
      ...(stage?.metamorphosis ? (stage.treeBonus || {}) : {}),
    };
    for (const item of this.inventory) {
      for (const [k, v] of Object.entries(item.bonus?.treeBonus || {})) {
        base[k] = (base[k] || 0) + v;
      }
    }
    const scale = 1 + (this.level - 1) * 0.02;
    return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * scale]));
  }

  _itemQuestBonus(type) {
    return this.inventory.reduce((sum, i) => sum + (i.bonus?.questBonus?.[type] || 0), 0);
  }

  _rollItem() {
    const pool = ITEM_DROPS.filter(i => {
      if (i.rarity === 'common')   return true;
      if (i.rarity === 'uncommon') return this.level >= 3;
      if (i.rarity === 'rare')     return this.level >= 6;
      if (i.rarity === 'epic')     return this.metamorphosed;
      return false;
    });
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  // ── Save / Restore ────────────────────────────────────────────────────
  serialize() {
    return {
      archetypeId:    this.archetype?.id || null,
      level:          this.level,
      xp:             this.xp,
      inventory:      this.inventory.map(i => i.id),
      treeUnlocked:   this.treeUnlocked,
      seedQuestShown: this.seedQuestShown,
      questsDone:     this.questsDone,
      evolutionStage: this.evolutionStage,
      metamorphosed:  this.metamorphosed,
    };
  }

  restore(data) {
    if (!data) return;
    if (data.archetypeId) this.choose(data.archetypeId);
    this.level          = data.level          ?? 1;
    this.xp             = data.xp             ?? 0;
    this.treeUnlocked   = data.treeUnlocked   ?? false;
    this.seedQuestShown = data.seedQuestShown  ?? false;
    this.questsDone     = data.questsDone      ?? 0;
    this.evolutionStage = data.evolutionStage  ?? 0;
    this.metamorphosed  = data.metamorphosed   ?? false;
    if (data.inventory) {
      this.inventory = data.inventory.map(id => ITEM_DROPS.find(i => i.id === id)).filter(Boolean);
    }
  }
}
