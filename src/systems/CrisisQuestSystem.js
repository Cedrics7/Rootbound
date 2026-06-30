/**
 * CrisisQuestSystem
 * Bietet bei aktiver Krise eine Notfall-Quest an.
 * Das Tier kann sie starten → reduziert Krisenschaden aktiv.
 * Verbindet Tier ↔ Baum direkt.
 */

export const CRISIS_QUESTS = {
  drought: {
    id: 'crisis_drought', name: 'Wasserquelle finden', emoji: '💧',
    description: 'Finde eine verborgene Wasserquelle und führe sie zum Baum.',
    duration: 18000, type: 'crisis',
    reward: { resources: { water: 60 }, xp: 25 },
    damageReduction: 0.55,   // 55% weniger Wasser-Drain während Quest
    color: 0x4090ff,
  },
  storm: {
    id: 'crisis_storm', name: 'Sturm überstehen', emoji: '⚡',
    description: 'Klemme dich fest und halte den Sturm ab.',
    duration: 12000, type: 'crisis',
    reward: { resources: { nutrients: 30, light: 20 }, xp: 20 },
    damageReduction: 0.50,
    color: 0x8060d0,
  },
  frost: {
    id: 'crisis_frost', name: 'Wärme sammeln', emoji: '🔥',
    description: 'Suche Sonnenstellen und bringe Wärme zum Baum.',
    duration: 20000, type: 'crisis',
    reward: { resources: { light: 50 }, xp: 25 },
    damageReduction: 0.60,
    color: 0xa0d0ff,
  },
  pests: {
    id: 'crisis_pests', name: 'Schädlinge vertreiben', emoji: '🐛',
    description: 'Verjage die Schädlinge bevor sie den Baum schädigen.',
    duration: 15000, type: 'crisis',
    reward: { resources: { nutrients: 45 }, xp: 22 },
    damageReduction: 0.65,
    color: 0x80c040,
  },
  wildfire: {
    id: 'crisis_wildfire', name: 'Feuer eindämmen', emoji: '🌊',
    description: 'Bringe Wasser und trenne das Feuer vom Baum.',
    duration: 22000, type: 'crisis',
    reward: { resources: { water: 40, light: 30 }, xp: 30 },
    damageReduction: 0.70,
    color: 0xff6020,
  },
};

export class CrisisQuestSystem {
  constructor(creatureSystem, seasonSystem) {
    this.creature = creatureSystem;
    this.seasons  = seasonSystem;

    this._activeEventId  = null;  // ID des Events das gerade läuft
    this._offered        = false; // wurde die Quest schon angeboten?
    this._accepted       = false; // läuft die Quest?
    this._questDef       = null;

    this.onCrisisQuestAvailable = null; // (questDef) => {}
    this.onCrisisQuestDone      = null; // (questDef, reward) => {}
    this.onCrisisDamageReduced  = null; // (factor) => {}  – 0..1
  }

  // ── Aufruf aus GameScene.update ──────────────────────────────────────────
  tick(delta) {
    const ev = this.seasons.activeEvent;

    // Neue Krise begonnen?
    if (ev && ev.id !== this._activeEventId) {
      this._activeEventId = ev.id;
      this._offered = false;
      this._accepted = false;
      this._questDef = CRISIS_QUESTS[ev.id] ?? null;
      if (this._questDef && !this.creature.isOnQuest()) {
        this._offered = true;
        this.onCrisisQuestAvailable?.(this._questDef);
      }
    }

    // Krise endet
    if (!ev) {
      if (this._activeEventId) {
        this._activeEventId = null;
        this._offered  = false;
        this._accepted = false;
        this._questDef = null;
      }
    }
  }

  // Liefert aktuellen Schadens-Reduktionsfaktor (0 = kein Schutz, 0.6 = 60% weniger)
  getDamageReduction() {
    if (!this._accepted || !this._questDef) return 0;
    if (!this.creature.isOnQuest()) return 0;
    if (this.creature.currentQuest()?.id !== this._questDef.id) return 0;
    return this._questDef.damageReduction;
  }

  // Spieler akzeptiert Notfall-Quest
  accept() {
    if (!this._questDef) return { ok: false, reason: 'Keine Krise aktiv.' };
    if (this.creature.isOnQuest()) return { ok: false, reason: 'Quest läuft bereits.' };
    // Quest manuell in CreatureSystem einschleusen
    const q = { ...this._questDef };
    const result = this.creature._startCrisisQuest(q);
    if (result.ok) {
      this._accepted = true;
      // onQuestComplete weiterleiten
      const prev = this.creature.onQuestComplete;
      this.creature.onQuestComplete = (quest, reward, item) => {
        if (quest.id === q.id) {
          this.onCrisisQuestDone?.(q, reward);
          this.creature.onQuestComplete = prev;
        }
        prev?.(quest, reward, item);
      };
    }
    return result;
  }

  isOffered()   { return this._offered && !this._accepted && !!this.seasons.activeEvent; }
  currentDef()  { return this._questDef; }
}
