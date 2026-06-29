import { CODEX_ENTRIES } from '../config/seasons.js';

/**
 * CodexSystem – verwaltet alle entdeckbaren Ökosystem-Einträge.
 * Wird vom UISystem angezeigt und von GameScene durch Events befüllt.
 */
export class CodexSystem {
  constructor() {
    // Deep-Copy damit Originaldaten unangetastet bleiben
    this._entries = CODEX_ENTRIES.map(e => ({ ...e }));
  }

  /**
   * Schaltet einen Eintrag frei. Gibt true zurück wenn neu entdeckt.
   * @param {string} id
   * @returns {boolean}
   */
  unlock(id) {
    const entry = this._entries.find(e => e.id === id);
    if (!entry || entry.unlocked) return false;
    entry.unlocked = true;
    return true;
  }

  /** Alle Einträge (für Codex-Panel) */
  getAll() { return this._entries; }

  /** Nur freigeschaltete Einträge */
  getUnlocked() { return this._entries.filter(e => e.unlocked); }

  /** Einträge gruppiert nach Kategorie */
  getByCategory() {
    const cats = {};
    for (const e of this._entries) {
      if (!cats[e.cat]) cats[e.cat] = [];
      cats[e.cat].push(e);
    }
    return cats;
  }

  /** Prüft Freischalt-Bedingungen basierend auf aktuellem Spielzustand */
  checkUnlocks(state) {
    const { seasonId, year, resources, mutations } = state;
    const newly = [];

    const res = (key) => resources.get(key);
    const hasMut = (id) => mutations.getAll().find(m => m.id === id && m.active);

    const checks = [
      { id: 'myzel',      cond: res('water') >= 350 },
      { id: 'glowshroom', cond: hasMut('bioluminescence') },
      { id: 'firefly',    cond: hasMut('bioluminescence') && seasonId === 'summer' },
      { id: 'boar',       cond: year >= 5 && res('nutrients') >= 300 },
      { id: 'moth',       cond: hasMut('mycel_bridge') },
      { id: 'sundew',     cond: seasonId === 'spring' && res('water') >= 350 },
      { id: 'titan_arum', cond: year >= 10 && res('symbiosis') >= 300 },
      { id: 'moonflower', cond: hasMut('bioluminescence') && year >= 3 },
      { id: 'worldroot',  cond: mutations.getAll().filter(m => m.active).length >= 5 },
    ];

    for (const { id, cond } of checks) {
      if (cond && this.unlock(id)) newly.push(id);
    }
    return newly; // IDs der neu entdeckten Einträge
  }

  /** Wird direkt durch Krisen-Events getriggert */
  onCrisis(eventId) {
    const map = {
      drought:   'fireswamp',
      blizzard:  'moonflower',
      windstorm: 'parasite',
    };
    if (map[eventId]) {
      if (this.unlock(map[eventId])) return map[eventId];
    }
    return null;
  }
}
