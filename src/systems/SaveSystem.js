/**
 * SaveSystem – speichert und lädt den gesamten Spielstand.
 * Unterstützt jetzt auch SkillSystem.
 */
export class SaveSystem {
  static KEY = 'rootbound_save_v1';

  static hasSave() {
    try {
      return localStorage.getItem(SaveSystem.KEY) !== null;
    } catch(e) { return false; }
  }

  static save(resources, mutations, seasons, codex, tree, forest, creature, skillSys = null) {
    const data = {
      resources:  resources.serialize(),
      mutations:  mutations.serialize(),
      seasons:    seasons.serialize(),
      codex:      codex.serialize(),
      tree:       tree.serialize(),
      forest:     forest ? forest.serialize() : null,
      creature:   creature ? creature.serialize() : null,
      skills:     skillSys ? skillSys.serialize() : null,
      savedAt:    Date.now(),
    };
    try {
      localStorage.setItem(SaveSystem.KEY, JSON.stringify(data));
    } catch(e) {
      console.warn('SaveSystem: konnte nicht speichern', e);
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(SaveSystem.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  static restore(data, resources, mutations, seasons, codex, tree) {
    if (data.resources) resources.restore(data.resources);
    if (data.mutations) mutations.restore(data.mutations);
    if (data.seasons)   seasons.restore(data.seasons);
    if (data.codex)     codex.restore(data.codex);
    if (data.tree)      tree.restore(data.tree);
    // skills werden in GameScene direkt via skillSys.restore(data.skills) geladen
  }

  static deleteSave() {
    try { localStorage.removeItem(SaveSystem.KEY); } catch(e) {}
  }
}
