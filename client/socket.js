
const util = require('../common/util.js');
const events = require('../common/events.js');

class Socket extends events.Events {

  constructor(app) {
    super();

    this.app = app;

    this.game = this.app.game
  }

}

exports.Socket = Socket;
