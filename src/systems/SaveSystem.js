/**
 * SaveSystem – localStorage Persistenz inkl. ForestSystem.
 */
export class SaveSystem {
  static SAVE_KEY = 'rootbound_save_v2';

  static save(resources, mutations, seasons, codex, tree, forest) {
    const data = {
      v: 2,
      resources: Object.fromEntries(
        Object.entries(resources.getAll()).map(([k,r]) => [k, r.value])
      ),
      mutations: mutations.getAll().map(m => ({ id: m.id, level: m.level, active: m.active, unlocked: m.unlocked })),
      crisesEncountered: [...mutations.crisesEncountered],
      seasons:  { year: seasons.year, seasonIndex: seasons.seasonIndex, elapsed: seasons.elapsed },
      codex:    codex.getAll().map(e => ({ id: e.id, unlocked: e.unlocked })),
      tree:     { phaseIndex: tree.phaseIndex },
      forest:   forest ? forest.serialize() : null,
    };
    try { localStorage.setItem(SaveSystem.SAVE_KEY, JSON.stringify(data)); } catch(e) {}
  }

  static load() {
    try {
      const raw = localStorage.getItem(SaveSystem.SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  static restore(data, resources, mutations, seasons, codex, tree) {
    if (!data || data.v < 2) return;
    if (data.resources) {
      for (const [k, v] of Object.entries(data.resources)) {
        resources.add({ [k]: v - resources.get(k) });
      }
    }
    if (data.mutations) {
      for (const saved of data.mutations) {
        const m = mutations.getAll().find(m => m.id === saved.id);
        if (m) { m.level = saved.level; m.active = saved.active; m.unlocked = saved.unlocked; }
      }
    }
    if (data.crisesEncountered) {
      for (const c of data.crisesEncountered) mutations.crisesEncountered.add(c);
    }
    if (data.seasons) {
      seasons.year = data.seasons.year;
      seasons.seasonIndex = data.seasons.seasonIndex;
      seasons.elapsed = data.seasons.elapsed;
    }
    if (data.codex) {
      for (const saved of data.codex) {
        const e = codex.getAll().find(e => e.id === saved.id);
        if (e) e.unlocked = saved.unlocked;
      }
    }
    if (data.tree) tree.phaseIndex = data.tree.phaseIndex;
  }

  static deleteSave() {
    try { localStorage.removeItem(SaveSystem.SAVE_KEY); } catch(e) {}
  }
}
