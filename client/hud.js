
const util = require('../common/util.js');
const events = require('../common/events.js');

const THREE = require('three');

const animation = require('./animation.js');

class HUD extends events.Events {

  constructor(app) {
    super();

    this.app = app;
    this.game = app.game;

    this.options = {
      scaleFactor: 1,
    };

    this.panels = {};

    this.windows = new THREE.Object3D();

    this.windows.position.y = 2.5;

    window.h = this;
  }

  loaded() {
    //this.app.scene.scene.add(this.windows);
  }

  addPanel(name, panel) {
    this.panels[name] = panel;
  }

  update(elapsed) {
    
    for(var i in this.panels) {
      this.panels[i].update(elapsed);
    }
    
  }

}

class TankHUD extends HUD {

  constructor(app) {
    super(app);

    this.tank = null;

    //this.addPanel('menu', new MenuPanel(this));
    this.addPanel('map', new MapPanel(this));
  }

  setTank(tank) {
    tank.renderer.object.add(this.windows);

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
    this.scale = 1.5;

    this.resize();
    
    this.createWindow();

    this.hud.windows.add(this.window);
  }

  createWindow() {
    this.texture = new THREE.Texture(this.canvas);

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
    this.window.scale.setLength(this.distance * this.scale);
    this.window.position.z = -this.distance;
    this.window.position.x = this.position[0];
    this.window.position.y = this.position[1];
  }

  updateTexture() {
    this.texture.needsUpdate = true;
    this.window.material.needsUpdate = true;
  }

  draw() {
    this.context.restore();
    this.context.save();

    this.context.scale(this.hud.options.scaleFactor, this.hud.options.scaleFactor);

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.size[0], this.size[1]);

    this.context.font = "bold 24px Xolonium";
    
    this.context.fillStyle = '#ffffff';
  }

  update() {
    this.resize();
    this.resizePlane();
    this.draw();
    this.updateTexture();
  }

}

class MenuScreen {
  
  constructor() {
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);
  }

  itemSelected(id) {
    
  }

  drawItem(cc, item, isActive) {
    var height = 36;
    var fontHeight = 24;

    var label = item.label.toUpperCase();
    var labelWidth = cc.measureText(label).width;

    var hpadding = 24;

    var trih = 12;
    var triw = 8;

    var fontOffset = (height - fontHeight / 2) + 2;
    
    cc.translate(0, height);

    if(isActive) {
      cc.fillRect(0, 0, labelWidth + hpadding * 2, height);
      cc.fillStyle = 'black';
    }

    cc.fillText(label, hpadding, fontOffset);
    
    cc.fillStyle = 'white';
    
    if(isActive && false) {
      cc.beginPath();
      cc.moveTo(triw, height/2);
      cc.lineTo(0, height/2 + trih/2);
      cc.lineTo(0, height/2 - trih/2);
      cc.fill();
    }
  }
  
  draw(cc) {
    
    var item;
    
    cc.save();
    cc.translate(1, 0);
    
    for(var i=0; i<this.items.length; i++) {
      this.drawItem(cc, this.items[i], true);
    }

    cc.restore();
    
  }
  
}

class MainMenuScreen extends MenuScreen {
  
  constructor() {
    super();

    this.addItem({
      id: 'debug',
      label: 'Debug'
    });
    
  }

}

class MenuPanel extends Panel {
  
  constructor(app) {
    super(app);

    this.position = [0, -1];

    this.screens = {};
    
    this.screenStack = [];

    this.stackPointer = new animation.Animation({
      duration: 0.1
    });

    this.addScreen(new MainMenuScreen());
  }

  addScreen(screen) {
    this.screenStack.push(screen);
    this.stackPointer.setValue(this.screenStack.length-1);
  }

  draw() {
    super.draw();

    for(var i=0; i<this.screenStack.length; i++) {
      this.screenStack[i].draw(this.context);
    }
    
    this.window.rotation.x = -util.radians(20);
  }

}

class MapPanel extends Panel {
  
  constructor(app) {
    super(app);

    this.position = [0, -0.4];

    this.distance = 1;
    this.scale = 1;
    //    this.scale = 3;
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

    var s = 2;

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
    this.context.arc(this.size[0]/2, this.size[1]/2, this.size[0]/2 - 1, 0, Math.PI * 2);

    this.context.fillStyle = 'rgba(255, 255, 255, 0.05)';
    
    this.context.fill();
    this.context.stroke();

    this.window.rotation.x = -util.radians(70);
  }

}

exports.HUD = HUD;
exports.TankHUD = TankHUD;
exports.Panel = Panel;
exports.MenuPanel = MenuPanel;
exports.MapPanel = MapPanel;
