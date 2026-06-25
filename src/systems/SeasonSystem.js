import { SEASONS, SEASON_DURATION_MS } from '../config/seasons.js';

export class SeasonSystem {
  constructor(onSeasonChange) {
    this.currentIndex = 0;      // Start: Frühling
    this.elapsed = 0;
    this.onSeasonChange = onSeasonChange;
    this.year = 1;
  }

  get current() {
    return SEASONS[this.currentIndex];
  }

  /**
   * @param {number} delta - ms seit letztem Frame (Phaser liefert das)
   */
  update(delta) {
    this.elapsed += delta;

    if (this.elapsed >= SEASON_DURATION_MS) {
      this.elapsed = 0;
      const prev = this.currentIndex;
      this.currentIndex = (this.currentIndex + 1) % SEASONS.length;

      if (this.currentIndex === 0) this.year++;

      this.onSeasonChange(SEASONS[prev], this.current, this.year);
    }
  }

  // Fortschritt der aktuellen Jahreszeit (0–1)
  getProgress() {
    return this.elapsed / SEASON_DURATION_MS;
  }
}
