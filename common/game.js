'use strict'

const util = require('./util.js');
const events = require('./events.js');
const merge = require('merge');

const tank = require('./tank.js');

const gamemode = require('./gamemode.js');

const map = require('./map.js');

const net = require('./net.js');

class Game extends net.Net {

  constructor() {
    super();

    this.playerTank = null;

    this.tanks = [];

    this.options = {
      timeScale: 1,
      paused: false
    };

    this.map = null;
    
    this.time = 0;

    this.gamemode = new gamemode.DeathmatchGameMode(this);
  }

  pack() {
    var tanks = [];

    for(var i=0; i<this.tanks.length; i++) {
      tanks.push(this.tanks[i].pack());
    }
    
    var p = {
      options: this.options,
      time: this.time,
      tanks: tanks
    }

    return merge(super.pack(), p);
  }

  unpack(d) {
    super.unpack(d);

    this.time = d.time;
    this.options = d.options;

    var t;

    this.unpackTanks(d.tanks);

    return this;
  }

  initServer() {
    this.switchMap(new map.Map());
    //this.initDummyTanks();
  }

  initClient() {
    this.switchMap(new map.Map());
    this.initClientTank();
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

  getTanks() {
    return this.tanks;
  }

  initClientTank() {
    var t = new tank.Tank(this);
    t.setRemote(false);
    this.addTank(t);

    console.log('local client is ' + t.id);

    this.playerTank = t;

    this.fire('player-tank', {
      tank: t
    });
    
    this.gamemode.autoSelectTeam(t);
  }

  initDummyTanks() {

    var t = new tank.Tank(this);
    this.gamemode.setTeam(t, 'red');
    this.addTank(t);
    
    return;
    var max = 0;
    
    for(var i=0; i<max; i++) {
      var t = new tank.Tank(this);
      t.position[0] = (i - 0.5 - max * 0.5) * 10;
      t.position[1] = Math.sin(i) * 10;

      this.gamemode.autoSelectTeam(t);
      
      this.addTank(t);
    }
    
  }

  getTank(id) {
    for(var i=0; i<this.tanks.length; i++) {
      if(this.tanks[i].id == id) return this.tanks[i];
    }
  }

  unpackTanks(d) {

    var i;

    for(i=0; i<d.length; i++) {
      this.unpackTank(d[i]);
    }
    
  }

  unpackTank(d) {
    var t = this.getTank(d.id);

    if(this.where == 'client' && t && t.remote == false) {
      return;
    }

    if(!t) {
      t = new tank.Tank(this);
      this.addTank(t);
    }

    t.setRemote(true);
    
    t.unpack(d);
  }

  addTank(tank) {
    this.tanks.push(tank);

    this.fire('new-tank', {
      tank: tank
    });
  }

  destroyTank(t) {
    for(var i=0; i<this.tanks.length; i++) {
      if(this.tanks[i] == t) {
        this.tanks[i].destroy();
        this.tanks.splice(i, 1);
      }
    }
  }

  destroyAllTanks() {
    for(var i=0; i<this.tanks.length; i++) {
      this.tanks[i].destroy();
    }

    this.tanks = [];
  }

  cullTanks() {
    
    var t;

    for(var i=this.tanks.length-1; i>0; i--) {
      t = this.tanks[i];

      if(t.last_update < this.time - 1) {
        this.destroyTank(t);
      }
      
    }

  }

  tick(elapsed) {
    this.cullTanks();
    
    if(this.options.paused) elapsed = 0;
    
    this.time += elapsed * this.options.timeScale;

    for(var i=0; i<this.tanks.length; i++) {
      this.tanks[i].tick(elapsed);
    }

  }

}

exports.Game = Game;
