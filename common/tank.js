
const util = require('./util.js');
const events = require('./events.js');

const control = require('./control.js');

class Tank extends events.Events {

  constructor(game) {
    super();

    this.game = game;

    this.team = null;

    // INPUT

    this.throttle = 0;
    this.steer = 0;

    this.zoom = 0;

    // CONTROL

    this.control = new control.AutopilotControl(this.game);

    // tank model stuff

    this.maximum = {
      speed: 20,
      steer: 90
    };

    this.acceleration = {
      speed: 0.2,
      steer: 2,
      decel: 2
    };

    // actual values (p2 here)

    this.speed = 0;
    
    this.velocity = [0, 0];
    this.position = [0, 0];

    this.angularVelocity = 0;
    this.heading = 0;
    
    this.renderer = null;
  }

  setTeam(team) {
    var old_team = this.team;
    
    this.team = team;
    
    this.fire('team-change', {
      old_team: old_team,
      team: team
    });
  }

  remove() {
    this.renderer.remove();
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
         
    this.position[0] += this.velocity[0] * elapsed;
    this.position[1] += this.velocity[1] * elapsed;

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

    this.heading -= this.angularVelocity * elapsed;
  }
  
  tick(elapsed) {
    var angle = this.game.time;
    var size = 40;
    var point_at = [Math.sin(angle) * size, Math.cos(angle) * size];
    
    // this.heading = Math.atan2(this.position[0] - point_at[0], this.position[1] - point_at[1]);

    this.control.tick(elapsed);
    this.control.apply(this);

    this.updatePhysics(elapsed);
  }

}

exports.Tank = Tank;


