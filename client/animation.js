
const util = require('../common/util.js');

class Animation {
  
  constructor(options) {
    this.value = 0;
    this.start_value = 0;
    this.end_value = 0;
    this.progress = 0;
    this.easing = "smooth";
    this.duration = 1;
    this.start = 0;
    this.animating = false;
    
    if(options) {
      if("value" in options) this.value = options.value;
      if("start_value" in options) this.start_value = options.start_value;
      if("end_value" in options) this.end_value = options.end_value;
      if("easing" in options) this.easing = options.easing;
      if("duration" in options) this.duration = options.duration;
    }
  }
  
  setValue(value, time) {
    if(!time) this.setImmediate(value);
    else this.animate(value, time);
  }
  
  setImmediate(value) {
    this.start_value = value;
    this.value = value;
    this.end_value = value;
    this.start = -100;
    this.animating = false;
  }
  
  animate(value, time) {
    if(this.end_value == value) return;
    this.animating=true;
    this.progress=0;
    this.start=time;
    this.start_value=this.value + 0;
    this.end_value=value;
  }

  ease() {
    if(this.easing == "linear")
      this.value = util.clerp(0, this.progress, 1, this.start_value, this.end_value);
    else if(this.easing == "smooth")
      this.value = util.slerp(0, this.progress, 1, this.start_value, this.end_value);
    else
      console.log('Unknown easing "' + this.easing + '"');
  }
  
  get(time) {
    this.progress = 0;
    if(this.animating)
      this.progress = util.clerp(this.start, time, this.start + this.duration, 0, 1);
    this.ease();
    return this.value;
  }

};


exports.Animation = Animation;
