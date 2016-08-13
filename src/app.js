
const $ = require('jquery');

const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const game = require('./game.js');
const scene = require('./scene.js');
const hud = require('./hud.js');

const loader = require('./loader.js');

class App extends events.Events {

  constructor() {
    super();

    this.time = {
      frames: 0,
      now: util.time(),
      last: util.time(),
      elapsed: 0.001,
      fps: 0,
      bucket: 0,
      bucket_frames: 0
    };

    this.loader = new loader.MultiLoader();

    this.loader.on('loaded', util.withScope(this, function() {
      setTimeout(util.withScope(this, this.loaded), 0);
    }));

    this.scene = new scene.Scene(this);
    this.game = new game.Game(this);

    this.hud = {};
    this.hud.tank = new hud.TankHUD(this);

    $(document).ready(util.withScope(this, this.ready));
  }

  ready() {
    this.scene.ready();
  }

  loaded() {
    $('body').addClass('loaded');

    this.scene.loaded();
    this.hud.tank.loaded();
    this.game.loaded();
    
    this.game.start();
    
    $('#canvas').append(this.scene.element);
    
    this.time.last = util.time();
    this.tick();
  }

  addPanel(name, panel) {
    this.panels[name] = panel;
    this.hud.tank.addPanel(panel);
  }

  tick() {
    this.time.now = util.time();
    this.time.elapsed = this.time.now - this.time.last;
    
    this.time.frames += 1;
    this.time.bucket_frames += 1;
    this.time.bucket += this.time.elapsed;

    // ACTUAL WORK
    
    this.game.tick(this.time.elapsed);
    this.scene.render(this.time.elapsed);
    this.hud.tank.update(this.time.elapsed);

    // NO MORE WORK
    
    this.time.last = this.time.now;

    if(this.time.bucket >= 2) {
      this.time.fps = this.time.bucket_frames / this.time.bucket;
      this.time.bucket = 0;
      this.time.bucket_frames = 0;
      console.log(this.time.fps);
    }

    requestAnimationFrame(util.withScope(this, this.tick));
  }

}

exports.App = App;
