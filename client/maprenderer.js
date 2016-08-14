
const util = require('../common/util.js');
const events = require('../common/events.js');

const THREE = require('three');

const animation = require('./animation.js');

class MapRenderer extends events.Events {

  constructor(scene, map) {
    super();

    this.app = scene.app;
    this.scene = scene;
    this.map = map;

    this.map.on('destroy', util.withScope(this, this.destroy));
    
    this.initObject();
  }

  initObject() {
    console.log('x');
    this.object = new THREE.Object3D();
    this.scene.scene.add(this.object);

    this.initGround();
  }

  initGround() {
    
    this.ground = {};

    this.ground.size = 6000;
    this.ground.repeat = 300;

    this.ground.material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: this.scene.getTexture('ground-grid').clone(),
      transparent: true,
      depthWrite: false,
    });

    this.ground.grid = this.ground.material.map;
    this.ground.grid.wrapS = THREE.RepeatWrapping;
    this.ground.grid.wrapT = THREE.RepeatWrapping;
    this.ground.grid.repeat.set(this.ground.repeat, this.ground.repeat);
    this.ground.grid.anisotropy = 8;
    
    this.ground.grid.needsUpdate = true;
    
    this.ground.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.ground.size, this.ground.size, 100), this.ground.material);

    this.ground.mesh.rotation.x = Math.PI * 0.5;
    this.ground.mesh.rotation.y = Math.PI;
    this.ground.mesh.position.y = -0.1;
    
    this.ground.mesh.renderOrder = 100;
    this.object.add(this.ground.mesh);
  }

  destroy() {
    this.scene.scene.remove(this.object);
  }

  updatePosition() {
    return;
    var cameraPosition = this.scene.getCameraPosition();

    var scale = (1 / this.ground.size) * this.ground.repeat;
    
    this.ground.grid.offset.set(-cameraPosition.x * scale, cameraPosition.z * scale);
    this.ground.grid.needsUpdate = true;
    
    this.ground.mesh.position.x = cameraPosition.x;
    this.ground.mesh.position.z = cameraPosition.z;
  }
  
  update() {
    this.updatePosition();
  }

}

exports.MapRenderer = MapRenderer;
