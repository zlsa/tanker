'use strict'

function mod(n) {
  return ((this%n)+n)%n;
}

function time() {
  return Date.now() * 0.001;
}

function radians(degrees) {
  return degrees * (Math.PI / 180);
}

function degrees(radians) {
  return radians * (180 / Math.PI);
}

function lowpass(current, target, speed, elapsed) {
  return current + (target - current) / (speed / elapsed);
}

function clamp(a, i, b) {
  if(a > b) {
    var temp = a;
    a = b;
    b = temp;
  }
  
  if(a > i) return a;
  if(b < i) return b;
  return i;
}

// # lerp
//
// Interpolates `i` from range `il..ih` to `ol..oh`.
//
// ```js
// lerp(0, 50, 100, -50, 50); // returns 0
// ```

function lerp(il, i, ih, ol, oh) {
  return ((i - il) / (ih - il)) * (oh - ol) + ol;
}

function clerp(il, i, ih, ol, oh) {
  return lerp(il, clamp(il, i, ih), ih, ol, oh);
}

function slerp(il, i, ih, ol, oh) {
  return lerp(-1, Math.sin(lerp(il, i, ih, -Math.PI/2, Math.PI/2)), 1, ol, oh);
}

// # getValue
// Gets a value from an object with the option to have a default
// value. If no default value or key is present, `null` is returned.
// In the future, this should accept dot-notation and possibly array
// index notation, like so:
//
// ```js
// get_value(options, 'foo.bar.baz[3]', 42);
// ```

function getValue(object, key, default_value) {
  
  if(key in object) {
    return object[key];
  }

  // When `default_value` is not present, return `null` instead of `undefined`.
  if(arguments.length === 2) return null;

  if(default_value instanceof Error) throw default_value;
  
  return default_value;
}

// # withScope
// Effectively calls `func` with `scope`. Mostly to be used inline
// with callbacks, to make things cleaner.

function withScope(scope, func) {
  if(!scope || !func) console.warn('withScope() called without both arguments!');
  return function() {
    func.apply(scope, arguments);
  };
}

var Controller = function(k_p, k_i, k_d, i_max) {
  if (typeof k_p === 'object') {
    var options = k_p;
    k_p = options.k_p;
    k_i = options.k_i;
    k_d = options.k_d;
    i_max = options.i_max;
  }

  // PID constants
  this.k_p = (typeof k_p === 'number') ? k_p : 1;
  this.k_i = k_i || 0;
  this.k_d = k_d || 0;

  // Maximum absolute value of sumError
  this.i_max = i_max || 0;

  this.sumError  = 0;
  this.lastError = 0;
  this.lastTime  = 0;

  this.limits = [-Infinity, Infinity];

  this.target    = 0; // default value, can be modified with .setTarget
  this.currentValue = 0;
  this.output = 0;
};

Controller.prototype.set_target = function(target) {
  this.target = target;
};

Controller.prototype.set_measure = function(currentValue) {
  this.currentValue = currentValue;
};

Controller.prototype.get = function() {
  return this.output;
};

Controller.prototype.update = function(dt) {

  var error = (this.target - this.currentValue);
  this.sumError = this.sumError + error*dt;
  if (this.i_max > 0 && Math.abs(this.sumError) > this.i_max) {
    var sumSign = (this.sumError > 0) ? 1 : -1;
    this.sumError = sumSign * this.i_max;
  }

  var dError = (error - this.lastError)/dt;
  this.lastError = error;

  this.output = (this.k_p*error) + (this.k_i * this.sumError) + (this.k_d * dError);
  this.output = clamp(this.limits[0], this.output, this.limits[1]);
  return this.output;
};

Controller.prototype.reset = function() {
  this.sumError  = 0;
  this.lastError = 0;
  this.lastTime  = 0;
};

exports.mod = mod;
exports.time = time;
exports.radians = radians;
exports.degrees = degrees;

exports.lowpass = lowpass;

exports.clamp = clamp;
exports.lerp = lerp;
exports.clerp = clerp;
exports.slerp = slerp;

exports.getValue = getValue;
exports.withScope = withScope;

exports.PID = Controller;
