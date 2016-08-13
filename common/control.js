
const $ = require('jquery');

const async = require('async');
const util = require('../common/util.js');
const events = require('../common/events.js');

var KEYCODE = {
  0: 48,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
  CONTROL: 17,
  LEFT_SQUARE_BRACKET: 219,
  RIGHT_SQUARE_BRACKET: 221,
  COMMA: 188,
  PERIOD: 190
};

class Control extends events.Events {

  constructor(game) {
    super();

    this.game = game;

    this.throttle = 0;
    this.steer = 0;
    this.zoom = 0;
  }

  apply(tank) {
    tank.throttle = this.throttle;
    tank.steer = this.steer;
    tank.zoom = this.zoom;
  }

  tick(elapsed) {
    
  }

}

class MultiControl extends Control {

  constructor(game) {
    super(game);

    this.controls = {};

    this.active = {
      throttle: null,
      steer: null,
      zoom: null
    };
  }

  addControl(name, control, actives) {
    this.controls[name] = control;

    if(actives) {
      for(var i=0; i<actives.length; i++) {
        this.setActiveControl(name, actives[i]);
      }
    }
  }

  setActiveControl(name, control) {
    if(!(name in this.controls)) {
      console.warn('no control method "' + name + '"');
      return;
    }
    
    this.active[control] = name;
  }

  tick(elapsed) {
    var controls = [
      'throttle',
      'steer',
      'zoom'
    ];

    for(var i in this.controls) {
      this.controls[i].tick(elapsed);
    }
    
    for(var i=0; i<controls.length; i++) {
      var control = controls[i];
      var active = this.active[control];

      if(active)
        this[control] = this.controls[active][control];
    }
    
    super.tick(elapsed);
  }
  
}

class AutopilotControl extends Control {

  constructor(game) {
    super(game);

    this.active = false;
    
    if(Math.random() > 0.8) {
      this.steer = 1;
      if(Math.random() > 0.5) this.steer = -1;
      
      this.throttle = 0.2;
    }
    
  }

  tick(elapsed) {
    super.tick(elapsed);
  }

}

class MouseControl extends Control {

  constructor(game) {
    super(game);

    $(window).mousemove(util.withScope(this, this.mousemove));
  }

  mousemove(e) {
    var xy = [e.pageX, e.pageY];

    var boxsize = Math.min(window.innerWidth, window.innerHeight) * 0.5;

    xy[0] -= window.innerWidth * 0.5;
    xy[1] -= window.innerHeight * 0.5;

    xy[0] /= boxsize;
    xy[1] /= boxsize;

    xy[0] = util.clamp(-1, xy[0], 1);
    xy[1] = util.clamp(-1, xy[1], 1);

    this.steer = xy[0];
    this.throttle = -xy[1];
  }

}

class KeyboardControl extends Control {

  constructor(game) {
    super(game);

    this.keys = {};

    $(window).keydown(util.withScope(this, this.keydown));
    $(window).keyup(util.withScope(this, this.keyup));

    this.on('keydown', util.withScope(this, function(e) {
      if(e.key == KEYCODE.B && e.repeats == 1) {
        this.zoom = 1 - this.zoom;
      }
    }));
  }

  keydown(e) {
    if(!(e.which in this.keys))
      this.keys[e.which] = 0;
    
    this.keys[e.which] += 1;
    
    this.fire('keydown', {
      key: e.which,
      repeats: this.keys[e.which]
    });
  }

  keyup(e) {
    this.keys[e.which] = 0;
  }

  tick(elapsed) {
    if(this.keys[KEYCODE.DOWN]) {
      this.throttle = -1;
    } else if(this.keys[KEYCODE.UP]) {
      this.throttle = 1;
    } else {
      this.throttle = 0;
    }
    
    if(this.keys[KEYCODE.LEFT]) {
      this.steer = -1;
    } else if(this.keys[KEYCODE.RIGHT]) {
      this.steer = 1;
    } else {
      this.steer = 0;
    }
    
    super.tick(elapsed);
  }

}

exports.Control = Control;
exports.MultiControl = MultiControl;
exports.AutopilotControl = AutopilotControl;
exports.MouseControl = MouseControl;
exports.KeyboardControl = KeyboardControl;

