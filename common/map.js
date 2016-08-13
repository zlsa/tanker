
const util = require('./util.js');
const events = require('./events.js');

class Map extends events.Events {

  constructor(game) {
    super();

    this.game = game;

    this.options = {
      timeScale: 1,
      paused: false
    };

    this.renderer = null;

    this.floor = {
      
    };
  }

  addRenderer(scene, renderer) {
    if(this.renderer) return;
    this.renderer = renderer;
  }

  destroy() {
    this.fire('destroy');
    delete this;
  }

  tick(elapsed) {
    if(this.options.paused) elapsed = 0;
    
    this.time += elapsed * this.options.timeScale;

    for(var i=0; i<this.tanks.length; i++) {
      this.tanks[i].tick(elapsed);
    }
    
  }

}

exports.Map = Map;
