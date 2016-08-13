
const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const tank = require('./tank.js');

const control = require('./control.js');

class Game extends events.Events {

  constructor(app) {
    super();

    this.app = app;

    this.tanks = [];

    this.time = 0;

    this.options = {
      timeScale: 1,
      paused: false
    };
    
    this.running = false;

    this.tank = {
      view: null,
      control: null
    };

    this.control = new control.MultiControl(this);
    this.control.addControl('mouse', new control.MouseControl(), ['throttle', 'steer']);
    this.control.addControl('keyboard', new control.KeyboardControl(), ['zoom']);

    window.g = this;
  }

  loaded() {
    this.initTanks();
  }

  initTanks() {

    this.removeAllTanks();
    this.tanks = [];

    var total = 6;

    var t;

    for(var y=0; y<total; y++) {
      for(var x=0; x<total; x++) {
        t = this.createTank();
        t.position[0] = (x - (total * 0.5) + 0.5) * 15;
        t.position[1] = (y - (total * 0.5) + 0.5) * 15;

        this.tanks.push(t);
      }
    }
    
    this.setPlayerTank(this.tanks[this.tanks.length-1]);
  }

  setViewTank(tank) {
    this.tank.view = tank;
    this.app.scene.camera = tank.renderer.camera;

    this.app.hud.tank.setTank(tank);
  }

  setControlTank(tank) {
    if(this.tank.control) this.tank.control = new control.AutopilotControl();
    
    tank.control = this.control;
    this.tank.control = tank;
  }

  setPlayerTank(tank) {
    this.setViewTank(tank);
    this.setControlTank(tank);
  }

  createTank() {
    var t = new tank.Tank(this);
    t.addRenderer(this.app.scene);
    return t;
  }

  removeAllTanks() {
    for(var i=0; i<this.tanks.length; i++) {
      this.tanks[i].remove();
    }

    this.tanks = [];
  }

  stop() {
    this.running = false;
  }

  start() {
    this.running = true;
  }

  tick(elapsed) {
    if(this.options.paused) elapsed = 0;
    
    this.time += elapsed * this.options.timeScale;

    for(var i=0; i<this.tanks.length; i++) {
      this.tanks[i].tick(elapsed);
    }
    
  }

}

exports.Game = Game;
