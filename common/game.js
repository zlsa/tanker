
const util = require('./util.js');
const events = require('./events.js');

const tank = require('./tank.js');

const gamemode = require('./gamemode.js');

const map = require('./map.js');

class Game extends events.Events {

  constructor() {
    super();

    this.tanks = [];

    this.options = {
      timeScale: 1,
      paused: false
    };

    this.map = null;
    
    this.time = 0;
    this.running = false;

    this.initGameMode();
  }

  switchMap(map) {
    if(this.map) this.destroyMap();

    this.setMap(map);
  }

  setMap(map) {
    this.map = map;

    this.fire('new-map', {
      map: map
    });
  }

  destroyMap() {
    this.fire('destroy-map', {
      map: this.map
    });
    
    this.map.destroy();
  }

  initGameMode() {
    this.gamemode = new gamemode.DeathmatchGameMode(this);
  }

  getTanks() {
    return this.tanks;
  }

  loaded() {
    this.switchMap(new map.Map());
    this.initTanks();
  }

  initTanks() {

    this.destroyAllTanks();
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

  destroyAllTanks() {
    for(var i=0; i<this.tanks.length; i++) {
      this.tanks[i].destroy();
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
