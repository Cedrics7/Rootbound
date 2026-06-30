/**
 * CreatureRenderer – prozedurales Tier + Quest-Animationen + Bestäuben-Partikel.
 */
export class CreatureRenderer {
  constructor(scene, creatureSystem) {
    this.scene    = scene;
    this.creature = creatureSystem;
    this.gfx      = scene.add.graphics().setDepth(8);
    this.fxGfx    = scene.add.graphics().setDepth(7); // Partikel / Umgebung
    this.x        = scene.scale.width  * 0.38;
    this.y        = scene.scale.height * 0.76;
    this._walkT   = 0;
    this._bobPhase = Math.random() * Math.PI * 2;
    this._visible  = true;
    this._particles = [];   // { x, y, vx, vy, alpha, color, size, life, maxLife }
    this._lastQuest = null; // Animationszustand wechselt nur bei Quest-Typ-Wechsel
    this._returnBurst = false;
  }

  tick(delta) {
    if (!this.creature.isReady() || !this._visible) {
      this.gfx.clear(); this.fxGfx.clear();
      return;
    }
    this._walkT += delta * 0.002;

    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const baseX = W * 0.38;
    const baseY = H * 0.76;

    const onQuest  = this.creature.isOnQuest();
    const progress = onQuest ? this.creature.getQuestProgress() : 0;
    const qType    = this.creature.currentQuest()?.type || null;

    // ── Tier-Position ────────────────────────────────────────────────────────
    if (onQuest) {
      if (progress < 0.82) {
        // Hinweg: läuft zum rechten Rand mit Bogen
        const t = progress / 0.82;
        this.x = baseX + (W * 0.90 - baseX) * t;
        this.y = baseY - Math.sin(t * Math.PI) * H * 0.18; // Bogen nach oben
      } else {
        // Rückkehr: schnell zurück
        const t = (progress - 0.82) / 0.18;
        this.x = W * 0.90 + (baseX - W * 0.90) * t;
        this.y = baseY - Math.sin((1 - t) * Math.PI) * H * 0.04;
        // Einmal Rückkehr-Burst spawnen
        if (!this._returnBurst) {
          this._returnBurst = true;
          this._spawnBurst(this.x, this.y, 12, 0xa0ff60);
        }
      }
      // Quest-Typ-Partikel laufend spawnen
      if (progress < 0.82) this._spawnQuestParticles(qType, this.x, this.y, delta);
    } else {
      // Idle: Wippen am Baum
      this._returnBurst = false;
      this.x = baseX + Math.sin(this._walkT * 0.7) * 14;
      this.y = baseY + Math.sin(this._walkT * 1.4 + this._bobPhase) * 4;
    }

    this._updateParticles(delta);
    this._drawFX();
    this._draw();
  }

  // ── Quest-typ-spezifische Partikel ─────────────────────────────────────────
  _spawnQuestParticles(type, x, y, delta) {
    const rate = delta * 0.06; // Partikel pro ms-Tick
    if (Math.random() > rate) return;

    switch (type) {
      case 'pollinate':
        // Blütenblätter + Blumen-Punkte ringsum
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.4 + Math.random() * 0.8;
          this._particles.push({
            x: x + Math.cos(angle) * 10, y: y + Math.sin(angle) * 8,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.6,
            color: [0xff80c0, 0xffb0e0, 0xffd0a0, 0xffffff][Math.floor(Math.random() * 4)],
            size: 2.5 + Math.random() * 2, alpha: 0.9,
            life: 0, maxLife: 900 + Math.random() * 600,
            shape: 'petal',
          });
        }
        break;
      case 'explore':
        // Sternchen-Funken (Erkundung)
        this._particles.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y - 10 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 0.5, vy: -0.5 - Math.random() * 0.5,
          color: 0xf0e060, size: 1.5 + Math.random() * 1.5, alpha: 0.8,
          life: 0, maxLife: 700,
        });
        break;
      case 'gather':
        // Grüne Ressourcen-Tropfen
        this._particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y - Math.random() * 15,
          vx: (Math.random() - 0.5) * 0.4, vy: 0.5 + Math.random() * 0.6,
          color: 0x80d060, size: 2 + Math.random() * 2, alpha: 0.85,
          life: 0, maxLife: 800,
        });
        break;
      case 'dig':
        // Erdschollen
        this._particles.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y + 5,
          vx: (Math.random() - 0.5) * 1.2, vy: -(0.6 + Math.random() * 0.8),
          color: [0x8a5a18, 0xa06828, 0xc09050][Math.floor(Math.random() * 3)],
          size: 2.5 + Math.random() * 2.5, alpha: 0.9,
          life: 0, maxLife: 600,
        });
        break;
      default:
        this._particles.push({
          x, y: y - 10, vx: (Math.random() - 0.5) * 0.3, vy: -0.4,
          color: 0xa0c080, size: 1.5, alpha: 0.7, life: 0, maxLife: 600,
        });
    }
  }

  _spawnBurst(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;
      this._particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color, size: 2 + Math.random() * 2, alpha: 1, life: 0, maxLife: 600,
      });
    }
  }

  _updateParticles(delta) {
    for (const p of this._particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.015; // Schwerkraft
      p.life += delta;
      p.alpha = (1 - p.life / p.maxLife) * 0.9;
    }
    this._particles = this._particles.filter(p => p.life < p.maxLife && p.alpha > 0.01);
    if (this._particles.length > 120) this._particles.splice(0, this._particles.length - 120);
  }

  // ── Bestäuben-Blumen im Hintergrund (statisch, Quest-typ) ─────────────────
  _drawFX() {
    const g = this.fxGfx;
    g.clear();

    // Partikel zeichnen
    for (const p of this._particles) {
      g.fillStyle(p.color, p.alpha);
      if (p.shape === 'petal') {
        // Blütenblatt-Form: kleines Ellipsoid
        g.fillEllipse(p.x, p.y, p.size * 2, p.size);
        g.fillEllipse(p.x, p.y, p.size, p.size * 2);
      } else {
        g.fillCircle(p.x, p.y, p.size);
      }
    }

    // Während Bestäuben: 3 kleine Blumen entlang der Flugbahn anzeigen
    if (this.creature.isOnQuest() && this.creature.currentQuest()?.type === 'pollinate') {
      const W = this.scene.scale.width, H = this.scene.scale.height;
      const flowers = [
        { x: W * 0.55, y: H * 0.72 },
        { x: W * 0.70, y: H * 0.65 },
        { x: W * 0.84, y: H * 0.70 },
      ];
      const progress = this.creature.getQuestProgress();
      flowers.forEach((f, i) => {
        const visited = progress > (i + 1) / 3.5;
        const color   = visited ? 0x60ff80 : 0xffb0d0;
        const pulse   = 1 + Math.sin(this._walkT * 3 + i) * 0.15;
        this._drawFlower(g, f.x, f.y, color, 7 * pulse, visited);
      });
    }
  }

  _drawFlower(g, x, y, color, r, visited) {
    // 5 Blütenblätter
    g.fillStyle(color, visited ? 0.9 : 0.65);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.6);
    }
    // Kern
    g.fillStyle(visited ? 0xffff80 : 0xfff080, 1);
    g.fillCircle(x, y, r * 0.45);
    if (visited) {
      // Häkchen-Glow
      g.lineStyle(1.5, 0x40ff80, 0.8);
      g.strokeCircle(x, y, r * 1.3);
    }
  }

  // ── Tier zeichnen ─────────────────────────────────────────────────────────
  _draw() {
    const g = this.gfx;
    g.clear();
    const { x, y } = this;
    const shape = this.creature.archetype?.shape || 'rodent';
    const color = this.creature.archetype?.color || 0xc8a060;
    const scale = 0.8 + (this.creature.level - 1) * 0.04;

    if (shape === 'bird')   this._drawBird(g, x, y, color, scale);
    if (shape === 'rodent') this._drawRodent(g, x, y, color, scale);
    if (shape === 'insect') this._drawInsect(g, x, y, color, scale);

    // Fortschritts-Ring bei Quest
    if (this.creature.isOnQuest()) {
      const p = this.creature.getQuestProgress();
      g.lineStyle(2, 0xffffff, 0.35);
      g.strokeCircle(x, y - 20 * scale, 8 * scale);
      g.lineStyle(2.5, 0xa0ff60, 1);
      g.beginPath();
      g.arc(x, y - 20 * scale, 8 * scale, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2, false);
      g.strokePath();
    }
  }

  _drawBird(g, x, y, color, s) {
    g.fillStyle(color, 1);
    g.fillEllipse(x, y, 22 * s, 14 * s);
    g.fillCircle(x + 11 * s, y - 3 * s, 8 * s);
    g.fillStyle(0xf0b040, 1);
    g.fillTriangle(x + 18 * s, y - 3 * s, x + 25 * s, y - 1 * s, x + 18 * s, y + 1 * s);
    g.fillStyle(0x101010, 1);
    g.fillCircle(x + 13 * s, y - 5 * s, 2 * s);
    g.fillStyle(Math.round(color * 0.7), 0.8);
    g.fillEllipse(x - 4 * s, y - 4 * s, 14 * s, 8 * s);
    g.lineStyle(1.5, 0xd08030, 1);
    g.lineBetween(x + 2 * s, y + 6 * s, x + 2 * s, y + 12 * s);
    g.lineBetween(x + 6 * s, y + 6 * s, x + 6 * s, y + 12 * s);
  }

  _drawRodent(g, x, y, color, s) {
    g.fillStyle(color, 1);
    g.fillEllipse(x, y, 24 * s, 16 * s);
    g.fillCircle(x + 12 * s, y - 2 * s, 9 * s);
    g.fillStyle(0xf0a0a0, 1);
    g.fillCircle(x + 10 * s, y - 12 * s, 5 * s);
    g.fillCircle(x + 18 * s, y - 10 * s, 4 * s);
    g.fillStyle(color, 1);
    g.fillCircle(x + 10 * s, y - 12 * s, 3 * s);
    g.fillCircle(x + 18 * s, y - 10 * s, 2.5 * s);
    g.fillStyle(0x101010, 1);
    g.fillCircle(x + 15 * s, y - 4 * s, 2 * s);
    g.fillStyle(0xf080a0, 1);
    g.fillCircle(x + 20 * s, y - 2 * s, 2 * s);
    g.lineStyle(2.5, color, 0.8);
    g.beginPath();
    g.arc(x - 14 * s, y + 4 * s, 10 * s, 0, Math.PI * 1.2, false);
    g.strokePath();
  }

  _drawInsect(g, x, y, color, s) {
    g.fillStyle(color, 1);
    g.fillEllipse(x - 6 * s, y + 2 * s, 16 * s, 10 * s);
    g.fillCircle(x + 4 * s, y, 7 * s);
    g.fillCircle(x + 12 * s, y - 2 * s, 6 * s);
    g.fillStyle(0x101010, 1);
    g.fillCircle(x + 14 * s, y - 5 * s, 2.5 * s);
    g.lineStyle(1.5, color, 1);
    g.lineBetween(x + 12 * s, y - 8 * s, x + 8 * s,  y - 18 * s);
    g.lineBetween(x + 14 * s, y - 8 * s, x + 18 * s, y - 17 * s);
    g.fillStyle(0xd0f0ff, 0.45);
    g.fillEllipse(x + 2 * s, y - 8 * s, 18 * s, 8 * s);
    g.fillEllipse(x + 6 * s, y - 5 * s, 14 * s, 6 * s);
    g.lineStyle(1.2, color, 0.9);
    for (let i = 0; i < 3; i++) {
      const lx = x + (i - 1) * 5 * s;
      g.lineBetween(lx, y + 4 * s, lx - 6 * s, y + 12 * s);
      g.lineBetween(lx, y + 4 * s, lx + 6 * s, y + 12 * s);
    }
  }

  setVisible(v) { this._visible = v; if (!v) { this.gfx.clear(); this.fxGfx.clear(); } }
  destroy()     { this.gfx.destroy(); this.fxGfx.destroy(); }
}
