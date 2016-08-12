
const $ = require('jquery');

const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const THREE = require('three');
const EffectComposer = require('three-effectcomposer')(THREE);
const fxaa = require('three-shader-fxaa');

const loader = require('./loader.js');

const tank = require('./tank.js');
const model = require('./model.js');

class Scene extends events.Events {

  constructor(app) {
    super();

    this.app = app;
    this.loader = app.loader;

    this.options = {
      scaleFactor: 1,
      fxaa: false,
      shadowStart: 100,
    };

    this.size = {
      width: 1,
      height: 1,
      aspect: 1
    };

    window.s = this;
  }

  setScaleFactor(scaleFactor) {
    this.options.scaleFactor = util.clamp(0.1, scaleFactor, 3);
    
    this.resize();
  }

  setFXAA(fxaa) {
    this.options.fxaa = fxaa;
  }

  ready() {
    this.loadModels();
    this.loadTextures();
  }

  loaded() {
    this.game = this.app.game;
    
    this.scene = new THREE.Scene();

    this.initCamera();
    this.initRenderer();
    
    this.initMaterials();

    this.initSuzanne();
  }

  initSuzanne() {
    var mesh = new THREE.Mesh(this.getModel('suzanne'), this.getMaterial('suzanne'));
    
    mesh.position.y = 15;
    
    this.scene.add(mesh);

    this.suzanne = mesh;
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      // antialias: true,
      alpha: false
    });

    window.THREE = THREE;

    this.renderer.setClearColor(0xcccccc, 1.0);

    this.initPost();

    this.resize();
    $(window).resize(util.withScope(this, this.resize));
    
    this.element = this.renderer.domElement;
  }

  initPost() {
    
    this.composer = new EffectComposer(this.renderer);
    
    this.composer.addPass(new EffectComposer.RenderPass(this.scene, this.camera));

    this.passes = {};

    this.passes.fxaa = new EffectComposer.ShaderPass(fxaa());
    this.passes.fxaa.renderToScreen = true;
    this.composer.addPass(this.passes.fxaa);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000);

    this.camera.position.set(0, 10, -50);

    this.camera.lookAt(new THREE.Vector3(0, 0.5, 0));

    this.scene.add(this.camera);
  }

  initMaterials() {
    this.materials = {};

    this.initTankMaterials();
  }

  initTankMaterials() {
    this.materials.suzanne = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.getTexture('suzanne')
    });

    this.materials.tank = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.getTexture('tank')
    });

    this.materials.tank_shadow = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      alphaMap: this.getTexture('tank_shadow'),
      depthWrite: false,
      alphaTest: 0.01
    });
  }

  getMaterial(name) {
    if(!(name in this.materials)) console.error('no such material "' + name + '"');
    return this.materials[name];
  }
  
  // Model loading, ugh

  loadModels() {
    this.models = {};

    this.loadModel('suzanne', 'suzanne/suzanne');
    
    this.loadModel('tank.0', 'tank/tank.0');
    this.loadModel('tank.1', 'tank/tank.1');
    this.loadModel('tank.2', 'tank/tank.2');
    this.loadModel('tank.3', 'tank/tank.3');
  }

  loadModel(name, url) {
    url = './models/' + url + '.json';

    var m = new model.Model(this, url);

    this.models[name] = m;
  }

  getModel(name) {
    if(!(name in this.models)) console.error('no such model "' + name + '"');
    return this.models[name].geometry;
  }

  // Texture loading, UGHGHGH

  loadTextures() {
    this.textures = {};

    var texture = this.loadTexture('tank', 'models/tank/textures/ao/ao.png');

    texture.on('loaded', util.withScope(texture, function() {
      this.texture.wrapS = THREE.RepeatWrapping;
      this.texture.wrapT = THREE.ClampToEdgeWrapping;
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.anisotropy = 8;
    }));

    texture = this.loadTexture('tank_shadow', 'models/tank/textures/ao/shadow.png');

    texture.on('loaded', util.withScope(texture, function() {
      this.texture.wrapS = THREE.ClampToEdgeWrapping;
      this.texture.wrapT = THREE.ClampToEdgeWrapping;
    }));
    
    texture = this.loadTexture('suzanne', 'models/suzanne/ao.png');
  }

  loadTexture(name, url) {
    url = url;

    var texture = new loader.TextureLoader(url);
    this.textures[name] = texture;

    this.loader.addLoader(texture);

    return texture;
  }

  getTexture(name) {
    if(!(name in this.textures)) console.error('no such texture "' + name + '"');
    return this.textures[name].texture;
  }

  resize() {
    this.size.width = window.innerWidth;
    this.size.height = window.innerHeight;

    this.initPost();
    this.passes.fxaa.uniforms.resolution.value.set(this.size.width, this.size.height);
    
    this.renderer.setSize(this.size.width * this.options.scaleFactor, this.size.height * this.options.scaleFactor);

    this.size.aspect = this.size.width / this.size.height;
  }

  updateCamera() {
    this.camera.aspect = this.size.aspect;
    this.camera.updateProjectionMatrix();
  }

  render(elapsed) {
    this.updateCamera();

    var angle = this.game.time;
    var size = 40;
    var point_at = [Math.sin(angle) * size, Math.cos(angle) * size];
    var heading = Math.atan2(point_at[0], point_at[1]);
    
    this.suzanne.position.x = point_at[0];
    this.suzanne.position.z = point_at[1];
    this.suzanne.rotation.y = heading;
    
    for(var i=0; i<this.game.tanks.length; i++) {
      this.game.tanks[i].renderer.update();
    }

    if(this.options.fxaa) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
  }

}

exports.Scene = Scene;
