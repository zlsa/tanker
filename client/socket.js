
const util = require('../common/util.js');
const events = require('../common/events.js');

const io = require('socket.io-client');

class Socket extends events.Events {

  constructor(app) {
    super();

    this.app = app;

    this.game = this.app.game
  }

  connect(url) {
    this.socket = io(url);

    this.socket.on('connect', function() {
      console.log('connected!');
    });

    this.initGame();
    this.initTank();
  }

  initGame() {
    this.socket.on('game-state', util.withScope(this, this.gotGameState));
  }

  initTank() {
    this.socket.on('update-tanks', util.withScope(this, this.getTanks));
    
    setInterval(util.withScope(this, this.sendTank), 1000/20);
  }

  sendTank() {
    this.socket.emit('update-tanks', [
      this.game.playerTank.pack()
    ]);
  }

  getTanks(message) {
    this.game.unpackTanks(message);
  }

  gotGameState(message) {
    this.game.unpack(message);
  }

}

exports.Socket = Socket;
