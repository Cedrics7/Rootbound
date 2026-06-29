/**
 * SaveSystem – speichert/lädt den kompletten Spielstand via localStorage.
 * Autosave alle 30 Sekunden. Manuelles Save/Load ebenfalls möglich.
 */
export class SaveSystem {
  static KEY = 'rootbound_save_v1';

  /** Spielstand speichern */
  static save(resources, mutations, seasons, codex, tree) {
    const data = {
      version: 1,
      savedAt: Date.now(),
      resources: SaveSystem._serializeResources(resources),
      mutations: SaveSystem._serializeMutations(mutations),
      seasons:   SaveSystem._serializeSeasons(seasons),
      codex:     SaveSystem._serializeCodex(codex),
      tree:      { phaseIndex: tree.phaseIndex },
    };
    try {
      localStorage.setItem(SaveSystem.KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Save fehlgeschlagen:', e);
      return false;
    }
  }

  /** Spielstand laden – gibt Objekt zurück oder null */
  static load() {
    try {
      const raw = localStorage.getItem(SaveSystem.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1) return null;
      return data;
    } catch (e) {
      console.warn('Load fehlgeschlagen:', e);
      return null;
    }
  }

  /** Spielstand löschen */
  static deleteSave() {
    localStorage.removeItem(SaveSystem.KEY);
  }

  /** Prüft ob ein Spielstand existiert */
  static hasSave() {
    return !!localStorage.getItem(SaveSystem.KEY);
  }

  /** Wiederherstellen aller Systeme aus gespeichertem Zustand */
  static restore(data, resources, mutations, seasons, codex, tree) {
    if (!data) return;

    // Ressourcen
    for (const [key, val] of Object.entries(data.resources || {})) {
      const diff = val - resources.get(key);
      if (diff !== 0) resources.add({ [key]: diff });
    }

    // Mutationen
    for (const saved of (data.mutations || [])) {
      const m = mutations.getAll().find(m => m.id === saved.id);
      if (!m) continue;
      m.unlocked = saved.unlocked;
      m.active   = saved.active;
    }

    // Krisen-History
    for (const crisis of (data.seasons?.crisesEncountered || [])) {
      mutations.crisesEncountered.add(crisis);
    }

    // Saison
    if (data.seasons) {
      seasons.currentIndex = data.seasons.currentIndex ?? 0;
      seasons.elapsed      = data.seasons.elapsed      ?? 0;
      seasons.year         = data.seasons.year         ?? 1;
    }

    // Codex
    for (const saved of (data.codex || [])) {
      const e = codex.entries.find(e => e.id === saved.id);
      if (e) e.unlocked = saved.unlocked;
    }

    // Baum
    if (data.tree) {
      tree.phaseIndex = data.tree.phaseIndex ?? 0;
    }
  }

  static _serializeResources(r) {
    const out = {};
    for (const [key, res] of Object.entries(r.getAll())) {
      out[key] = res.value;
    }
    return out;
  }

  static _serializeMutations(m) {
    return m.getAll().map(mut => ({ id: mut.id, unlocked: mut.unlocked, active: mut.active }));
  }

  static _serializeSeasons(s) {
    return {
      currentIndex:      s.currentIndex,
      elapsed:           s.elapsed,
      year:              s.year,
      crisesEncountered: [...s.crisesEncountered ?? []],
    };
  }

  static _serializeCodex(c) {
    return c.entries.map(e => ({ id: e.id, unlocked: e.unlocked }));
  }
}
