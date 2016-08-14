
const $ = require('jquery');

const util = require('../common/util.js');
const events = require('../common/events.js');

const game = require('../common/game.js');
const scene = require('./scene.js');
const hud = require('./hud.js');

const loader = require('./loader.js');

const control = require('../common/control.js');

const socket = require('./socket.js');

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
    this.socket = new socket.Socket(this);

    this.hud = {};
    this.hud.tank = new hud.TankHUD(this);

    this.initControl();

    this.initTank();
    
    $(document).ready(util.withScope(this, this.documentReady));
  }

  initTank() {

    this.tank = {
      view: null,
      control: null
    };

    window.g = this;
  }

  // TANK STUFF

  initControl() {
    this.control = new control.MultiControl(this.game);
    this.control.addControl('keyboard', new control.KeyboardControl(this.game), ['throttle', 'steer', 'zoom']);
    this.control.addControl('mouse', new control.MouseControl(this.game), ['throttle', 'steer']);
  }

  setViewTank(tank) {
    if(!tank) {
      console.warn('no such tank!');
      return;
    }
    
    this.tank.view = tank;
    this.scene.camera = tank.renderer.camera;

    this.hud.tank.setTank(tank);
  }

  setControlTank(tank) {
    if(!tank) {
      console.warn('no such tank!');
      return;
    }
    
    if(this.tank.control) this.tank.control = new control.AutopilotControl();
    
    tank.control = this.control;
    this.tank.control = tank;
  }

  setPlayerTank(tank) {
    this.setViewTank(tank);
    this.setControlTank(tank);
  }

  // APP STUFF

  documentReady() {
    this.scene.documentReady();
  }

  loaded() {
    $('body').addClass('loaded');

    this.game.on('player-tank', util.withScope(this, function(e) {
      this.setPlayerTank(e.tank);
    }));
    
    this.scene.loaded();
    this.hud.tank.loaded();
    
    this.game.init();
    
    $('#canvas').append(this.scene.element);
    
    this.time.last = util.time();

    this.tick();

    this.socket.connect();
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
    this.hud.tank.render(this.time.elapsed);

    // NO MORE WORK
    
    this.time.last = this.time.now;

    if(this.time.bucket >= 0.5) {
      this.time.fps = this.time.bucket_frames / this.time.bucket;
      this.time.bucket = 0;
      this.time.bucket_frames = 0;
    }

    requestAnimationFrame(util.withScope(this, this.tick));
  }

}

exports.App = App;
