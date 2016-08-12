
const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

class Game extends events.Events {

  constructor() {
    super();

    this.running = false;
  }

  stop() {
    this.running = false;
  }

  start() {
    this.running = true;
  }

}

exports.Game = Game;
