
const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const tank = require('./tank.js');

class Game extends events.Events {

  constructor(app) {
    super();

    this.app = app;

    this.tanks = [];

    this.time = 0;
    this.time_scale = 1;
    
    this.paused = false;
    this.running = false;
  }

  loaded() {
    this.initTanks();
  }

  initTanks() {

    this.removeAllTanks();
    this.tanks = [];

    var total = 10;

    var t;

    for(var y=0; y<total; y++) {
      for(var x=0; x<total; x++) {
        t = this.createTank();
        t.position[0] = (x - (total * 0.5) + 0.5) * 15;
        t.position[1] = (y - (total * 0.5) + 0.5) * 15;

        this.tanks.push(t);
      }
    }
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
    this.time += elapsed * this.time_scale;
    
    for(var i=0; i<this.tanks.length; i++) {
      this.tanks[i].tick(elapsed);
    }
    
  }

}

exports.Game = Game;
