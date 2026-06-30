export class ForestRenderer {
  constructor(scene, forest) {
    this.scene  = scene;
    this.forest = forest;
    this._gfx   = scene.add.graphics().setDepth(4);
    this._flowerGfx = scene.add.graphics().setDepth(4);
    this._treeGfx   = scene.add.graphics().setDepth(4);
    this._visible   = false;  // erst nach Baum-Unlock sichtbar
    this._gfx.setVisible(false);
    this._flowerGfx.setVisible(false);
    this._treeGfx.setVisible(false);
  }

  show() {
    this._visible = true;
    this._gfx.setVisible(true);
    this._flowerGfx.setVisible(true);
    this._treeGfx.setVisible(true);
  }

  tick(delta, seasonId) {
    if (!this._visible) return;
    this._drawForest(seasonId);
  }

  _drawForest(seasonId) {
    const s = this.scene, W = s.scale.width, H = s.scale.height;
    this._gfx.clear();
    this._flowerGfx.clear();
    this._treeGfx.clear();

    const groundY = H * 0.78;
    const trees   = this.forest.trees;
    if (!trees || trees.length === 0) return;

    trees.forEach((t, idx) => {
      const tx = W * 0.18 + idx * (W * 0.13);
      const ty = groundY;
      const def = t.type?.levels?.[t.level - 1] ?? t.type?.levels?.[0];
      if (!def) return;
      const trunkH = def.trunkH ?? 60;
      const trunkW = def.trunkW ?? 8;
      const leafC  = def.leafColor ?? 0x3a7a2a;

      // Stamm
      this._treeGfx.fillStyle(0x5a3a18, 1);
      this._treeGfx.fillRect(tx - trunkW/2, ty - trunkH, trunkW, trunkH);

      // Krone
      this._treeGfx.fillStyle(leafC, 0.92);
      this._treeGfx.fillEllipse(tx, ty - trunkH - trunkH*0.4, trunkH*0.8, trunkH*0.7);

      // Jahreszeit-Effekte
      if (seasonId === 'autumn') {
        this._flowerGfx.fillStyle(0xe06010, 0.6);
        this._flowerGfx.fillEllipse(tx, ty - trunkH - trunkH*0.4, trunkH*0.85, trunkH*0.72);
      }
      if (seasonId === 'spring') {
        for (let f = 0; f < 5; f++) {
          const fx = tx + (Math.random()-0.5)*trunkH*0.7;
          const fy = ty - trunkH*0.3 - Math.random()*trunkH*0.6;
          this._flowerGfx.fillStyle(0xffb8d0, 0.75);
          this._flowerGfx.fillCircle(fx, fy, 3 + Math.random()*2);
        }
      }
    });
  }
}
