# GameScene Skill-Integration

Folgende Änderungen müssen in GameScene.js vorgenommen werden:

## 1. Import
```js
import { SkillSystem }   from '../systems/SkillSystem.js';
import { SkillTreeUI }   from '../systems/SkillTreeUI.js';
```

## 2. In create(), nach `this.seasonChoice = ...`
```js
this.skillSys = new SkillSystem();
```

## 3. Im Tick-Loop, bonuses-Objekt erweitern
```js
const skillBon = this.skillSys.getBonuses();
bonuses.lightRateBonus     += skillBon.lightRateBonus;
bonuses.waterRateBonus     += skillBon.waterRateBonus;
bonuses.nutrientsRateBonus += skillBon.nutrientsRateBonus;
bonuses.allRatesBonus      += skillBon.allRatesBonus;
bonuses.waterDrainReduction+= skillBon.waterDrainReduction;
bonuses.eventDamageReduction += skillBon.eventDamageReduction;
// Symbiose-Passiv
if (skillBon.symbiosisPassive > 0)
  this.resources.add({ symbiosis: skillBon.symbiosisPassive });
// Wald-Bonus-Multiplikator
if (skillBon.forestBonusMultiplier > 0) {
  bonuses.allRatesBonus += this.forest.getForestBonus().allRatesBonus * skillBon.forestBonusMultiplier;
}
```

## 4. In _buildTreeUI(), nach `this.ui = new UISystem(...)`
```js
this.skillTreeUI = new SkillTreeUI(this, this.skillSys, this.resources, this.creature);
this.ui.addSkillButton(() => this.skillTreeUI.toggle());
```

## 5. In SaveSystem.save() data-Objekt
```js
skills: this.skillSys ? this.skillSys.serialize() : null,
```

## 6. In SaveSystem.restore()
```js
if (data.skills && skillSys) skillSys.restore(data.skills);
```
