
const util = require('../common/util.js');
const events = require('../common/events.js');

const THREE = require('three');

const animation = require('./animation.js');

class HUD extends events.Events {

  constructor(app) {
    super();

    this.app = app;
    this.game = this.app.game;

    this.options = {
      scaleFactor: 1,
    };

    this.panels = {};

    this.scene = new THREE.Scene();
    this.windows = new THREE.Object3D();

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);

    this.scene.add(this.windows);

    window.h = this;
  }

  loaded() {
  }

  addPanel(name, panel) {
    this.panels[name] = panel;
  }

  updateCamera() {
    this.camera.aspect = this.app.scene.size.aspect;
    this.camera.updateProjectionMatrix();
  }

  render(elapsed) {
    this.camera.fov = this.app.scene.camera.fov;
    this.updateCamera();
    
    for(var i in this.panels) {
      this.panels[i].update(elapsed);
    }

    this.app.scene.renderer.render(this.scene, this.camera);
  }

}

class TankHUD extends HUD {

  constructor(app) {
    super(app);

    this.tank = null;

    this.addPanel('map', new MapPanel(this));
    this.addPanel('debug', new DebugPanel(this));
  }

  setTank(tank) {
    this.tank = tank;
  }

  update(elapsed) {
    super.update(elapsed);
    
    if(!this.tank) return;
    return;
    
    this.windows.rotation.y = this.tank.angularVelocity * 0.01;
    this.windows.rotation.x = this.tank.speed * 0.001;
  }
  
}

class Panel extends events.Events {

  constructor(hud) {
    super();

    this.hud = hud;

    this.size = [512, 512];

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.position = [0, 0];
    this.distance = 10;

    this.windowsize = {
      width: 1.5,
      height: 1.5,
      aspect: 1,
      extra: 1.1
    };

    this.resize();

    this.createWindow();
    this.createBacking();

    this.setWindowSize(1.5, 1.5);

    this.hud.windows.add(this.window);
  }

  setWindowSize(width, height) {
    this.windowsize.width = width;
    this.windowsize.height = height;

    this.windowsize.aspect = width / height;

    this.texture.repeat.setX(1);
    this.texture.repeat.setY(1);
    
    if(width > height) {
      this.texture.repeat.setY(1/this.windowsize.aspect);
      this.texture.offset.setY(1.0 - 1/this.windowsize.aspect);
    } else {
      this.texture.repeat.setX(this.windowsize.aspect);
      this.texture.offset.setX(1.0 - this.windowsize.aspect);
    }
    
    this.texture.needsUpdate = true;
  }

  setOpacity(opacity) {
    this.window.material.opacity = opacity;
    this.window.material.needsUpdate = true;
  }

  setBackingOpacity(opacity) {
    if(opacity == 0)
      this.backing.visible = false;
    else
      this.backing.visible = true;
    
    this.backing.material.opacity = opacity;
    this.backing.material.needsUpdate = true;
  }

  setBackingExtra(extra) {
    if(extra) 
      this.windowsize.extra = extra;
    
    this.backing.scale.setX(this.windowsize.extra);
    this.backing.scale.setY(this.windowsize.extra);
  }

  createBacking() {
    var plane = new THREE.PlaneGeometry(1, 1, 1);
    
    var material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 0.1
    })

    this.backing = new THREE.Mesh(plane, material);

    this.backing.position.z = -0.02;

    this.window.add(this.backing);
  }

  createWindow() {
    this.texture = new THREE.Texture(this.canvas);

    this.texture.anisotropy = 8;
    //this.texture.magFilter = THREE.NearestFilter;
    //this.texture.minFilter = THREE.LinearMipMapLinearFilter;

    this.texture.needsUpdate = true;

    var plane = new THREE.PlaneGeometry(1, 1, 1);
    
    var material = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 0.9
    })

    this.window = new THREE.Mesh(plane, material);
  }

  resize() {
    this.canvas.width = this.size[0] * this.hud.options.scaleFactor;
    this.canvas.height = this.size[1] * this.hud.options.scaleFactor;
  }

  resizePlane() {
    this.window.scale.setX(this.windowsize.width);
    this.window.scale.setY(this.windowsize.height);

    this.setBackingExtra();

    this.window.position.z = -this.distance;
    this.window.position.x = this.position[0];
    this.window.position.y = this.position[1];
  }

  updateTexture() {
    this.texture.needsUpdate = true;
    //this.window.material.needsUpdate = true;
  }

  draw() {
    this.context.restore();
    this.context.save();

    this.context.scale(this.hud.options.scaleFactor, this.hud.options.scaleFactor);

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.size[0], this.size[1]);
  }

  update() {
    this.resize();
    this.resizePlane();
    this.draw();
    this.updateTexture();
  }

}

class MapPanel extends Panel {
  
  constructor(hud) {
    super(hud);

    this.position = [0, -1];

    this.distance = 3;
    
    this.setBackingOpacity(0);
    this.setWindowSize(2, 2);
    
    this.window.rotation.x = -util.radians(80);
  }

  draw() {
    super.draw();

    //this.context.scale(0.5)

    var heading = 0;
    var position = [0, 0];

    var viewTank;

    if(this.hud.tank) {
      viewTank = this.hud.tank;

      position = viewTank.position;
      heading = viewTank.heading;
    }

    var s = 1.0;

    this.context.save();
    
    this.context.translate(this.size[0]/2, this.size[1]/2);
    
    this.context.rotate(heading);
    this.context.translate(-position[0] * s, -position[1] * s);
    
    var size = 4;

    var tank;

    this.context.globalCompositeOperation = 'lighter';
    
    var width = 2;
    var height = 5;

    var tanks = this.hud.app.game.getTanks();

    for(var i=0; i<tanks.length; i++) {
      tank = tanks[i];

      this.context.fillStyle = tank.team.color;
      
      if(tank == viewTank) {
        this.context.fillStyle = 'white';
        size = 6;
      } else {
        size = 4;
      }

      this.context.translate(tank.position[0] * s, tank.position[1] * s);
      this.context.rotate(-tank.heading);
      
      this.context.fillRect(-size/2, -size/2, size, size);
      this.context.fillRect(-width/2, -height, width, height);
      
      this.context.rotate(tank.heading);
      this.context.translate(-tank.position[0] * s, -tank.position[1] * s);
    }
    

    this.context.restore();
    
    var stroke = this.size[0];
    this.context.strokeStyle = 'black';
    this.context.lineWidth = stroke;
    this.context.arc(this.size[0]/2, this.size[1]/2, this.size[0]/2 + stroke/2, 0, Math.PI * 2);
    this.context.stroke();
    
    this.context.beginPath();
    
    this.context.strokeStyle = '#777';
    this.context.lineWidth = 1;
    this.context.arc(this.size[0]/2, this.size[1]/2, this.size[0]/2 - 0.5, 0, Math.PI * 2);

    this.context.fillStyle = 'rgba(255, 255, 255, 0.05)';
    
    this.context.fill();
    this.context.stroke();

  }

}

class DebugPanel extends Panel {
  
  constructor(hud) {
    super(hud);

    this.position = [0, 1];
    this.distance = 2.5;

    this.setBackingOpacity(0);
    this.setOpacity(0.4);
    this.setWindowSize(2, 0.5);
    
    this.window.rotation.x = util.radians(30);
  }

  draw() {
    super.draw();
    
    this.context.font = 'bold 8px "Press Start 2P"';
    this.context.fillStyle = 'white';
    this.context.fillText(this.hud.app.time.fps.toFixed(1) + ' FPS', 10, 30);
  }

}

exports.HUD = HUD;
exports.TankHUD = TankHUD;
exports.Panel = Panel;
exports.MapPanel = MapPanel;
