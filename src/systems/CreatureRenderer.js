/**
 * CreatureRenderer – zeichnet das Tier prozedural in Phaser.
 * Kein externes Asset nötig.
 */
export class CreatureRenderer {
  constructor(scene, creatureSystem) {
    this.scene    = scene;
    this.creature = creatureSystem;
    this.gfx      = scene.add.graphics().setDepth(8);
    this.x        = scene.scale.width  * 0.38;
    this.y        = scene.scale.height * 0.76;
    this._walkT   = 0;
    this._questArc = 0;  // 0..1 während Quest-Animation (Tier läuft weg/zurück)
    this._returning = false;
    this._visible   = true;
    this._bobPhase  = Math.random() * Math.PI * 2;
  }

  tick(delta) {
    if (!this.creature.isReady() || !this._visible) { this.gfx.clear(); return; }
    this._walkT += delta * 0.002;

    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const baseX = W * 0.38;
    const baseY = H * 0.76;

    if (this.creature.isOnQuest()) {
      // Tier läuft zum Rand hin
      const progress = this.creature.getQuestProgress();
      if (progress < 0.88) {
        this.x = baseX + (W * 0.55 - baseX) * (progress / 0.88);
        this.y = baseY;
      } else {
        // Rückkehr
        const t = (progress - 0.88) / 0.12;
        this.x = W * 0.55 + (baseX - W * 0.55) * t;
        this.y = baseY;
      }
    } else {
      // Idle: kleines Wippen am Baum
      this.x = baseX + Math.sin(this._walkT * 0.7) * 14;
      this.y = baseY + Math.sin(this._walkT * 1.4 + this._bobPhase) * 4;
    }

    this._draw();
  }

  _draw() {
    const g = this.gfx;
    g.clear();
    const { x, y } = this;
    const shape = this.creature.archetype?.shape || 'rodent';
    const color = this.creature.archetype?.color || 0xc8a060;
    const scale = 0.8 + (this.creature.level - 1) * 0.04; // wächst mit Level

    if (shape === 'bird')   this._drawBird(g, x, y, color, scale);
    if (shape === 'rodent') this._drawRodent(g, x, y, color, scale);
    if (shape === 'insect') this._drawInsect(g, x, y, color, scale);

    // Kleiner Quest-Fortschritts-Ring über dem Tier während Quest
    if (this.creature.isOnQuest()) {
      const p = this.creature.getQuestProgress();
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeCircle(x, y - 20 * scale, 8 * scale);
      g.lineStyle(2, 0xa0ff60, 0.9);
      g.beginPath();
      g.arc(x, y - 20 * scale, 8 * scale, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2, false);
      g.strokePath();
    }
  }

  _drawBird(g, x, y, color, s) {
    // Körper
    g.fillStyle(color, 1);
    g.fillEllipse(x, y, 22 * s, 14 * s);
    // Kopf
    g.fillStyle(color, 1);
    g.fillCircle(x + 11 * s, y - 3 * s, 8 * s);
    // Schnabel
    g.fillStyle(0xf0b040, 1);
    g.fillTriangle(x + 18 * s, y - 3 * s, x + 25 * s, y - 1 * s, x + 18 * s, y + 1 * s);
    // Auge
    g.fillStyle(0x101010, 1);
    g.fillCircle(x + 13 * s, y - 5 * s, 2 * s);
    // Flügel-Andeutung
    g.fillStyle(color * 0.7, 0.8);
    g.fillEllipse(x - 4 * s, y - 4 * s, 14 * s, 8 * s);
    // Beine
    g.lineStyle(1.5, 0xd08030, 1);
    g.lineBetween(x + 2 * s, y + 6 * s, x + 2 * s, y + 12 * s);
    g.lineBetween(x + 6 * s, y + 6 * s, x + 6 * s, y + 12 * s);
  }

  _drawRodent(g, x, y, color, s) {
    // Körper
    g.fillStyle(color, 1);
    g.fillEllipse(x, y, 24 * s, 16 * s);
    // Kopf
    g.fillCircle(x + 12 * s, y - 2 * s, 9 * s);
    // Ohren
    g.fillStyle(0xf0a0a0, 1);
    g.fillCircle(x + 10 * s, y - 12 * s, 5 * s);
    g.fillCircle(x + 18 * s, y - 10 * s, 4 * s);
    g.fillStyle(color, 1);
    g.fillCircle(x + 10 * s, y - 12 * s, 3 * s);
    g.fillCircle(x + 18 * s, y - 10 * s, 2.5 * s);
    // Auge
    g.fillStyle(0x101010, 1);
    g.fillCircle(x + 15 * s, y - 4 * s, 2 * s);
    // Nase
    g.fillStyle(0xf080a0, 1);
    g.fillCircle(x + 20 * s, y - 2 * s, 2 * s);
    // Schwanz
    g.lineStyle(2.5, color, 0.8);
    g.beginPath();
    g.arc(x - 14 * s, y + 4 * s, 10 * s, 0, Math.PI * 1.2, false);
    g.strokePath();
  }

  _drawInsect(g, x, y, color, s) {
    // Hinterleib
    g.fillStyle(color, 1);
    g.fillEllipse(x - 6 * s, y + 2 * s, 16 * s, 10 * s);
    // Thorax
    g.fillStyle(color, 1);
    g.fillCircle(x + 4 * s, y, 7 * s);
    // Kopf
    g.fillCircle(x + 12 * s, y - 2 * s, 6 * s);
    // Augen
    g.fillStyle(0x101010, 1);
    g.fillCircle(x + 14 * s, y - 5 * s, 2.5 * s);
    // Fühler
    g.lineStyle(1.5, color, 1);
    g.lineBetween(x + 12 * s, y - 8 * s, x + 8 * s,  y - 18 * s);
    g.lineBetween(x + 14 * s, y - 8 * s, x + 18 * s, y - 17 * s);
    // Flügel
    g.fillStyle(0xd0f0ff, 0.45);
    g.fillEllipse(x + 2 * s, y - 8 * s, 18 * s, 8 * s);
    g.fillEllipse(x + 6 * s, y - 5 * s, 14 * s, 6 * s);
    // Beine (3 Paar)
    g.lineStyle(1.2, color, 0.9);
    for (let i = 0; i < 3; i++) {
      const lx = x + (i - 1) * 5 * s;
      g.lineBetween(lx, y + 4 * s, lx - 6 * s, y + 12 * s);
      g.lineBetween(lx, y + 4 * s, lx + 6 * s, y + 12 * s);
    }
  }

  setVisible(v) {
    this._visible = v;
    if (!v) this.gfx.clear();
  }

  destroy() { this.gfx.destroy(); }
}
