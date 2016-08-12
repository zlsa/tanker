
const $ = require('jquery');

const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const game = require('./game.js');
const scene = require('./scene.js');

class App extends events.Events {

  constructor() {
    super();

    this.time = {
      now: util.time(),
      last: util.time(),
      elapsed: 0.001,
      fps: 0
    };

    this.game = new game.Game();
    this.scene = new scene.Scene();

    $(document).ready(util.withScope(this, this.loaded));
    
  }

  loaded() {
    $('body').addClass('loaded');

    this.game.start();
    this.scene.init();
    
    $('#canvas').append(this.scene.element);
    
    this.time.last = util.time();
    this.tick();
  }

  tick() {
    this.time.now = util.time();
    this.time.elapsed = this.time.now - this.time.last;

    this.time.fps = 1 / this.time.elapsed;

    this.scene.render();
    
    this.time.last = this.time.now;

    requestAnimationFrame(util.withScope(this, this.tick));
  }

}

exports.App = App;
