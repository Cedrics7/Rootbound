import { CREATURE_ARCHETYPES, QUEST_TYPES, ITEM_DROPS, LEVEL_XP } from '../config/creatures.js';

/**
 * CreatureSystem – verwaltet das Tier: Archetyp, Level, XP, Quests, Items.
 * Kommuniziert nach außen über Events (callbacks).
 */
export class CreatureSystem {
  constructor() {
    this.archetype       = null;   // CREATURE_ARCHETYPES-Objekt
    this.level           = 1;
    this.xp              = 0;
    this.inventory       = [];     // Array von ITEM_DROPS-Objekten
    this.questState      = null;   // { quest, startTime, duration } oder null
    this.treeUnlocked    = false;  // wird true nach plant_seed-Quest
    this.seedQuestShown  = false;  // plant_seed wurde angeboten
    this.questsDone      = 0;      // Gesamtzahl abgeschlossener Quests

    // Callbacks
    this.onQuestComplete = null;   // (quest, reward) => {}
    this.onLevelUp       = null;   // (newLevel) => {}
    this.onTreeUnlock    = null;   // () => {}
    this.onItemDrop      = null;   // (item) => {}
  }

  // ── Archetyp wählen ──────────────────────────────────────────────────────
  choose(archetypeId) {
    this.archetype = CREATURE_ARCHETYPES.find(a => a.id === archetypeId) || CREATURE_ARCHETYPES[0];
  }

  isReady() { return !!this.archetype; }

  // ── Quest starten ─────────────────────────────────────────────────────────
  startQuest(questId) {
    if (this.questState) return { ok: false, reason: 'Quest läuft bereits.' };
    const quest = QUEST_TYPES.find(q => q.id === questId);
    if (!quest) return { ok: false, reason: 'Unbekannte Quest.' };
    // plant_seed nur einmal
    if (quest.unique && this.treeUnlocked) return { ok: false, reason: 'Bereits gepflanzt.' };
    // Quest-Dauer mit Boni anpassen
    let duration = quest.duration;
    const qBonus = (this.archetype?.questBonus?.[quest.type] || 0)
                 + this._itemQuestBonus(quest.type);
    duration = Math.max(5000, Math.round(duration * (1 - qBonus)));
    this.questState = { quest, startTime: Date.now(), duration };
    return { ok: true, duration };
  }

  // ── Tick (aus GameScene.update) ───────────────────────────────────────────
  tick(delta) {
    if (!this.questState) return;
    const elapsed = Date.now() - this.questState.startTime;
    if (elapsed >= this.questState.duration) {
      this._completeQuest();
    }
  }

  getQuestProgress() {
    if (!this.questState) return 0;
    return Math.min(1, (Date.now() - this.questState.startTime) / this.questState.duration);
  }

  isOnQuest() { return !!this.questState; }
  currentQuest() { return this.questState?.quest || null; }

  // ── Quest abschließen ─────────────────────────────────────────────────────
  _completeQuest() {
    const { quest } = this.questState;
    this.questState = null;
    this.questsDone++;

    const reward = { ...quest.reward };

    // Item-Drop
    let droppedItem = null;
    if (Math.random() < (reward.itemChance || 0)) {
      droppedItem = this._rollItem();
      if (droppedItem) {
        this.inventory.push(droppedItem);
        this.onItemDrop?.(droppedItem);
      }
    }

    // XP
    this._addXP(reward.xp || 0);

    // Baum freischalten
    if (quest.id === 'plant_seed') {
      this.treeUnlocked = true;
      this.onTreeUnlock?.();
    }

    this.onQuestComplete?.(quest, reward, droppedItem);
  }

  // ── Samen-Quest anbieten (nach questsDone >= 3) ───────────────────────────
  shouldOfferSeedQuest() {
    return !this.treeUnlocked && !this.seedQuestShown && this.questsDone >= 3;
  }
  markSeedQuestShown() { this.seedQuestShown = true; }

  // ── Verfügbare Quests ─────────────────────────────────────────────────────
  getAvailableQuests() {
    return QUEST_TYPES.filter(q => {
      if (q.unique) return !this.treeUnlocked && this.questsDone >= 3;
      return true;
    });
  }

  // ── XP & Level ────────────────────────────────────────────────────────────
  _addXP(amount) {
    this.xp += amount;
    while (this.level < LEVEL_XP.length && this.xp >= LEVEL_XP[this.level]) {
      this.xp -= LEVEL_XP[this.level];
      this.level++;
      this.onLevelUp?.(this.level);
    }
  }

  getXPProgress() {
    const needed = LEVEL_XP[this.level] || 999;
    return Math.min(1, this.xp / needed);
  }

  getXPNeeded() { return LEVEL_XP[this.level] || 999; }

  // ── Boni ──────────────────────────────────────────────────────────────────
  getTreeBonuses() {
    const base = { ...(this.archetype?.treeBonus || {}) };
    for (const item of this.inventory) {
      const tb = item.bonus?.treeBonus || {};
      for (const [k, v] of Object.entries(tb)) {
        base[k] = (base[k] || 0) + v;
      }
    }
    // Level-Scaling: +2% auf alle Boni pro Level
    const scale = 1 + (this.level - 1) * 0.02;
    return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * scale]));
  }

  _itemQuestBonus(type) {
    return this.inventory.reduce((sum, item) => sum + (item.bonus?.questBonus?.[type] || 0), 0);
  }

  // ── Item-Roll ─────────────────────────────────────────────────────────────
  _rollItem() {
    const pool = ITEM_DROPS.filter(i => i.rarity === 'common' || (i.rarity === 'uncommon' && this.level >= 3));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  // ── Save / Restore ────────────────────────────────────────────────────────
  serialize() {
    return {
      archetypeId:    this.archetype?.id || null,
      level:          this.level,
      xp:             this.xp,
      inventory:      this.inventory.map(i => i.id),
      treeUnlocked:   this.treeUnlocked,
      seedQuestShown: this.seedQuestShown,
      questsDone:     this.questsDone,
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
    if (data.inventory) {
      this.inventory = data.inventory
        .map(id => ITEM_DROPS.find(i => i.id === id))
        .filter(Boolean);
    }
  }
}
