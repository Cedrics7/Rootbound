import { SEASONS, SEASON_DURATION_MS } from '../config/seasons.js';

export class SeasonSystem {
  constructor(onSeasonChange) {
    this.currentIndex = 0;      // Start: Frühling
    this.elapsed = 0;
    this.onSeasonChange = onSeasonChange;
    this.year = 1;

    // Aktives Ereignis
    this.activeEvent = null;
    this.eventElapsed = 0;
    this.onEventStart = null;   // Callback: (event) => void
    this.onEventEnd   = null;   // Callback: (event) => void
  }

  get current() {
    return SEASONS[this.currentIndex];
  }

  /**
   * @param {number} delta - ms seit letztem Frame
   */
  update(delta) {
    this.elapsed += delta;

    // Jahreszeit wechseln
    if (this.elapsed >= SEASON_DURATION_MS) {
      this.elapsed = 0;
      const prev = this.currentIndex;
      this.currentIndex = (this.currentIndex + 1) % SEASONS.length;

      if (this.currentIndex === 0) this.year++;

      // Aktives Event abbrechen beim Saisonwechsel
      if (this.activeEvent) {
        this.activeEvent = null;
        this.onEventEnd && this.onEventEnd(null);
      }

      this.onSeasonChange(SEASONS[prev], this.current, this.year);
    }

    // Aktives Event aktualisieren
    if (this.activeEvent) {
      this.eventElapsed += delta;
      if (this.eventElapsed >= this.activeEvent.duration) {
        const ended = this.activeEvent;
        this.activeEvent = null;
        this.eventElapsed = 0;
        this.onEventEnd && this.onEventEnd(ended);
      }
    } else {
      // Zufälliges Event der aktuellen Saison triggern?
      this._trySpawnEvent();
    }
  }

  _trySpawnEvent() {
    const events = this.current.events;
    if (!events || events.length === 0) return;

    for (const ev of events) {
      // chance ist pro Sekunde → normieren auf ~16ms-Delta
      if (Math.random() < ev.chance * 0.016) {
        this.activeEvent = ev;
        this.eventElapsed = 0;
        this.onEventStart && this.onEventStart(ev);
        return;
      }
    }
  }

  /**
   * Gibt den aktuellen Ereignis-Bonus zurück (Rate-Modifikatoren)
   * @returns {{ light: number, water: number, nutrients: number }}
   */
  getEventEffect() {
    if (!this.activeEvent) return { light: 0, water: 0, nutrients: 0 };
    const e = this.activeEvent.effect;
    return {
      light:     e.light     || 0,
      water:     e.water     || 0,
      nutrients: e.nutrients || 0,
    };
  }

  // Fortschritt der aktuellen Jahreszeit (0–1)
  getProgress() {
    return this.elapsed / SEASON_DURATION_MS;
  }

  // Fortschritt des aktiven Events (0–1), oder -1
  getEventProgress() {
    if (!this.activeEvent) return -1;
    return this.eventElapsed / this.activeEvent.duration;
  }
}
