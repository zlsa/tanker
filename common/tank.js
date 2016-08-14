'use strict'

const util = require('./util.js');
const events = require('./events.js');
const merge = require('merge');

const net = require('./net.js');

const control = require('./control.js');

class Tank extends net.Net {

  constructor(game) {
    super();

    this.remote = false;
    this.bot = false;
    
    this.game = game;

    this.team = null;

    // INPUT

    this.throttle = 0;
    this.steer = 0;

    this.zoom = 0;
    
    this.turbo = 0;

    // CONTROL

    this.control = new control.AutopilotControl(this.game);

    // tank model stuff

    this.maximum = {
      speed: 20,
      steer: 90
    };

    this.last_update = 0;

    this.acceleration = {
      speed: 0.2,
      steer: 2,
      decel: 2
    };

    // actual values (p2 here)

    this.speed = 0;

    this.remote_position = [0, 0];
    this.remote_heading = 0;

    this.velocity = [0, 0];
    this.position = [0, 0];

    this.angularVelocity = 0;
    this.heading = 0;
    
    this.renderer = null;
  }

  setRemote(remote) {
    this.remote = remote;

    if(remote) {
      this.control = new control.RemoteControl(this.game);
    } else {
      this.control = new control.AutopilotControl(this.game);
    }
    
  }

  pack() {
    var p = {
      team: this.team.team,
      throttle: this.throttle,
      steer: this.steer,
      zoom: this.zoom,
      turbo: this.turbo,

      speed: this.speed,
      velocity: this.velocity,
      position: this.position,
      
      angularVelocity: this.angularVelocity,
      heading: this.heading
    };
    return merge(super.pack(), p);
  }

  unpack(d) {
    super.unpack(d);

    this.last_update = this.game.time;

    if(d.team in this.game.gamemode.teams)
      this.team = this.game.gamemode.teams[d.team];

    this.setTeam(this.team);
    
    this.throttle = d.throttle;
    this.steer = d.steer;
    this.zoom = d.zoom;
    this.turbo = d.turbo;
    
    this.speed = d.speed;
    this.velocity = d.velocity;
    this.remote_position = d.position;
    
    this.angularVelocity = d.angularVelocity;
    this.remote_heading = d.heading;

    return this;
  }

  setTeam(team) {
    var old_team = this.team;
    
    this.team = team;
    
    this.fire('team-change', {
      old_team: old_team,
      team: team
    });
  }

  destroy() {
    this.fire('destroy');
    delete this;
  }

  addRenderer(scene, renderer) {
    if(this.renderer) return;
    this.renderer = renderer;
  }

  updatePhysics(elapsed) {
    this.throttle = util.clamp(-1, this.throttle, 1);
    if(this.throttle < 0) this.throttle *= 0.7;
    
    this.steer = util.clamp(-1, this.steer, 1);

    var factor = util.clerp(0, this.zoom, 1, 1, 0.6);

    // update speed

    var step = (this.maximum.speed / this.acceleration.speed) * elapsed;

    var target_speed = this.throttle * this.maximum.speed * factor;

    if(Math.abs(target_speed) < Math.abs(this.speed)) step *= this.acceleration.decel;

    if(Math.abs(this.speed - target_speed) < step) {
      this.speed = target_speed;
    } else if(target_speed > this.speed) {
      this.speed += step;
    } else {
      this.speed -= step;
    }

    this.velocity[0] = -Math.sin(this.heading) * this.speed;
    this.velocity[1] = -Math.cos(this.heading) * this.speed;
         
    this.remote_position[0] += this.velocity[0] * elapsed;
    this.remote_position[1] += this.velocity[1] * elapsed;

    // update heading

    step = (this.maximum.steer / this.acceleration.steer) * elapsed;

    var target_angularVelocity = util.radians(this.steer * this.maximum.steer * factor);

    if(Math.abs(target_angularVelocity) < Math.abs(this.angularVelocity)) step *= this.acceleration.decel;

    if(Math.abs(this.angularVelocity - target_angularVelocity) < step) {
      this.angularVelocity = target_angularVelocity;
    } else if(target_angularVelocity > this.angularVelocity) {
      this.angularVelocity += step;
    } else {
      this.angularVelocity -= step;
    }

    this.remote_heading -= this.angularVelocity * elapsed;
  }
  
  tick(elapsed) {
    var angle = this.game.time;
    var size = 40;
    var point_at = [Math.sin(angle) * size, Math.cos(angle) * size];
    
    // this.heading = Math.atan2(this.position[0] - point_at[0], this.position[1] - point_at[1]);

    this.control.tick(elapsed);
    this.control.apply(this);

    this.updatePhysics(elapsed);

    if(this.remote && this.where == 'client' && false) {
      this.position[0] = util.lowpass(this.position[0], this.remote_position[0], 0.1, elapsed);
      this.position[1] = util.lowpass(this.position[1], this.remote_position[1], 0.1, elapsed);
      
      this.heading = util.lowpass(this.heading, this.remote_heading, 0.1, elapsed);
    } else {
      this.position[0] = this.remote_position[0];
      this.position[1] = this.remote_position[1];
      this.heading = this.remote_heading;
    }

  }

}

exports.Tank = Tank;


