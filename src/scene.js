
const $ = require('jquery');

const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const THREE = require('three');
const EffectComposer = require('three-effectcomposer')(THREE);
const fxaa = require('three-shader-fxaa');

const tank = require('./tank.js');
const model = require('./model.js');

class Scene extends events.Events {

  constructor(app) {
    super();

    this.app = app;
    this.loader = app.loader;

    this.size = {
      width: 1,
      height: 1,
      aspect: 1
    };
  }

  loaded() {
    this.scene = new THREE.Scene();

    this.initCamera();
    this.initRenderer();
    this.initTank();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    window.THREE = THREE;

    this.renderer.setClearColor(0xcacaca, 1.0);

    this.composer = new EffectComposer(this.renderer);
    
    this.composer.addPass(new EffectComposer.RenderPass(this.scene, this.camera));

    this.passes = {};

    this.passes.fxaa = new EffectComposer.ShaderPass(fxaa());
    this.passes.fxaa.renderToScreen = true;
    this.composer.addPass(this.passes.fxaa);

    this.resize();
    $(window).resize(util.withScope(this, this.resize));
    
    this.element = this.renderer.domElement;
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10000);

    this.camera.position.set(0, 5, -15);

    this.camera.lookAt(new THREE.Vector3(0, 0.5, 0));

    this.scene.add(this.camera);
  }

  initTank() {
    this.tank = new tank.Tank(this);

    this.scene.add(this.tank.mesh);
  }

  // Model loading, ugh

  loadModels() {
    this.models = {};

    this.loadModel('tank', 'tank/tank');
  }

  loadModel(name, url) {
    url = './models/' + url + '.json';

    var m = new model.Model(this, url);

    this.models[name] = m;
  }

  resize() {
    this.size.width = window.innerWidth;
    this.size.height = window.innerHeight;

    this.passes.fxaa.uniforms.resolution.value.set(this.size.width, this.size.height);
    this.renderer.setSize(this.size.width, this.size.height);

    this.size.aspect = this.size.width / this.size.height;
  }

  updateCamera() {
    this.camera.aspect = this.size.aspect;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.updateCamera();
    
    this.tank.update();

    if(false) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
  }

}

exports.Scene = Scene;
