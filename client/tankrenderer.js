
const util = require('../common/util.js');
const events = require('../common/events.js');

const THREE = require('three');

const animation = require('./animation.js');

class TankRenderer extends events.Events {

  constructor(scene, tank) {
    super();

    this.app = scene.app;
    this.scene = scene;
    this.tank = tank;

    this.v1 = new THREE.Vector3();
    this.v2 = new THREE.Vector3();

    this.zoom_animation = new animation.Animation({
      duration: 0.1
    });

    this.tank.on('team-change', util.withScope(this, this.updateTeam));
    this.tank.on('destroy', util.withScope(this, this.destroy));

    this.init();
  }

  updateTeam() {
    var team = this.tank.team;
    
    var material = 'tank_team_' + team.team;

    for(var i=0; i<this.lod.levels.length; i++) {
      this.lod.levels[i].object.material = this.scene.getMaterial(material);
    }
  }

  init() {
    this.object = new THREE.Object3D();
    
    this.lod = new THREE.LOD();

    var material = 'tank_team_neutral';

    this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.0'), this.scene.getMaterial(material)), 0);
    this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.1'), this.scene.getMaterial(material)), 20);
    this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.2'), this.scene.getMaterial(material)), 130);
    //this.lod.addLevel(new THREE.Mesh(this.scene.getModel('tank.3'), this.scene.getMaterial(material)), 400);

    this.initTreads();

    this.scene.scene.add(this.object);
    this.object.add(this.lod);

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
    
    this.shadow.renderOrder = 300;

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

  destroy() {
    //this.lod.remove(this.shadow);
    this.scene.scene.remove(this.lod);
  }

  updateZoom() {
    if(this.zoom_animation.end_value != this.tank.zoom)
      this.zoom_animation.setValue(this.tank.zoom, this.tank.game.time);
    
    this.camera.fov = util.clerp(0, this.zoom_animation.get(this.tank.game.time), 1, 60, 20);
    //this.camera.fov += util.clerp(-1, (this.tank.speed / this.tank.maximum.speed), 1, -5, 5);
  }

  updateLOD() {
    this.lod.update(this.scene.camera);

    this.v1.setFromMatrixPosition(this.scene.camera.matrixWorld);
    this.v2.setFromMatrixPosition(this.lod.matrixWorld);

    var distance = this.v1.distanceTo(this.v2);

    if(distance > this.scene.options.shadowFadeEnd) {
      this.shadow.visible = false;
    } else {
      this.shadow.visible = true;

      var fade = util.clerp(this.scene.options.shadowFadeStart, distance, this.scene.options.shadowFadeEnd, 1.73205, 0);
      
      this.shadow.scale.setLength(fade);
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
    var treadWidth = 2;
    var uvWidth = 0.8;

    this.treads.left.speed = ((this.tank.speed + (this.tank.angularVelocity) * treadWidth) / uvWidth);
    this.treads.right.speed = ((this.tank.speed - (this.tank.angularVelocity) * treadWidth) / uvWidth);
    
    this.updateTreadSpeed(this.treads.left);
    this.updateTreadSpeed(this.treads.right);

    this.treads.left.offset  -= this.treads.left.speed * elapsed;
    this.treads.right.offset -= this.treads.right.speed * elapsed;
  }

  update(elapsed) {
    if(this.tank == this.app.tank.view) {
      this.lod.visible = false;
    } else {
      this.lod.visible = true;
    }

    this.updateZoom();
    this.updateLOD();
    this.updateTreads(elapsed);
    
    this.object.position.x = this.tank.position[0];
    this.object.position.z = this.tank.position[1];
    this.object.rotation.y = this.tank.heading;
  }

}

exports.TankRenderer = TankRenderer;
