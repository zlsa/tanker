
const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const THREE = require('three');

class Tank extends events.Events {

  constructor(scene) {
    super();

    this.scene = scene;

    this.init();
  }

  init() {
    console.log(this.scene.models.tank);
    
    this.material = new THREE.MeshBasicMaterial({
      color: 0xff00ff
    });

    this.mesh = new THREE.Mesh(this.scene.models.tank.geometry, this.material);
  }

  update() {
    this.mesh.rotation.y = util.time();
  }

}

exports.Tank = Tank;


