
const util = require('./util.js');
const events = require('./events.js');

const tank = require('./tank.js');

const gamemode = require('./gamemode.js');

class Game extends events.Events {

  constructor(app) {
    super();

    this.app = app;

    this.tanks = [];

    this.options = {
      timeScale: 1,
      paused: false
    };
    
    this.time = 0;
    this.running = false;

    this.initGameMode();
  }

  initGameMode() {
    this.gamemode = new gamemode.DeathmatchGameMode(this);
  }

  getTanks() {
    return this.tanks;
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
        t = new tank.Tank(this);
        t.position[0] = (x - (total * 0.5) + 0.5) * 15;
        t.position[1] = (y - (total * 0.5) + 0.5) * 15;

        this.addTank(t);
        
        this.gamemode.autoSelectTeam(t);
      }
    }
    
  }

  addTank(tank) {
    this.tanks.push(tank);

    this.fire('new-tank', {
      tank: tank
    });
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
