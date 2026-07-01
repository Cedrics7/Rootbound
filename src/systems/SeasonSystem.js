import { SEASONS, SEASON_DURATION_MS } from '../config/seasons.js';

export class SeasonSystem {
  constructor(onSeasonChange) {
    this.currentIndex = 0;
    this.elapsed = 0;
    this.onSeasonChange = onSeasonChange;
    this.year = 1;
    this.activeEvent = null;
    this.eventElapsed = 0;
    this.onEventStart = null;
    this.onEventEnd   = null;
  }

  get current() {
    return SEASONS[this.currentIndex];
  }

  update(delta) {
    this.elapsed += delta;
    if (this.elapsed >= SEASON_DURATION_MS) {
      this.elapsed = 0;
      const prev = this.currentIndex;
      this.currentIndex = (this.currentIndex + 1) % SEASONS.length;
      if (this.currentIndex === 0) this.year++;
      if (this.activeEvent) {
        this.activeEvent = null;
        this.onEventEnd && this.onEventEnd(null);
      }
      this.onSeasonChange(SEASONS[prev], this.current, this.year);
    }
    if (this.activeEvent) {
      this.eventElapsed += delta;
      if (this.eventElapsed >= this.activeEvent.duration) {
        const ended = this.activeEvent;
        this.activeEvent = null;
        this.eventElapsed = 0;
        this.onEventEnd && this.onEventEnd(ended);
      }
    } else {
      this._trySpawnEvent();
    }
  }

  _trySpawnEvent() {
    const events = this.current.events;
    if (!events || events.length === 0) return;
    for (const ev of events) {
      if (Math.random() < ev.chance * 0.016) {
        this.activeEvent = ev;
        this.eventElapsed = 0;
        this.onEventStart && this.onEventStart(ev);
        return;
      }
    }
  }

  getEventEffect() {
    if (!this.activeEvent) return { light: 0, water: 0, nutrients: 0 };
    const e = this.activeEvent.effect;
    return {
      light:     e.light     || 0,
      water:     e.water     || 0,
      nutrients: e.nutrients || 0,
    };
  }

  getProgress() {
    return this.elapsed / SEASON_DURATION_MS;
  }

  getEventProgress() {
    if (!this.activeEvent) return -1;
    return this.eventElapsed / this.activeEvent.duration;
  }

  serialize() {
    return {
      currentIndex: this.currentIndex,
      elapsed:      this.elapsed,
      year:         this.year,
    };
  }

  restore(data) {
    if (data.currentIndex != null) this.currentIndex = data.currentIndex;
    if (data.elapsed      != null) this.elapsed      = data.elapsed;
    if (data.year         != null) this.year         = data.year;
  }
}
