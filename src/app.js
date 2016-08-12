
const $ = require('jquery');

const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const game = require('./game.js');
const scene = require('./scene.js');

const loader = require('./loader.js');

class App extends events.Events {

  constructor() {
    super();

    this.time = {
      now: util.time(),
      last: util.time(),
      elapsed: 0.001,
      fps: 0
    };

    this.loader = new loader.MultiLoader();

    this.loader.on('loaded', util.withScope(this, function() {
      setTimeout(util.withScope(this, this.loaded), 0);
    }));

    this.game = new game.Game(this);
    this.scene = new scene.Scene(this);

    $(document).ready(util.withScope(this, this.ready));
  }

  ready() {
    this.scene.loadModels();
  }

  loaded() {
    $('body').addClass('loaded');

    this.game.start();
    this.scene.loaded();
    
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
