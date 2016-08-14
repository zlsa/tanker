'use strict'

const util = require('../common/util.js');
const events = require('../common/events.js');

class Socket extends events.Events {

  constructor(app, socket) {
    super();

    this.app = app;
    this.game = this.app.game;
    
    this.socket = socket;

    this.initTank();
    
    this.sendState();
  }

  initTank() {
    this.socket.on('update-tanks', util.withScope(this, this.getTanks));
  }

  sendTanks(tanks) {
    this.socket.emit('update-tanks', tanks);
  }

  getTanks(message) {
    this.game.unpackTanks(message);
  }

  sendState() {
    this.socket.emit('game-state', this.app.game.pack());
  }

}

exports.Socket = Socket;
