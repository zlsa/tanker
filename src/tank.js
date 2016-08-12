
const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const THREE = require('three');

const tank = require('./models/tank/tank.json');
const tankture = require('./models/tank/texture-post.png');

const shadow = require('./models/tank/shadow.json');
const shadowture = require('./models/tank/shadow.png');

const perlin = require('pf-perlin');

class Tank extends events.Events {

  constructor() {
    super();

    this.init();

    this.perlin = perlin({dimensions: 1});
  }

  init() {
    this.geometry = new THREE.JSONLoader().parse(tank).geometry;

    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    var that = this;

    var loader = new THREE.TextureLoader();
    loader.load(tankture, function(texture) {
      that.material.map = texture;
      that.material.needsUpdate = true;
    });
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  update() {
    this.mesh.rotation.y = util.time();
  }

}

exports.Tank = Tank;


