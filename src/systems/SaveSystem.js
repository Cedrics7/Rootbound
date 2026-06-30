import { AccountSystem } from './AccountSystem.js';

/**
 * SaveSystem – Persistenz mit Account-Slot-Support.
 *
 * Wenn eine Session aktiv ist, wird in AccountSystem.saveSlot() gespeichert.
 * Fallback: alter localStorage-Key (rückwärtskompatibel).
 */
export class SaveSystem {
  static LEGACY_KEY = 'rootbound_save_v3';

  // ── Helfer: aktive Session ───────────────────────────────────────────
  static _session() {
    return AccountSystem.getSession(); // { username, slotIndex } | null
  }

  // ── hasSave ───────────────────────────────────────────────────────
  static hasSave() {
    const s = SaveSystem._session();
    if (s) return AccountSystem.loadSlot(s.username, s.slotIndex) !== null;
    try { return !!localStorage.getItem(SaveSystem.LEGACY_KEY); } catch { return false; }
  }

  // ── save ─────────────────────────────────────────────────────────────
  static save(resources, mutations, seasons, codex, tree, forest, creature) {
    const data = {
      v: 3,
      resources: Object.fromEntries(
        Object.entries(resources.getAll()).map(([k, r]) => [k, r.value])
      ),
      mutations:         mutations.getAll().map(m => ({ id: m.id, level: m.level, active: m.active, unlocked: m.unlocked })),
      crisesEncountered: [...mutations.crisesEncountered],
      seasons:  { year: seasons.year, seasonIndex: seasons.seasonIndex, elapsed: seasons.elapsed },
      codex:    codex.getAll().map(e => ({ id: e.id, unlocked: e.unlocked })),
      tree:     { phaseIndex: tree.phaseIndex },
      forest:   forest   ? forest.serialize()   : null,
      creature: creature ? creature.serialize() : null,
    };

    const s = SaveSystem._session();
    if (s) {
      AccountSystem.saveSlot(s.username, s.slotIndex, data);
    } else {
      try { localStorage.setItem(SaveSystem.LEGACY_KEY, JSON.stringify(data)); } catch(e) {}
    }
  }

  // ── load ──────────────────────────────────────────────────────────────
  static load() {
    const s = SaveSystem._session();
    if (s) return AccountSystem.loadSlot(s.username, s.slotIndex);
    try {
      const raw = localStorage.getItem(SaveSystem.LEGACY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  // ── restore (unverändert) ───────────────────────────────────────────
  static restore(data, resources, mutations, seasons, codex, tree) {
    if (!data || data.v < 3) return;
    if (data.resources) {
      for (const [k, v] of Object.entries(data.resources))
        resources.add({ [k]: v - resources.get(k) });
    }
    if (data.mutations) {
      for (const saved of data.mutations) {
        const m = mutations.getAll().find(m => m.id === saved.id);
        if (m) { m.level = saved.level; m.active = saved.active; m.unlocked = saved.unlocked; }
      }
    }
    if (data.crisesEncountered)
      for (const c of data.crisesEncountered) mutations.crisesEncountered.add(c);
    if (data.seasons) {
      seasons.year        = data.seasons.year;
      seasons.seasonIndex = data.seasons.seasonIndex;
      seasons.elapsed     = data.seasons.elapsed;
    }
    if (data.codex) {
      for (const saved of data.codex) {
        const e = codex.getAll().find(e => e.id === saved.id);
        if (e) e.unlocked = saved.unlocked;
      }
    }
    if (data.tree) tree.phaseIndex = data.tree.phaseIndex;
  }

  // ── delete ────────────────────────────────────────────────────────────
  static deleteSave() {
    const s = SaveSystem._session();
    if (s) {
      AccountSystem.deleteSlot(s.username, s.slotIndex);
    } else {
      try { localStorage.removeItem(SaveSystem.LEGACY_KEY); } catch(e) {}
    }
  }
}
