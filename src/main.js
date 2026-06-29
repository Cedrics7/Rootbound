import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth  > 1280 ? 1280 : window.innerWidth,
  height: window.innerHeight > 800  ? 800  : window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#0d1b0f',
  scene: [BootScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

new Phaser.Game(config);
