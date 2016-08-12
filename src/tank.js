
const $ = require('jquery');

const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const THREE = require('three');

class Tank extends events.Events {

  constructor(game) {
    super();

    this.game = game;

    this.renderer = null;

    this.position = [0, 0];
    this.heading = 0;
  }

  remove() {
    this.renderer.remove();
  }

  addRenderer(scene) {
    if(this.renderer) return;
    this.renderer = new TankRenderer(scene, this);
  }
  
  tick(elapsed) {
    var angle = this.game.time;
    var size = 20;
    var point_at = [Math.sin(angle) * size, Math.cos(angle) * size];
    
    this.heading = Math.atan2(this.position[0] - point_at[0], this.position[1] - point_at[1]);
  }

}

class TankRenderer extends events.Events {

  constructor(scene, tank) {
    super();

    this.scene = scene;
    this.tank = tank;

    this.init();
  }

  init() {
    this.lod = new THREE.LOD();

    this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.0'), this.scene.getMaterial('tank')), 8);
    this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.1'), this.scene.getMaterial('tank')), 20);
    this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.2'), this.scene.getMaterial('tank')), 60);

    var shadow_geometry = new THREE.PlaneGeometry(20, 20, 1);

    this.shadow = new THREE.Mesh(shadow_geometry, this.scene.getMaterial('tank_shadow'));
    this.shadow.rotation.x = Math.PI * 1.5;

    this.lod.add(this.shadow);
    
    this.scene.scene.add(this.lod);
  }

  remove() {
    this.lod.remove(this.shadow);
    this.scene.scene.remove(this.lod);
  }

  update() {
    this.lod.update(this.scene.camera);
    
    this.lod.position.x = this.tank.position[0];
    this.lod.position.z = this.tank.position[1];
    this.lod.rotation.y = this.tank.heading;
  }

}

exports.Tank = Tank;
exports.TankRenderer = TankRenderer;


