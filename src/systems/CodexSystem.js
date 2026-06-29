<<<<<<< HEAD
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
=======
/**
 * CodexSystem – Ökosystem-Codex ("Pokédex" des Spiels).
 * Verfolgt Entdeckungen und gibt UI-Daten zurück.
 */
export class CodexSystem {
  constructor() {
    this.entries = [
      // Pilze
      { id: 'myzel',      name: 'Myzel',          icon: '🍄', cat: 'Pilze',      cond: 'Bodenfeuchte ≥ 70%',           unlocked: false },
      { id: 'glowshroom', name: 'Geisterpilz',    icon: '💜', cat: 'Pilze',      cond: 'Biolumineszenz aktiv',         unlocked: false },
      { id: 'fireswamp',  name: 'Feuerschwamm',   icon: '🔴', cat: 'Pilze',      cond: 'Dürre-Krise überstehen',       unlocked: false },
      // Tiere
      { id: 'firefly',    name: 'Glühwürmchen',   icon: '🪲', cat: 'Tiere',      cond: 'Biolumineszenz + Sommer',      unlocked: false },
      { id: 'boar',       name: 'Wildschwein',    icon: '🐗', cat: 'Tiere',      cond: '5+ Jahre, Nährstoffe > 300',   unlocked: false },
      { id: 'moth',       name: 'Riesenmotte',    icon: '🦋', cat: 'Tiere',      cond: 'Sonnen-Krone + Nacht',         unlocked: false },
      { id: 'deer',       name: 'Hirsch',         icon: '🦌', cat: 'Tiere',      cond: 'Ausgewachsener Baum',          unlocked: false },
      // Pflanzen
      { id: 'sundew',     name: 'Sonnentau',      icon: '🌿', cat: 'Pflanzen',   cond: 'Frühling + Wasser > 400',      unlocked: false },
      { id: 'titan_arum', name: 'Titanenwurz',    icon: '🌺', cat: 'Pflanzen',   cond: 'Jahr 10+, Symbiose > 200',     unlocked: false },
      { id: 'moonflower', name: 'Mondblume',      icon: '🌙', cat: 'Pflanzen',   cond: 'Winter überleben + Biolum',    unlocked: false },
      // Parasiten
      { id: 'parasite',   name: 'Schmarotzerpflanze', icon: '🦠', cat: 'Parasiten', cond: 'Krise überstehen',         unlocked: false },
      // Legendarys
      { id: 'eternal',    name: 'Ewiger Schwamm', icon: '♾️', cat: 'Legendarys', cond: 'Harvest + Blüte gleichzeitig', unlocked: false },
      { id: 'worldroot',  name: 'Weltenwurzel',   icon: '🌍', cat: 'Legendarys', cond: 'Alle 5 Mutationen aktiv',      unlocked: false },
    ];
    this._newUnlocks = []; // Queue für Event-Log
  }

  /**
   * Prüft Bedingungen und schaltet Einträge frei.
   * Gibt true zurück wenn etwas Neues entdeckt wurde.
   */
  check(resources, mutations, seasonId, year, crisisHistory) {
    let anyNew = false;
    const res = (k) => resources.get(k);
    const hasMut = (id) => mutations.find(m => m.id === id && m.active);

    const checks = [
      ['myzel',      res('water') >= 350],
      ['glowshroom', hasMut('bioluminescence')],
      ['fireswamp',  crisisHistory.has('drought')],
      ['firefly',    hasMut('bioluminescence') && seasonId === 'summer'],
      ['boar',       year >= 5 && res('nutrients') >= 300],
      ['moth',       hasMut('sun_crown')],
      ['deer',       mutations.filter(m => m.active).length >= 1],
      ['sundew',     seasonId === 'spring' && res('water') >= 400],
      ['titan_arum', year >= 10 && res('symbiosis') >= 200],
      ['moonflower', hasMut('bioluminescence') && crisisHistory.has('blizzard')],
      ['parasite',   crisisHistory.size >= 1],
      ['eternal',    crisisHistory.has('harvest') && crisisHistory.has('bloom')],
      ['worldroot',  mutations.filter(m => m.active).length >= 5],
    ];

    for (const [id, cond] of checks) {
      if (!cond) continue;
      const entry = this.entries.find(e => e.id === id);
      if (entry && !entry.unlocked) {
        entry.unlocked = true;
        this._newUnlocks.push(entry);
        anyNew = true;
      }
    }
    return anyNew;
  }

  /** Leert und gibt neue Entdeckungen zurück (für Event-Log) */
  popNewUnlocks() {
    const q = [...this._newUnlocks];
    this._newUnlocks = [];
    return q;
  }

  getAll()      { return this.entries; }
  getUnlocked() { return this.entries.filter(e => e.unlocked); }

  getByCategory() {
    const cats = {};
    for (const e of this.entries) {
>>>>>>> origin/main
      if (!cats[e.cat]) cats[e.cat] = [];
      cats[e.cat].push(e);
    }
    return cats;
  }
<<<<<<< HEAD

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
=======
>>>>>>> origin/main
}
