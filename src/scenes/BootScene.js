import { SaveSystem } from '../systems/SaveSystem.js';

/**
 * BootScene – Startbildschirm mit Neu/Weiterspielen-Option.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const hasSave = SaveSystem.hasSave();

    // Hintergrund-Gradient
    const g = this.add.graphics();
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(5  + t * 10);
      const gr = Math.round(15 + t * 30);
      const b = Math.round(5  + t * 10);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
      g.fillRect(0, (H * i) / steps, W, H / steps + 1);
    }

    // Titel
    this.add.text(W / 2, H * 0.22, '🌳', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.38, 'ROOTBOUND', {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: '52px', fill: '#a0d878',
      stroke: '#0a1a0a', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.48, 'Du bist der Baum. Du bist das Ökosystem.', {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: '16px', fill: '#607850',
    }).setOrigin(0.5);

    // Buttons
    if (hasSave) {
      this._makeButton(W / 2, H * 0.60, '▶  Weiterspielen', '#a0d878', 0x1a3a1a, () => {
        this.scene.start('GameScene', { loadSave: true });
      });
      this._makeButton(W / 2, H * 0.70, '🌱  Neues Spiel', '#c0b080', 0x2a2810, () => {
        SaveSystem.deleteSave();
        this.scene.start('GameScene', { loadSave: false });
      });

      // Speicher-Datum
      try {
        const saved = JSON.parse(localStorage.getItem('rootbound_save_v1'));
        if (saved?.savedAt) {
          const d = new Date(saved.savedAt);
          this.add.text(W / 2, H * 0.77,
            'Gespeichert: ' + d.toLocaleString('de-DE'),
            { fontFamily: 'sans-serif', fontSize: '11px', fill: '#5a6850' }
          ).setOrigin(0.5);
        }
      } catch (_) {}
    } else {
      this._makeButton(W / 2, H * 0.62, '🌱  Spiel starten', '#a0d878', 0x1a3a1a, () => {
        this.scene.start('GameScene', { loadSave: false });
      });
    }

    // Version
    this.add.text(W - 10, H - 10, 'v0.2 Prototyp', {
      fontFamily: 'sans-serif', fontSize: '10px', fill: '#2a3a2a',
    }).setOrigin(1, 1);

    // Dezente Partikel
    this._spawnBootParticles(W, H);
  }

  _makeButton(x, y, label, fillColor, bgColor, onClick) {
    const bg = this.add.rectangle(x, y, 240, 40, bgColor, 0.9)
      .setInteractive({ cursor: 'pointer' })
      .setStrokeStyle(1, 0x3a6a2a, 0.8);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '15px', fill: fillColor,
    }).setOrigin(0.5);
    bg.on('pointerover',  () => bg.setScale(1.04));
    bg.on('pointerout',   () => bg.setScale(1.0));
    bg.on('pointerdown',  onClick);
    return { bg, txt };
  }

  _spawnBootParticles(W, H) {
    const pg = this.add.graphics();
    const pts = Array.from({ length: 30 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vy: 0.2 + Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      r: 1 + Math.random() * 2.5,
      a: 0.2 + Math.random() * 0.5,
      color: [0x80d060, 0xffb8c8, 0xa0f0c0][Math.floor(Math.random() * 3)],
    }));
    this.time.addEvent({ delay: 30, loop: true, callback: () => {
      pg.clear();
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y > H) p.y = -5;
        pg.fillStyle(p.color, p.a);
        pg.fillCircle(p.x, p.y, p.r);
      }
    }});
  }
}
