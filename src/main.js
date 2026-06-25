import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#0d1b0f',
  scene: [GameScene],
  render: {
    antialias: true,
    pixelArt: false,
  },
};

new Phaser.Game(config);
