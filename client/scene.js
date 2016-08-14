
const $ = require('jquery');

const util = require('../common/util.js');
const events = require('../common/events.js');

const THREE = require('three');
const EffectComposer = require('three-effectcomposer')(THREE);
const fxaa = require('three-shader-fxaa');

const loader = require('./loader.js');

const tankrenderer = require('./tankrenderer.js');
const maprenderer = require('./maprenderer.js');

const model = require('./model.js');

const team = require('../common/team.js');

class Scene extends events.Events {

  constructor(app) {
    super();

    this.app = app;
    this.loader = app.loader;

    this.options = {
      scaleFactor: 1,
      fxaa: false,
      shadowFadeStart: 100,
      shadowFadeEnd: 200,
    };

    this.size = {
      width: 1,
      height: 1,
      aspect: 1
    };

    this.scalePid = new util.PID(0.1);
    this.scalePid.set_target(60);
    
    this.skyColor = 0xbbbbbb;

    this.scene = new THREE.Scene();

    window.s = this;
  }

  setScaleFactor(scaleFactor) {
    this.options.scaleFactor = util.clamp(0.1, scaleFactor, 3);
    
    this.resize();
  }

  setFXAA(fxaa) {
    this.options.fxaa = fxaa;
  }

  documentReady() {
    this.loadModels();
    this.loadTextures();
  }

  newTank(e) {
    e.tank.addRenderer(this, new tankrenderer.TankRenderer(this, e.tank));
  }

  newMap(e) {
    e.map.addRenderer(this, new maprenderer.MapRenderer(this, e.map));
  }

  loaded() {
    this.game = this.app.game;
    
    this.initCamera();
    this.initRenderer();
    this.initFog();
    this.initLights();
    
    this.initMaterials();

    this.app.game.on('new-tank', util.withScope(this, this.newTank));
    this.app.game.on('new-map', util.withScope(this, this.newMap));
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      //antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });

    this.renderer.autoClear = false;

    window.THREE = THREE;

    this.renderer.setClearColor(this.skyColor, 1.0);

    this.initPost();

    this.resize();
    $(window).resize(util.withScope(this, this.resize));
    
    this.element = this.renderer.domElement;
  }

  initFog() {
    this.fog = new THREE.Fog(this.skyColor, 30, 1000);
    
    this.scene.fog = this.fog;
  }

  initLights() {
    this.sun = new THREE.PointLight(new THREE.Color(team.TEAMS.red.color).getHex(), 1.0);
    this.sun.position.set(0, 5, 0);

    //this.scene.add(this.sun);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
    this.scene.add(this.hemi);
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
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10000);

    this.camera.position.set(0, 10, -50);

    this.camera.lookAt(new THREE.Vector3(0, 0.5, 0));

    this.scene.add(this.camera);
  }

  initMaterials() {
    this.materials = {};

    this.initTankMaterials();
  }

  initTankMaterials() {
    this.materials.suzanne = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: this.getTexture('suzanne')
    });

    var t;
    for(var i in team.TEAMS) {
      t = team.TEAMS[i];
      this.materials['tank_team_' + i] = new THREE.MeshPhongMaterial({
        shininess: 0,
        color: new THREE.Color(t.color).getHex(),
        aoMap: this.getTexture('tank')
      });
    }

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
    
    this.loadModel('treads', 'tank/tread.0');
    
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
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.anisotropy = 8;
    }));

    texture = this.loadTexture('ground-grid', 'textures/ground/grid.png');
    texture = this.loadTexture('ground-alpha', 'textures/ground/alpha.png');
    
    for(var i=0; i<4; i++) {
      texture = this.loadTexture('tread.' + i, 'models/tank/textures/tread/tread.' + i + '.png');

      texture.on('loaded', util.withScope(texture, function() {
        this.texture.wrapS = THREE.RepeatWrapping;
        this.texture.wrapT = THREE.RepeatWrapping;
      }));
    }
    
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

  getCameraPosition() {
    var vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.camera.matrixWorld);
    
    return vector;
  }

  updateCamera() {
    this.camera.aspect = this.size.aspect;
    this.camera.updateProjectionMatrix();
  }

  updateTankRenderers(elapsed) {
    var tanks = this.game.getTanks();

    var renderer;
    
    for(var i=0; i<tanks.length; i++) {
      renderer = this.game.tanks[i].renderer;
      
      if(!renderer) continue;
      renderer.update(elapsed);
    }
    
  }

  updateMapRenderer(elapsed) {
    var r = this.game.map.renderer;
    
    if(r) r.update();
  }

  render(elapsed) {
    if(this.app.time.fps < 45 && this.app.frames > 100)
      this.setScaleFactor(this.options.scaleFactor - 0.01);
    else if(this.app.time.fps > 55)
      this.setScaleFactor(this.options.scaleFactor + 0.01);
         
    this.scene.updateMatrixWorld();
    
    this.updateCamera();
    this.updateTankRenderers(elapsed);
    this.updateMapRenderer(elapsed);

    this.scene.updateMatrixWorld();

    this.renderer.clear();
    
    if(this.options.fxaa) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

  }

}

exports.Scene = Scene;
