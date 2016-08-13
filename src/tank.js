
const $ = require('jquery');

const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const THREE = require('three');

const control = require('./control.js');

const animation = require('./animation.js');

class Tank extends events.Events {

  constructor(game) {
    super();

    this.game = game;

    this.renderer = null;

    this.throttle = 0;
    this.steer = 0;

    this.zoom = 0;

    this.control = new control.AutopilotControl();

    this.maximum = {
      speed: 20,
      steer: 90
    };

    this.velocity = [0, 0];
    this.position = [0, 0];

    this.angularVelocity = 0;
    this.heading = 0;
  }

  remove() {
    this.renderer.remove();
  }

  addRenderer(scene) {
    if(this.renderer) return;
    this.renderer = new TankRenderer(scene, this);
  }

  updatePhysics(elapsed) {
    this.throttle = util.clamp(-1, this.throttle, 1);
    this.steer = util.clamp(-1, this.steer, 1);

    var factor = util.clerp(0, this.zoom, 1, 1, 0.6);

    // update speed

    this.speed = this.throttle * this.maximum.speed * factor;
    
    this.velocity[0] = Math.sin(this.heading) * this.speed;
    this.velocity[1] = Math.cos(this.heading) * this.speed;
         
    this.position[0] += this.velocity[0] * elapsed;
    this.position[1] += this.velocity[1] * elapsed;

    // update heading

    this.angularVelocity = util.radians(this.steer * this.maximum.steer * factor);
    
    this.heading -= this.angularVelocity * elapsed;
  }
  
  tick(elapsed) {
    var angle = this.game.time;
    var size = 40;
    var point_at = [Math.sin(angle) * size, Math.cos(angle) * size];
    
    // this.heading = Math.atan2(this.position[0] - point_at[0], this.position[1] - point_at[1]);

    this.control.tick(elapsed);
    this.control.apply(this);

    this.updatePhysics(elapsed);
  }

}

class TankRenderer extends events.Events {

  constructor(scene, tank) {
    super();

    this.scene = scene;
    this.tank = tank;

    this.v1 = new THREE.Vector3();
    this.v2 = new THREE.Vector3();

    this.zoom_animation = new animation.Animation({
      duration: 0.5
    });

    this.init();
  }

  init() {
    this.lod = new THREE.LOD();

    var material = 'tank_neutral';

    if(Math.random() > 0.5) {
      material = 'tank_alpha';
    } else {
      material = 'tank_beta';
    }

    this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.0'), this.scene.getMaterial(material)), 0);
    //this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.1'), this.scene.getMaterial(material)), 20);
    //this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.2'), this.scene.getMaterial(material)), 90);
    //this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.3'), this.scene.getMaterial(material)), 400);

    this.initTreads();

    this.scene.scene.add(this.lod);

    this.initShadow();
    this.initCamera();
  }

  initTreads() {
    this.treads = {};

    this.treads.left = this.createTread();
    this.treads.right = this.createTread();

    this.treads.right.object.scale.x = -1;
    
    this.lod.add(this.treads.left.object);
    this.lod.add(this.treads.right.object);
  }

  createTread() {
    var speeds = [];

    for(var i=0; i<4; i++) {
      speeds.push(this.scene.getTexture('tread.' + i).clone());
      speeds[i].needsUpdate = true;
    }
    
    var material = new THREE.MeshBasicMaterial({
      color: 0x777777,
      map: speeds[0],
      aoMap: this.scene.getTexture('tank'),
      side: THREE.DoubleSide
    });

    return {
      object: new THREE.Mesh(this.scene.getModel('treads'), material),
      speed: 0,
      offset: 0,
      speeds: speeds
    }
  }

  initShadow() {
    var shadow_geometry = new THREE.PlaneGeometry(20, 20, 1);

    this.shadow = new THREE.Mesh(shadow_geometry, this.scene.getMaterial('tank_shadow'));
    this.shadow.rotation.x = Math.PI * 0.5;
    this.shadow.rotation.y = Math.PI;

    this.lod.add(this.shadow);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10000);

    this.lod.add(this.camera);
    
    if(false) {
      this.camera.position.set(0, 3.03, -0.2);
    } else {
      // this.scene.camera.position.set(0, 2.7, -1.0);
      this.camera.position.set(0, 2.4, 0);
    }
    
    this.camera.rotation.set(0, 0, 0);
  }

  remove() {
    this.lod.remove(this.shadow);
    this.scene.scene.remove(this.lod);
  }

  updateZoom() {
    if(this.zoom_animation.end_value != this.tank.zoom)
      this.zoom_animation.setValue(this.tank.zoom, this.tank.game.time);
    
    this.camera.fov = util.clerp(0, this.zoom_animation.get(this.tank.game.time), 1, 60, 20);
  }

  updateLOD() {
    this.lod.update(this.scene.camera);

    this.v1.setFromMatrixPosition(this.scene.camera.matrixWorld);
    this.v2.setFromMatrixPosition(this.lod.matrixWorld);

    var distance = this.v1.distanceTo(this.v2);

    if(distance > this.scene.options.shadowStart) {
      this.shadow.visible = false;
    } else {
      this.shadow.visible = true;
    }
    
  }

  updateTreadSpeed(tread) {

    var map = tread.object.material.map;

    if(Math.abs(tread.speed) > 14) {
      map = tread.speeds[3];
    } else if(Math.abs(tread.speed) > 8) {
      map = tread.speeds[2];
    } else if(Math.abs(tread.speed) > 5) {
      map = tread.speeds[1];
    } else {
      map = tread.speeds[0];
    }

    if(tread.object.material.map != map) {
      tread.object.material.map = map;
      tread.object.material.needsUpdate = true;
    }

    tread.object.material.map.offset.set(tread.offset, 0);
  }

  updateTreads(elapsed) {
    var treadWidth = 4;
    var uvWidth = 0.8;

    this.treads.left.speed = ((this.tank.speed - (this.tank.angularVelocity * 7) / treadWidth) / uvWidth);
    this.treads.right.speed = ((this.tank.speed + (this.tank.angularVelocity * 7) / treadWidth) / uvWidth);
    
    this.updateTreadSpeed(this.treads.left);
    this.updateTreadSpeed(this.treads.right);

    this.treads.left.offset  += this.treads.left.speed * elapsed;
    this.treads.right.offset += this.treads.right.speed * elapsed;
  }

  update(elapsed) {
    if(this.tank == this.tank.game.tank.view) {
      this.lod.visible = false;
    } else {
      this.lod.visible = true;
    }

    this.updateZoom();
    this.updateLOD();
    this.updateTreads(elapsed);
    
    this.lod.position.x = this.tank.position[0];
    this.lod.position.z = this.tank.position[1];
    this.lod.rotation.y = this.tank.heading;
  }

}

exports.Tank = Tank;
exports.TankRenderer = TankRenderer;


