import { getEvolutionStage } from '../config/creatures.js';

/**
 * CreatureRenderer – prozedurales Tier mit Evolutionsstufen.
 * Bestäuben-Blumen bleiben persistent.
 */
export class CreatureRenderer {
  constructor(scene, creatureSystem) {
    this.scene    = scene;
    this.creature = creatureSystem;
    this.gfx      = scene.add.graphics().setDepth(8);
    this.fxGfx    = scene.add.graphics().setDepth(7);
    this.x        = scene.scale.width  * 0.38;
    this.y        = scene.scale.height * 0.76;
    this._walkT   = 0;
    this._bobPhase   = Math.random() * Math.PI * 2;
    this._visible    = true;
    this._particles  = [];
    this._returnBurst = false;
    this._flowers    = this._buildFlowers();
    // Metamorphose-Glow-Timer
    this._metaGlow   = 0;   // 0..1, wird bei Metamorphose kurz auf 1 gesetzt
  }

  _buildFlowers() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    return [
      { x: W * 0.54, y: H * 0.74, visited: false, pulseOffset: 0 },
      { x: W * 0.68, y: H * 0.70, visited: false, pulseOffset: 1.2 },
      { x: W * 0.82, y: H * 0.73, visited: false, pulseOffset: 2.4 },
    ];
  }

  // Metamorphose von außen triggern (kurzes Leuchten)
  triggerMetaGlow() { this._metaGlow = 1; }

  tick(delta) {
    if (!this.creature.isReady() || !this._visible) {
      this.gfx.clear(); this.fxGfx.clear(); return;
    }
    this._walkT += delta * 0.002;
    if (this._metaGlow > 0) this._metaGlow = Math.max(0, this._metaGlow - delta * 0.001);

    const W = this.scene.scale.width, H = this.scene.scale.height;
    const baseX = W * 0.38, baseY = H * 0.76;
    const onQuest  = this.creature.isOnQuest();
    const progress = onQuest ? this.creature.getQuestProgress() : 0;
    const qType    = this.creature.currentQuest()?.type || null;

    if (onQuest) {
      if (qType === 'pollinate') {
        const steps  = this._flowers.length;
        const segLen = 0.80 / steps;
        let tx = baseX, ty = baseY;
        for (let i = 0; i < steps; i++) {
          const segStart = i * segLen, segEnd = segStart + segLen;
          if (progress >= segStart && progress < segEnd) {
            const t    = (progress - segStart) / segLen;
            const prev = i === 0 ? { x: baseX, y: baseY } : this._flowers[i - 1];
            tx = prev.x + (this._flowers[i].x - prev.x) * t;
            ty = prev.y + (this._flowers[i].y - prev.y) * t - Math.sin(t * Math.PI) * 18;
            if (t > 0.85 && !this._flowers[i].visited) this._flowers[i].visited = true;
          }
        }
        if (progress >= 0.80) {
          const t = (progress - 0.80) / 0.20;
          tx = this._flowers[steps - 1].x + (baseX - this._flowers[steps - 1].x) * t;
          ty = this._flowers[steps - 1].y + (baseY - this._flowers[steps - 1].y) * t;
          if (!this._returnBurst) { this._returnBurst = true; this._spawnBurst(baseX, baseY, 8, 0xff80c0); }
        }
        this.x = tx; this.y = ty;
        if (progress < 0.80 && Math.random() < 0.04) this._spawnPetal(this.x, this.y);
      } else {
        if (progress < 0.80) {
          const t = progress / 0.80;
          this.x = baseX + (W * 0.72 - baseX) * t;
          this.y = baseY;
        } else {
          const t = (progress - 0.80) / 0.20;
          this.x = W * 0.72 + (baseX - W * 0.72) * t;
          this.y = baseY;
          if (!this._returnBurst) { this._returnBurst = true; this._spawnBurst(this.x, this.y, 8, 0xa0ff60); }
        }
      }
    } else {
      this._returnBurst = false;
      this.x = baseX + Math.sin(this._walkT * 0.7) * 14;
      this.y = baseY + Math.sin(this._walkT * 1.4 + this._bobPhase) * 4;
    }

    this._updateParticles(delta);
    this._drawFX();
    this._draw();
  }

  // ─ Partikel ──────────────────────────────────────────────
  _spawnPetal(x, y) {
    const a = Math.random() * Math.PI * 2;
    this._particles.push({ x: x + Math.cos(a)*8, y: y + Math.sin(a)*6,
      vx: Math.cos(a)*0.5, vy: Math.sin(a)*0.5 - 0.4,
      color: [0xff80c0,0xffb0e0,0xffd0a0][Math.floor(Math.random()*3)],
      size: 2.5, alpha: 0.85, life: 0, maxLife: 1000 });
  }

  _spawnBurst(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const a = (i/count)*Math.PI*2, spd = 1.2 + Math.random()*1.5;
      this._particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
        color, size: 2, alpha: 1, life: 0, maxLife: 500 });
    }
  }

  _updateParticles(delta) {
    for (const p of this._particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.012;
      p.life += delta; p.alpha = (1 - p.life/p.maxLife)*0.85;
    }
    this._particles = this._particles.filter(p => p.alpha > 0.01);
    if (this._particles.length > 40) this._particles.splice(0, this._particles.length - 40);
  }

  // ─ FX-Layer ───────────────────────────────────────────────
  _drawFX() {
    const g = this.fxGfx;
    g.clear();

    // Blumen
    if (this.creature.treeUnlocked) {
      for (const f of this._flowers) {
        const pulse = 1 + Math.sin(this._walkT*2.5 + f.pulseOffset) * 0.1;
        this._drawFlower(g, f.x, f.y, f.visited ? 0x60ff80 : 0xffb0d0, 7*pulse, f.visited);
      }
    }

    // Metamorphose-Glow um das Tier
    if (this._metaGlow > 0) {
      const stage = this.creature.currentStage();
      const col   = stage?.colorTint || 0xffffff;
      g.fillStyle(col, this._metaGlow * 0.35);
      g.fillCircle(this.x, this.y, 55 * this._metaGlow);
      g.lineStyle(2, col, this._metaGlow * 0.8);
      g.strokeCircle(this.x, this.y, 40 * this._metaGlow);
    }

    // Partikel
    for (const p of this._particles) {
      g.fillStyle(p.color, p.alpha);
      g.fillEllipse(p.x, p.y, p.size*1.8, p.size);
    }
  }

  _drawFlower(g, x, y, color, r, visited) {
    g.fillStyle(color, visited ? 0.9 : 0.55);
    for (let i = 0; i < 5; i++) {
      const a = (i/5)*Math.PI*2;
      g.fillCircle(x + Math.cos(a)*r, y + Math.sin(a)*r, r*0.55);
    }
    g.fillStyle(visited ? 0xffff80 : 0xfff080, 1); g.fillCircle(x, y, r*0.4);
    if (visited) { g.lineStyle(1, 0x40ff80, 0.6); g.strokeCircle(x, y, r*1.4); }
  }

  // ─ Tier zeichnen (mit Evolutionsstufe) ──────────────────────────────
  _draw() {
    const g = this.gfx;
    g.clear();
    const { x, y } = this;
    const stage = this.creature.currentStage();
    const shape  = this.creature.archetype?.shape || 'rodent';
    const color  = stage?.colorTint ?? (this.creature.archetype?.color ?? 0xc8a060);
    const scale  = stage?.scale ?? (0.8 + (this.creature.level - 1) * 0.04);

    if (shape === 'bird')   this._drawBird(g, x, y, color, scale, stage);
    if (shape === 'rodent') this._drawRodent(g, x, y, color, scale, stage);
    if (shape === 'insect') this._drawInsect(g, x, y, color, scale, stage);

    // Fortschritts-Ring
    if (this.creature.isOnQuest()) {
      const p = this.creature.getQuestProgress();
      g.lineStyle(2, 0xffffff, 0.3); g.strokeCircle(x, y - 20*scale, 8*scale);
      g.lineStyle(2.5, 0xa0ff60, 1);
      g.beginPath();
      g.arc(x, y - 20*scale, 8*scale, -Math.PI/2, -Math.PI/2 + p*Math.PI*2, false);
      g.strokePath();
    }
  }

  _drawBird(g, x, y, color, s, stage) {
    const ws = stage?.wingSpan ?? 0; // 0..3 Flügelgröße
    // Flügel (größer mit Evolution)
    if (ws > 0) {
      g.fillStyle(color, 0.5);
      g.fillEllipse(x - (8 + ws*6)*s, y - 3*s, (14 + ws*6)*s, (6 + ws*2)*s);
      g.fillEllipse(x + (4 + ws*4)*s, y - 3*s, (12 + ws*5)*s, (6 + ws*2)*s);
    }
    g.fillStyle(color, 1); g.fillEllipse(x, y, 22*s, 14*s);
    g.fillCircle(x+11*s, y-3*s, 8*s);
    g.fillStyle(0xf0b040, 1); g.fillTriangle(x+18*s, y-3*s, x+25*s, y-1*s, x+18*s, y+1*s);
    g.fillStyle(0x101010, 1); g.fillCircle(x+13*s, y-5*s, 2*s);
    g.lineStyle(1.5, 0xd08030, 1);
    g.lineBetween(x+2*s, y+6*s, x+2*s, y+12*s);
    g.lineBetween(x+6*s, y+6*s, x+6*s, y+12*s);
    // Metamorphose: Flammen-Glow
    if (stage?.metamorphosis) {
      g.lineStyle(1.5, 0xff8020, 0.6); g.strokeCircle(x+4*s, y-2*s, 16*s);
    }
  }

  _drawRodent(g, x, y, color, s, stage) {
    const earSz = stage?.earSize ?? 1;
    g.fillStyle(color, 1); g.fillEllipse(x, y, 24*s, 16*s); g.fillCircle(x+12*s, y-2*s, 9*s);
    g.fillStyle(0xf0a0a0, 1);
    g.fillCircle(x+10*s, y-12*s, 5*earSz*s); g.fillCircle(x+18*s, y-10*s, 4*earSz*s);
    g.fillStyle(color, 1);
    g.fillCircle(x+10*s, y-12*s, 3*earSz*s); g.fillCircle(x+18*s, y-10*s, 2.5*earSz*s);
    g.fillStyle(0x101010, 1); g.fillCircle(x+15*s, y-4*s, 2*s);
    g.fillStyle(0xf080a0, 1); g.fillCircle(x+20*s, y-2*s, 2*s);
    g.lineStyle(2.5, color, 0.8); g.beginPath();
    g.arc(x-14*s, y+4*s, 10*s, 0, Math.PI*1.2, false); g.strokePath();
    if (stage?.metamorphosis) {
      g.lineStyle(1.5, 0xffe080, 0.5); g.strokeCircle(x+4*s, y-2*s, 18*s);
    }
  }

  _drawInsect(g, x, y, color, s, stage) {
    const wa = stage?.wingAlpha ?? 0.45;
    g.fillStyle(color, 1);
    g.fillEllipse(x-6*s, y+2*s, 16*s, 10*s); g.fillCircle(x+4*s, y, 7*s); g.fillCircle(x+12*s, y-2*s, 6*s);
    g.fillStyle(0x101010, 1); g.fillCircle(x+14*s, y-5*s, 2.5*s);
    g.lineStyle(1.5, color, 1);
    g.lineBetween(x+12*s, y-8*s, x+8*s,  y-18*s);
    g.lineBetween(x+14*s, y-8*s, x+18*s, y-17*s);
    // Flügel wachsen mit Evolution
    if (wa > 0) {
      g.fillStyle(stage?.metamorphosis ? color : 0xd0f0ff, wa);
      g.fillEllipse(x+2*s, y-8*s, (18 + (wa>0.7?8:0))*s, (8 + (wa>0.7?4:0))*s);
      g.fillEllipse(x+6*s, y-5*s, (14 + (wa>0.7?6:0))*s, (6 + (wa>0.7?3:0))*s);
    }
    g.lineStyle(1.2, color, 0.9);
    for (let i = 0; i < 3; i++) {
      const lx = x+(i-1)*5*s;
      g.lineBetween(lx, y+4*s, lx-6*s, y+12*s);
      g.lineBetween(lx, y+4*s, lx+6*s, y+12*s);
    }
    if (stage?.metamorphosis) {
      g.lineStyle(2, 0x8040ff, 0.7); g.strokeCircle(x+4*s, y-2*s, 20*s);
    }
  }

  setVisible(v) { this._visible = v; if (!v) { this.gfx.clear(); this.fxGfx.clear(); } }
  destroy()     { this.gfx.destroy(); this.fxGfx.destroy(); }
}
