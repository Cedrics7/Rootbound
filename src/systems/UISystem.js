import { TREE_PHASES } from '../config/seasons.js';
import { FOREST_TREE_TYPES, ROOT_DEPTH_LEVELS, FOREST_SLOTS_PER_PHASE } from '../config/forest.js';
import { SaveSystem } from './SaveSystem.js';

export class UISystem {
  constructor(scene, resources, seasons, tree, mutations, codex, forest) {
    this.scene      = scene;
    this.resources  = resources;
    this.seasons    = seasons;
    this.tree       = tree;
    this.mutations  = mutations;
    this.codex      = codex;
    this.forest     = forest;
    this.panelOpen       = false;
    this.forestPanelOpen = false;
    this.codexOpen       = false;
    this._panelElements  = [];
    this._forestElements = [];
    this._codexElements  = [];
    this._logTexts       = [];
    this._mutScrollY     = 0;
    this._forScrollY     = 0;
    this._codScrollY     = 0;
    this._buildHUD();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────────────────
  _buildHUD() {
    const s = this.scene, W = s.scale.width, H = s.scale.height;
    const DS = { fontFamily: '"Cormorant Garamond", Georgia, serif', fill: '#e8e0d0' };
    const BS = { fontFamily: 'sans-serif', fill: '#c8d8b0' };

    s.add.text(16, 14, '🌳 Rootbound', { ...DS, fontSize: '22px', fill: '#a0d878' }).setDepth(10);
    this.seasonText = s.add.text(16, 46, '', { ...DS, fontSize: '15px' }).setDepth(10);
    this.yearText   = s.add.text(16, 66, '', { ...DS, fontSize: '13px', fill: '#a09888' }).setDepth(10);
    this.phaseText  = s.add.text(16, 86, '', { ...DS, fontSize: '12px', fill: '#88b870' }).setDepth(10);

    this.eventBanner = s.add.text(W/2, H-48, '', {
      ...DS, fontSize: '13px', fill: '#ffdd80', stroke: '#000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5).setAlpha(0).setDepth(12);

    const rx = W - 205;
    s.add.text(rx, 14, 'Ressourcen', { ...DS, fontSize: '14px', fill: '#a0d878' }).setDepth(10);
    this.resTexts = {}; this.resBars = {};
    ['light','water','nutrients','symbiosis'].forEach((key, i) => {
      const y = 36+i*34, res = this.resources.getAll()[key];
      if (!res) return;
      s.add.text(rx, y, (res.emoji||'')+' '+res.name, { ...BS, fontSize: '12px' }).setDepth(10);
      this.resTexts[key] = s.add.text(rx+148, y, '', { ...BS, fontSize: '11px', fill: '#c0b8a8' }).setDepth(10);
      s.add.rectangle(rx, y+14, 180, 6, 0x1a1a1a).setOrigin(0,0).setDepth(10);
      this.resBars[key] = s.add.rectangle(rx, y+14, 0, 6,
        { light:0xf0d840, water:0x40a0f0, nutrients:0x70c030, symbiosis:0x40d0a0 }[key]||0xffffff
      ).setOrigin(0,0).setDepth(10);
    });

    const gx = rx, gy = 36+4*34+8;
    s.add.text(gx, gy, 'Nächste Baum-Phase', { ...BS, fontSize: '10px', fill: '#607850' }).setDepth(10);
    this._growthBars = {}; this._growthTexts = {};
    ['light','water','nutrients'].forEach((key, i) => {
      const by = gy+16+i*16;
      s.add.text(gx, by, {light:'☀️',water:'💧',nutrients:'🌱'}[key], { fontFamily:'sans-serif', fontSize:'10px' }).setDepth(10);
      s.add.rectangle(gx+18, by+2, 140, 8, 0x1a1a1a).setOrigin(0,0).setDepth(10);
      this._growthBars[key]  = s.add.rectangle(gx+18, by+2, 0, 8, {light:0xf0d840,water:0x40a0f0,nutrients:0x70c030}[key]).setOrigin(0,0).setDepth(10);
      this._growthTexts[key] = s.add.text(gx+162, by, '', { fontFamily:'sans-serif', fontSize:'9px', fill:'#909888' }).setDepth(10);
    });
    this._growthLabel = s.add.text(gx, gy+16+3*16+2, '', { fontFamily:'sans-serif', fontSize:'10px', fill:'#a0d878' }).setDepth(10);

    s.add.rectangle(W*0.2, H-22, W*0.6, 8, 0x1a1a1a).setOrigin(0,0).setDepth(10);
    this.seasonBar = s.add.rectangle(W*0.2, H-22, 0, 8, 0x60a040).setOrigin(0,0).setDepth(10);
    s.add.text(W*0.2, H-36, 'Jahreszeit-Fortschritt', { ...BS, fontSize:'10px', fill:'#555' }).setDepth(10);

    this._buildMonthStrip();
    this.growthHint = s.add.text(W/2, H*0.88, '', { ...BS, fontSize:'11px', fill:'#a0d878', align:'center' }).setOrigin(0.5).setDepth(10);

    this._buildMutationButton();
    this._buildForestButton();
    this._buildCodexButton();
    this._buildSaveButton();
    this.update();
  }

  _buildSaveButton() {
    const s = this.scene, W = s.scale.width;
    const bg = s.add.rectangle(W-10, 14, 90, 24, 0x0a1a0a, 0.85)
      .setOrigin(1,0).setInteractive({ cursor:'pointer' }).setDepth(11).setStrokeStyle(1,0x2a5a2a);
    const lbl = s.add.text(W-55, 26, '💾 Speichern', { fontFamily:'sans-serif', fontSize:'11px', fill:'#70b060' }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x152515,0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x0a1a0a,0.85));
    bg.on('pointerdown', () => {
      SaveSystem.save(this.resources, this.mutations, this.seasons, this.codex, this.tree, this.forest);
      lbl.setText('✓ Gespeichert');
      this.scene.time.delayedCall(1500, () => lbl.setText('💾 Speichern'));
      this.addEventLog('💾 Spielstand gespeichert.', 'info');
    });
  }

  _buildMonthStrip() {
    const s = this.scene, W = s.scale.width;
    const MC = [0x8ab8cc,0x9ac4d8,0xb0d4c0,0x5fcf6a,0x4db83a,0x2d9a20,0x2d8a10,0x3a9820,0x4aab30,0xc8691a,0xd4801a,0x7090a8];
    this._monthDots = [];
    const sx = W/2-99;
    for (let i = 0; i < 12; i++)
      this._monthDots.push(s.add.circle(sx+i*18, 26, 6, MC[i]).setDepth(10).setAlpha(0.35));
  }

  _updateMonthStrip() {
    const si = ['spring','summer','autumn','winter'].indexOf(this.seasons.current.id);
    const month = si*3 + Math.min(2, Math.floor(this.seasons.getProgress()*3));
    this._monthDots.forEach((d, i) => {
      d.setAlpha(i < month ? 0.7 : i === month ? 1.0 : 0.3);
      d.setScale(i === month ? 1.4 : 1.0);
    });
  }

  addEventLog(msg, type = 'info') {
    const s = this.scene, W = s.scale.width;
    const colors = { event:'#ffdd80', discovery:'#80ffe0', growth:'#a0ff80', season:'#d0d8ff', crisis:'#ff9080', info:'#a0b8a0' };
    if (this._logTexts.length >= 5) {
      const old = this._logTexts.shift();
      s.tweens.add({ targets:old, alpha:0, duration:300, onComplete: () => old.destroy() });
    }
    const txt = s.add.text(W-265, 170+this._logTexts.length*26, msg, {
      fontFamily:'sans-serif', fontSize:'11px', fill: colors[type]||colors.info,
      stroke:'#000', strokeThickness:1, wordWrap:{ width:245 },
      backgroundColor:'rgba(0,0,0,0.55)', padding:{ x:6, y:3 },
    }).setAlpha(0).setDepth(11);
    s.tweens.add({ targets:txt, alpha:1, duration:300 });
    s.tweens.add({ targets:txt, alpha:0, delay:5000, duration:800, onComplete: () => {
      txt.destroy(); this._logTexts = this._logTexts.filter(t => t !== txt);
    }});
    this._logTexts.push(txt);
  }

  _buildMutationButton() {
    const s = this.scene;
    const bg = s.add.rectangle(16,110,170,28,0x1a2a1a,0.88).setOrigin(0,0).setInteractive({ cursor:'pointer' }).setDepth(11).setStrokeStyle(1,0x3a6a2a);
    const label = s.add.text(101,124,'🧶 Mutationen  ▼',{ fontFamily:'sans-serif', fontSize:'12px', fill:'#88d060' }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x2a3a2a,0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a2a1a,0.88));
    bg.on('pointerdown', () => this.panelOpen ? this._closePanel(label) : this._openPanel(label));
    this._mutBtn = { bg, label };
  }

  _buildForestButton() {
    const s = this.scene;
    const bg = s.add.rectangle(16,146,170,26,0x1a1a0a,0.88).setOrigin(0,0).setInteractive({ cursor:'pointer' }).setDepth(11).setStrokeStyle(1,0x5a6a1a);
    s.add.text(101,159,'🌲 Wald & Wurzeln',{ fontFamily:'sans-serif', fontSize:'12px', fill:'#c0d860' }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x2a2a12,0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a1a0a,0.88));
    bg.on('pointerdown', () => this.forestPanelOpen ? this._closeForestPanel() : this._openForestPanel());
  }

  _buildCodexButton() {
    const s = this.scene;
    const bg = s.add.rectangle(16,180,170,26,0x0d1a2a,0.88).setOrigin(0,0).setInteractive({ cursor:'pointer' }).setDepth(11).setStrokeStyle(1,0x2a4a6a);
    s.add.text(101,193,'📖 Codex',{ fontFamily:'sans-serif', fontSize:'12px', fill:'#80c0f0' }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x152035,0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x0d1a2a,0.88));
    bg.on('pointerdown', () => this.codexOpen ? this._closeCodex() : this._openCodex());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations-Panel (kein Container, kein Scroll-Zone)
  // ─────────────────────────────────────────────────────────────────────────
  _openPanel(label)  { this.panelOpen = true;  label.setText('🧶 Mutationen  ▲'); this._mutScrollY=0; this._renderPanel(); }
  _closePanel(label) { this.panelOpen = false; label.setText('🧶 Mutationen  ▼'); this._clearPanel(); }
  _clearPanel() {
    for (const el of this._panelElements) { try { el.destroy(); } catch(e){} }
    this._panelElements = [];
  }

  _renderPanel() {
    this._clearPanel();
    const s = this.scene, H = s.scale.height;
    const available = this.mutations.getAvailable(this.tree.phaseIndex);
    const slots  = TREE_PHASES[this.tree.phaseIndex]?.upgradeSlots ?? 1;
    const active = this.mutations.getAll().filter(m => m.active).length;
    const PX = 16, PY = 210, PW = 330, ROWH = 84;
    const visH = H - PY - 20;
    const contentH = 28 + available.length * ROWH + 8;
    const scrollY = this._mutScrollY;
    const push = (el) => { this._panelElements.push(el); return el; };

    // Hintergrund
    const panBg = push(s.add.rectangle(PX, PY, PW, visH, 0x080e08, 0.97).setOrigin(0,0).setDepth(20).setStrokeStyle(1,0x3a6a2a,0.8));
    panBg.setInteractive();
    panBg.on('wheel', (_p, _dx, dy) => {
      this._mutScrollY = Math.max(0, Math.min(contentH - visH, this._mutScrollY + dy * 0.4));
      this._renderPanel();
    });

    // Scrollbar
    if (contentH > visH) {
      push(s.add.rectangle(PX+PW-8, PY+2, 6, visH-4, 0x1a2a1a, 0.8).setOrigin(0,0).setDepth(21));
      const ratio = visH / contentH;
      const thumbH = Math.max(20, visH * ratio);
      const thumbY = PY+2 + (scrollY / Math.max(1, contentH-visH)) * (visH-thumbH-4);
      push(s.add.rectangle(PX+PW-8, thumbY, 6, thumbH, 0x5a9a4a, 0.9).setOrigin(0,0).setDepth(21));
    }

    const clip = (el, elY, elH = 20) => {
      const top = PY, bot = PY + visH;
      el.setVisible(elY + elH > top && elY < bot);
      return el;
    };

    const headerY = PY + 8 - scrollY;
    clip(push(s.add.text(PX+12, headerY, 'Aktive Mutationen: '+active+' / '+slots+' Slots', {
      fontFamily:'sans-serif', fontSize:'11px', fill: active>=slots ? '#ff8060' : '#70a050',
    }).setDepth(21)), headerY);

    available.forEach((m, i) => {
      const ry = PY + 28 + i*ROWH - scrollY;
      const rowH = ROWH-6;
      if (ry + rowH < PY || ry > PY+visH) return; // ganz ausserhalb

      push(s.add.rectangle(PX+6, ry, PW-12, rowH,
        m.level>0?(m.level===3?0x1a3a0a:0x142a0e):0x0e110a, 0.92
      ).setOrigin(0,0).setDepth(21).setStrokeStyle(1,
        m.level===3?0x80ff40:m.level>0?0x50c030:m.type==='symbiosis'?0xc0a030:0x2a3a1a, 0.7
      ));

      const nc = m.level===3?'#a0ff60':m.level>0?'#70d040':m.unlocked?'#b0d080':'#505040';
      const nameTxt = push(s.add.text(PX+14, ry+6, m.emoji+' '+m.name, {
        fontFamily:'"Cormorant Garamond",Georgia,serif', fontSize:'13px', fill:nc,
      }).setDepth(22));
      for (let lvl=0; lvl<m.upgrades.length; lvl++)
        push(s.add.circle(PX+14+nameTxt.width+12+lvl*12, ry+12, 4, lvl<m.level?0x70ff40:0x303020, lvl<m.level?1:0.5).setDepth(22));

      push(s.add.text(PX+PW-70, ry+8, '['+m.type+']', {
        fontFamily:'sans-serif', fontSize:'10px',
        fill:{passive:'#a0c880',active:'#80c0f0',symbiosis:'#f0c040',crisis:'#f06040'}[m.type]||'#888',
      }).setDepth(22));

      const sd = m.upgrades[Math.min(m.level, m.upgrades.length-1)];
      push(s.add.text(PX+14, ry+26, sd.description, {
        fontFamily:'sans-serif', fontSize:'10px', fill:'#909880', wordWrap:{width:PW-40},
      }).setDepth(22));

      const EM = {light:'☀️',water:'💧',nutrients:'🌱'};
      let stxt, scol;
      if (m.level===m.upgrades.length)          { stxt='★★★ Maximum'; scol='#a0ff60'; }
      else if (m.active) {
        const cs=Object.entries(m.upgrades[m.level].cost).filter(([,v])=>v>0).map(([k,v])=>(EM[k]||k)+v).join('  ');
        stxt='▲ Stufe '+(m.level+1)+': '+(cs||'Kostenlos'); scol='#c0d060';
      } else if (m.type==='crisis'&&!m.unlocked) { stxt='🔒 Krise: '+m.requiredCrisis; scol='#806050'; }
      else {
        const cs=Object.entries(m.upgrades[0].cost).filter(([,v])=>v>0).map(([k,v])=>(EM[k]||k)+v).join('  ');
        stxt='Aktivieren: '+(cs||'Kostenlos'); scol='#a0c860';
      }
      push(s.add.text(PX+14, ry+56, stxt, { fontFamily:'sans-serif', fontSize:'10px', fill:scol }).setDepth(22));

      const slotFull = active>=slots && !m.active;
      if (m.level<m.upgrades.length && (m.type!=='crisis'||m.unlocked) && !slotFull) {
        const bl = m.level===0?'Aktivieren':'Upgrade '+(m.level+1);
        const bb = push(s.add.rectangle(PX+PW-80, ry+34, 72, 22, 0x1a3a1a, 0.92)
          .setOrigin(0,0).setDepth(22).setInteractive({cursor:'pointer'}).setStrokeStyle(1,0x4a8a3a));
        push(s.add.text(PX+PW-44, ry+45, bl, { fontFamily:'sans-serif', fontSize:'9px', fill:'#80d060' }).setOrigin(0.5).setDepth(23));
        bb.on('pointerover',()=>bb.setFillStyle(0x2a5a2a,0.95));
        bb.on('pointerout', ()=>bb.setFillStyle(0x1a3a1a,0.92));
        bb.on('pointerdown',()=>{
          const r=this.mutations.activate(m.id,this.resources);
          if(r.ok){
            this.scene.tree.draw(this.scene.seasons.current.id,this.mutations.getVisuals());
            this._renderPanel();
            this.addEventLog('🧶 '+m.emoji+' '+m.name+(r.level===3?' (MAX!)':' (Stufe '+r.level+')'),'growth');
          } else { this._showFeedback(r.reason,'#ff8060'); this.addEventLog('❌ '+r.reason,'crisis'); }
        });
      } else if (slotFull&&m.level===0) {
        push(s.add.text(PX+PW-74, ry+44, '🔒 Slot voll', { fontFamily:'sans-serif', fontSize:'9px', fill:'#806040' }).setDepth(22));
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forest-Panel
  // ─────────────────────────────────────────────────────────────────────────
  _openForestPanel()  { this.forestPanelOpen=true;  this._forScrollY=0; this._renderForestPanel(); }
  _closeForestPanel() {
    this.forestPanelOpen=false;
    for (const el of this._forestElements) { try { el.destroy(); } catch(e){} }
    this._forestElements=[];
  }

  _renderForestPanel() {
    this._closeForestPanel();
    this.forestPanelOpen=true;
    const s=this.scene, H=s.scale.height, phaseIdx=this.tree.phaseIndex;
    const availTrees  = this.forest.getAvailableTypes(phaseIdx);
    const availDepths = this.forest.getAvailableDepths(phaseIdx);
    const slots = this.forest.getSlots(phaseIdx);
    const PX=16, PY=210, PW=340;
    const visH = H-PY-20;
    const contentH = 46+availTrees.length*62+30+availDepths.length*56+20;
    const scrollY = this._forScrollY;
    const push = (el)=>{ this._forestElements.push(el); return el; };
    const EM = {light:'☀️',water:'💧',nutrients:'🌱'};

    const panBg = push(s.add.rectangle(PX,PY,PW,visH,0x080a04,0.97).setOrigin(0,0).setDepth(20).setStrokeStyle(1,0x4a6a1a,0.8));
    panBg.setInteractive();
    panBg.on('wheel',(_p,_dx,dy)=>{
      this._forScrollY=Math.max(0,Math.min(contentH-visH,this._forScrollY+dy*0.4));
      this._renderForestPanel();
    });
    if (contentH>visH) {
      push(s.add.rectangle(PX+PW-8,PY+2,6,visH-4,0x1a2010,0.8).setOrigin(0,0).setDepth(21));
      const r2=visH/contentH, th=Math.max(20,visH*r2);
      push(s.add.rectangle(PX+PW-8,PY+2+(scrollY/Math.max(1,contentH-visH))*(visH-th-4),6,th,0x7a9a3a,0.9).setOrigin(0,0).setDepth(21));
    }

    const yo=(base)=>base-scrollY;

    push(s.add.text(PX+12,yo(PY+10),'🌲 Wald  –  Bäume: '+this.forest.trees.length+' / '+slots+' Plätze',{
      fontFamily:'"Cormorant Garamond",Georgia,serif', fontSize:'14px', fill:'#c0d870',
    }).setDepth(21).setVisible(yo(PY+10)>=PY&&yo(PY+10)<PY+visH));
    if(this.forest.trees.length>0)
      push(s.add.text(PX+12,yo(PY+28),this.forest.trees.map(t=>t.type.emoji+' '+t.type.name+(t.level>1?' ★':'')).join('  '),{
        fontFamily:'sans-serif',fontSize:'10px',fill:'#809060',
      }).setDepth(21).setVisible(yo(PY+28)>=PY&&yo(PY+28)<PY+visH));

    availTrees.forEach((type,i)=>{
      const ry=yo(PY+46+i*62);
      if(ry+56<PY||ry>PY+visH) return;
      const canAfford=Object.entries(type.cost).every(([k,v])=>this.resources.get(k)>=v);
      const alreadyPlanted=this.forest.trees.filter(t=>t.id===type.id).length;
      push(s.add.rectangle(PX+6,ry,PW-12,56,canAfford?0x141e06:0x0c100a,0.9).setOrigin(0,0).setDepth(21).setStrokeStyle(1,canAfford?0x507030:0x283018,0.7));
      push(s.add.text(PX+14,ry+5,type.emoji+' '+type.name,{fontFamily:'"Cormorant Garamond",Georgia,serif',fontSize:'13px',fill:canAfford?'#b0d870':'#708050'}).setDepth(22));
      push(s.add.text(PX+14,ry+22,type.description||type.lore||'',{fontFamily:'sans-serif',fontSize:'9px',fill:'#707860',wordWrap:{width:PW-120}}).setDepth(22));
      push(s.add.text(PX+14,ry+36,Object.entries(type.cost).map(([k,v])=>(EM[k]||k)+v).join('  '),{fontFamily:'sans-serif',fontSize:'9px',fill:'#a09050'}).setDepth(22));
      push(s.add.text(PX+PW-90,ry+5,'x'+alreadyPlanted+' gepflanzt',{fontFamily:'sans-serif',fontSize:'9px',fill:'#607040'}).setDepth(22));
      if(this.forest.trees.length<slots&&canAfford){
        const bb=push(s.add.rectangle(PX+PW-80,ry+20,68,22,0x1e3a0a,0.92).setOrigin(0,0).setDepth(22).setInteractive({cursor:'pointer'}).setStrokeStyle(1,0x4a8a20));
        push(s.add.text(PX+PW-46,ry+31,'Pflanzen',{fontFamily:'sans-serif',fontSize:'10px',fill:'#90d040'}).setOrigin(0.5).setDepth(23));
        bb.on('pointerover',()=>bb.setFillStyle(0x2a5010,0.95));
        bb.on('pointerout', ()=>bb.setFillStyle(0x1e3a0a,0.92));
        bb.on('pointerdown',()=>{
          const r=this.forest.plant(type.id,phaseIdx,this.resources);
          if(r.ok){this._renderForestPanel();this.addEventLog('🌲 '+type.emoji+' '+type.name+' gepflanzt!','growth');}
          else{this._showFeedback(r.reason,'#ff8060');}
        });
      }
    });

    const depBase=PY+46+availTrees.length*62+16;
    if(yo(depBase)>=PY&&yo(depBase)<PY+visH)
      push(s.add.text(PX+12,yo(depBase),'🗓️ Wurzeltiefe',{fontFamily:'"Cormorant Garamond",Georgia,serif',fontSize:'13px',fill:'#a08860'}).setDepth(21));
    const DE={water:'💧',nutrients:'🌱',allRatesBonus:'⚡',symbiosis:'🪼'};
    availDepths.forEach((depth,i)=>{
      const ry=yo(depBase+20+i*56);
      if(ry+50<PY||ry>PY+visH) return;
      const unlocked=this.forest.isUnlocked(depth.id);
      const canAfford=depth.unlockCost?Object.entries(depth.unlockCost).every(([k,v])=>this.resources.get(k)>=v):true;
      push(s.add.rectangle(PX+6,ry,PW-12,50,unlocked?0x080e14:0x09090a,0.9).setOrigin(0,0).setDepth(21).setStrokeStyle(1,unlocked?0x3060a0:0x202020,0.7));
      push(s.add.text(PX+14,ry+4,depth.emoji+' '+depth.name+(unlocked?' ✓':''),{fontFamily:'"Cormorant Garamond",Georgia,serif',fontSize:'12px',fill:unlocked?'#80c0f0':canAfford?'#8090a0':'#505060'}).setDepth(22));
      push(s.add.text(PX+14,ry+20,depth.description,{fontFamily:'sans-serif',fontSize:'9px',fill:'#607070',wordWrap:{width:PW-120}}).setDepth(22));
      if(!unlocked&&depth.unlockCost) push(s.add.text(PX+14,ry+36,Object.entries(depth.unlockCost).map(([k,v])=>(EM[k]||k)+v).join('  '),{fontFamily:'sans-serif',fontSize:'9px',fill:'#706040'}).setDepth(22));
      if(!unlocked&&(depth.unlockCost?canAfford:true)){
        const bb=push(s.add.rectangle(PX+PW-80,ry+14,68,22,0x081428,0.92).setOrigin(0,0).setDepth(22).setInteractive({cursor:'pointer'}).setStrokeStyle(1,0x2060a0));
        push(s.add.text(PX+PW-46,ry+25,'Erkunden',{fontFamily:'sans-serif',fontSize:'10px',fill:'#60a0d0'}).setOrigin(0.5).setDepth(23));
        bb.on('pointerover',()=>bb.setFillStyle(0x102040,0.95));
        bb.on('pointerout', ()=>bb.setFillStyle(0x081428,0.92));
        bb.on('pointerdown',()=>{
          const r=this.forest.unlockDepth(depth.id,phaseIdx,this.resources);
          if(r.ok){this._renderForestPanel();this.addEventLog(depth.emoji+' Tiefenschicht: '+depth.name+' – '+depth.lore,'discovery');}
          else{this._showFeedback(r.reason,'#ff8060');}
        });
      } else if(unlocked){
        const bStr=Object.entries(depth.passiveBonus).filter(([,v])=>typeof v==='number'&&v>0).map(([k,v])=>(DE[k]||k)+' +'+(v*100).toFixed(0)+'%').join('  ');
        if(bStr) push(s.add.text(PX+14,ry+36,bStr,{fontFamily:'sans-serif',fontSize:'9px',fill:'#6090a0'}).setDepth(22));
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Codex
  // ─────────────────────────────────────────────────────────────────────────
  _openCodex()  { this.codexOpen=true;  this._codScrollY=0; this._renderCodex(); }
  _closeCodex() {
    this.codexOpen=false;
    for (const el of this._codexElements) { try { el.destroy(); } catch(e){} }
    this._codexElements=[];
  }

  _renderCodex() {
    this._closeCodex();
    this.codexOpen=true;
    const s=this.scene, W=s.scale.width, H=s.scale.height;
    const byCat=this.codex.getByCategory(), cats=Object.keys(byCat);
    const PX=W/2-200, PY=80, PW=400;
    const visH=H-PY-20;
    const contentH=50+cats.length*24+cats.reduce((a,c)=>a+Math.ceil(byCat[c].length/2)*44,0)+20;
    const scrollY=this._codScrollY;
    const push=(el)=>{ this._codexElements.push(el); return el; };

    // Hintergrund
    const panBg=push(s.add.rectangle(PX,PY,PW,visH,0x060e06,0.97).setOrigin(0,0).setDepth(30).setStrokeStyle(1,0x2a5a3a));
    panBg.setInteractive();
    panBg.on('wheel',(_p,_dx,dy)=>{
      this._codScrollY=Math.max(0,Math.min(contentH-visH,this._codScrollY+dy*0.4));
      this._renderCodex();
    });
    if(contentH>visH){
      push(s.add.rectangle(PX+PW-8,PY+2,6,visH-4,0x101810,0.8).setOrigin(0,0).setDepth(31));
      const r2=visH/contentH, th=Math.max(20,visH*r2);
      push(s.add.rectangle(PX+PW-8,PY+2+(scrollY/Math.max(1,contentH-visH))*(visH-th-4),6,th,0x4a8a5a,0.9).setOrigin(0,0).setDepth(31));
    }

    const yo=(base)=>base-scrollY;
    const vis=(y,h=20)=>y+h>PY&&y<PY+visH;

    const titleY=yo(PY+12);
    if(vis(titleY)){
      push(s.add.text(PX+16,titleY,'📖 Ökosystem-Codex',{fontFamily:'"Cormorant Garamond",Georgia,serif',fontSize:'18px',fill:'#a0d8a0'}).setDepth(31));
      push(s.add.text(PX+PW-16,yo(PY+16),this.codex.getUnlocked().length+' / '+this.codex.getAll().length+' entdeckt',{fontFamily:'sans-serif',fontSize:'11px',fill:'#60a070'}).setOrigin(1,0).setDepth(31));
    }
    // X-Button immer sichtbar (oben rechts, fixed)
    const cl=push(s.add.text(PX+PW-12,PY+8,'✕',{fontFamily:'sans-serif',fontSize:'16px',fill:'#c0a080',stroke:'#000',strokeThickness:1}).setOrigin(1,0).setDepth(35).setInteractive({cursor:'pointer'}));
    cl.on('pointerover',()=>cl.setStyle({fill:'#ffffff'}));
    cl.on('pointerout', ()=>cl.setStyle({fill:'#c0a080'}));
    cl.on('pointerdown',()=>this._closeCodex());

    let curY=PY+40;
    for(const cat of cats){
      const catY=yo(curY);
      if(vis(catY)) push(s.add.text(PX+16,catY,cat,{fontFamily:'"Cormorant Garamond",Georgia,serif',fontSize:'13px',fill:'#7a9870'}).setDepth(31));
      curY+=20;
      byCat[cat].forEach((e,ei)=>{
        const ex=PX+16+(ei%2)*(PW/2-16), ey=yo(curY+Math.floor(ei/2)*44);
        if(!vis(ey,38)) return;
        push(s.add.rectangle(ex,ey,PW/2-24,38,e.unlocked?0x1a3020:0x101210,0.9).setOrigin(0,0).setDepth(31).setStrokeStyle(1,e.unlocked?0x3a7050:0x1a2018));
        push(s.add.text(ex+8, ey+5, e.unlocked?e.icon:'❓',{fontFamily:'sans-serif',fontSize:'16px'}).setDepth(32));
        push(s.add.text(ex+32,ey+5, e.unlocked?e.name:'???',{fontFamily:'sans-serif',fontSize:'11px',fill:e.unlocked?'#c0d8b0':'#505040'}).setDepth(32));
        push(s.add.text(ex+32,ey+20,e.cond,{fontFamily:'sans-serif',fontSize:'9px',fill:'#607060',wordWrap:{width:PW/2-60}}).setDepth(32));
      });
      curY+=Math.ceil(byCat[cat].length/2)*44+8;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Update / HUD-Refresh
  // ─────────────────────────────────────────────────────────────────────────
  update() {
    const season=this.seasons.current;
    this.seasonText.setText(season.emoji+'  '+season.name+'  –  '+season.description);
    this.yearText.setText('Jahr '+this.seasons.year);
    const ni=this.tree.phaseIndex+1;
    const nextP=ni<TREE_PHASES.length?TREE_PHASES[ni]:null;

    if(nextP&&!this.tree.isGrowing){
      const cost=nextP.growthCost, symReq=nextP.requiredSymbioses||0, symCur=this.mutations.getActiveSymbioses();
      let allMet=true;
      ['light','water','nutrients'].forEach(key=>{
        const cur=this.resources.get(key),req=cost?.[key]??0,pct=req>0?Math.min(1,cur/req):1;
        if(pct<1)allMet=false;
        this._growthBars[key].width=Math.round(140*pct);
        this._growthBars[key].fillColor=pct>=1?0x80ff40:{light:0xf0d840,water:0x40a0f0,nutrients:0x70c030}[key];
        this._growthTexts[key].setText(req>0?Math.floor(cur)+'/'+req:'✓');
      });
      const symOk=symCur>=symReq; if(!symOk)allMet=false;
      this._growthLabel.setText(allMet&&symOk?'✨ Bereit! Wachstum startet automatisch':symReq>0&&!symOk?'🧶 Symbiosen: '+symCur+'/'+symReq:'');
      this._growthLabel.setStyle({fill:allMet&&symOk?'#a0ff60':'#607850'});
    } else if(this.tree.isGrowing){
      ['light','water','nutrients'].forEach(k=>{this._growthBars[k].width=140;this._growthBars[k].fillColor=0x80ff40;this._growthTexts[k].setText('✓');});
      this._growthLabel.setText('🌱 Wächst...');
    } else {
      ['light','water','nutrients'].forEach(k=>{this._growthBars[k].width=140;this._growthBars[k].fillColor=0xa0ff60;this._growthTexts[k].setText('✓');});
      this._growthLabel.setText('🌳 Urbaum – vollständig');
    }
    this.phaseText.setText('Baum: '+this.tree.phase.name+(ni<TREE_PHASES.length?'  →  '+(this.tree.isGrowing?'wächst...':TREE_PHASES[ni]?.name||''):'  ✓'));
    for(const key of Object.keys(this.resources.getAll())){
      const res=this.resources.getAll()[key];
      if(!this.resTexts[key])continue;
      this.resTexts[key].setText(Math.floor(res.value)+' / '+res.max);
      this.resBars[key].width=Math.round(180*(res.value/res.max));
    }
    this._updateMonthStrip();
    if(nextP&&!this.tree.isGrowing) this.growthHint.setText('↗ Nächste Phase: '+nextP.name);
    else if(this.tree.isGrowing)    this.growthHint.setText('🌱 Wächst...');
    else                            this.growthHint.setText('🌳 Urbaum erreicht');
  }

  updateSeasonBar() {
    const p=this.seasons.getProgress(), W=this.scene.scale.width;
    this.seasonBar.width=Math.round(W*0.6*p);
    this.seasonBar.fillColor={spring:0x80d040,summer:0xf0d020,autumn:0xe06010,winter:0x80a8d0}[this.seasons.current.id];
  }

  showEventBanner(event) {
    if(!event){this.scene.tweens.add({targets:this.eventBanner,alpha:0,duration:600});return;}
    this.eventBanner.setText(event.emoji+'  '+event.name+' – '+event.description).setAlpha(1);
  }

  showClickFeedback(x,y,text,color='#f0d840'){
    const s=this.scene;
    const txt=s.add.text(x,y,text,{fontFamily:'"Cormorant Garamond",Georgia,serif',fontSize:'17px',fill:color,stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(12);
    s.tweens.add({targets:txt,y:y-55,alpha:0,duration:900,ease:'Sine.easeOut',onComplete:()=>txt.destroy()});
  }

  showSeasonTransition(season){
    const s=this.scene,W=s.scale.width,H=s.scale.height;
    const ov=s.add.rectangle(W/2,H/2,W,H,0xffffff,0.15).setDepth(12);
    s.tweens.add({targets:ov,alpha:0,duration:900,ease:'Sine.easeOut',onComplete:()=>ov.destroy()});
    const note=s.add.text(W/2,H*0.38,season.emoji+'  '+season.name,{
      fontFamily:'"Cormorant Garamond",Georgia,serif',fontSize:'30px',fill:'#f0e8d0',stroke:'#000000',strokeThickness:3,alpha:0,
    }).setOrigin(0.5).setDepth(13);
    s.tweens.add({targets:note,alpha:1,y:H*0.34,duration:600,ease:'Back.easeOut',yoyo:true,hold:1300,onComplete:()=>note.destroy()});
  }

  _showFeedback(msg,color='#f0d040'){
    const s=this.scene,W=s.scale.width;
    const txt=s.add.text(W*0.28,400,msg,{fontFamily:'sans-serif',fontSize:'14px',fill:color,stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(30);
    s.tweens.add({targets:txt,y:355,alpha:0,duration:1500,ease:'Sine.easeOut',onComplete:()=>txt.destroy()});
  }
}
