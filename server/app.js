'use strict'

const util = require('../common/util.js');
const events = require('../common/events.js');

const game = require('../common/game.js');

const socket = require('./socket.js');

class App extends events.Events {

  constructor() {
    super();

    this.sockets = [];
    
    this.game = new game.Game();

    this.game.init();

    setInterval(util.withScope(this, this.tick), 1000/60);
    setInterval(util.withScope(this, this.updateTanks), 1000/20);
  }

  newConnection(s) {
    this.sockets.push(new socket.Socket(this, s));
  }

  tick() {
    this.game.tick(1/60);
  }

  updateTanks() {

    var tanks = this.game.getTanks();

    var msg = [];

    var i;
    
    for(i=0; i<tanks.length; i++) {
      msg.push(tanks[i].pack());
    }

    for(i=0; i<this.sockets.length; i++) {
      this.sockets[i].sendTanks(msg);
    }
    
  }
  
}

exports.App = App;
