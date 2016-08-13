
const util = require('../common/util.js');
const events = require('../common/events.js');

const THREE = require('three');

class Loader extends events.Events {

  constructor() {
    super();
  }

}

class URLLoader extends Loader {

  constructor(url) {
    super();

    this.url = url;

    // `idle`, `downloading`, `complete`, `error`
    this.status = 'idle';
    
    if(url) this.load();
  }

  load(url) {
    if(url) this.url = url;
    
    this.get();
    
    this.setStatus('downloading');
  }
  
  setStatus(newStatus) {
    if(this.status === newStatus) return;

    var eventData = {
      loader: this,
      status: this.status,
      newStatus: newStatus
    };

    this.fire(newStatus, eventData);
    
    this.status = newStatus;
    
    this.fire('status-change', eventData);
  }

  isStatus(status) {
    if(status === 'loaded') {
      return ((this.status === 'complete') || (this.status === 'error'));
    } else if(this.status === status) {
      return true;
    }
    return false;
  }

}

class XHRLoader extends URLLoader {

  loadEvent(event) {
    this.data = event.target.responseText;

    this.setStatus('complete');

    this.fire('loaded');
  }

  errorEvent(event) {
    this.setStatus('error');
    
    this.fire('loaded');
  }

  get() {
    this.request = new XMLHttpRequest();
    
    this.request.addEventListener('load', util.withScope(this, this.loadEvent));
    this.request.addEventListener('error', util.withScope(this, this.errorEvent));
    this.request.addEventListener('abort', util.withScope(this, this.errorEvent));
    
    this.request.open('GET', this.url);
    this.request.send();
  }

}

class JSONLoader extends XHRLoader {

  constructor(url) {
    super(url);

    this.on('loaded', util.withScope(this, this.parseJSON));
  }

  parseJSON() {
    this.data = JSON.parse(this.data);
  } 

}

class GeometryLoader extends JSONLoader {

  constructor(url) {
    super(url);

    this.jsonloader = new THREE.JSONLoader();

    this.on('loaded', util.withScope(this, this.parseGeometry));
  }

  parseGeometry() {
    this.data = this.jsonloader.parse(this.data).geometry;
  } 

}

class ImageLoader extends URLLoader {

  loadEvent(event) {
    this.data = this.image;

    this.fire('image-loaded');
    
    this.setStatus('complete');

    this.fire('loaded');
  }

  errorEvent(event) {
    this.setStatus('error');
    
    this.fire('loaded');
  }

  get() {
    this.image = new Image();
    this.image.onload = util.withScope(this, this.loadEvent);
    this.image.src = this.url;
  }

}

class TextureLoader extends ImageLoader {

  constructor(url) {
    super(url);

    this.on('image-loaded', util.withScope(this, this.makeTexture));
  }

  makeTexture() {
    this.texture = new THREE.Texture(this.image);
    this.texture.needsUpdate = true;

    this.data = this.texture;
  }
  
}
    
// Loads multiple files, calls back when complete

class MultiLoader extends Loader {

  constructor() {
    super();

    this.loaders = [];

    this.createCallbacks();
  }

  // Create callbacks and assign them to variables so we can use
  // `loader.off` to remove callbacks

  createCallbacks() {
    var _this = this;
    
    this.statusChangeCallback = function statusChangeCallback() {
      _this.statusChange.apply(_this, arguments);
    };
    
  }

  filterStatus(status) {
    var filtered = [];
    var loader;

    for(var i=0; i<this.loaders.length; i++) {
      loader = this.loaders[i];
      if(loader.isStatus(status)) filtered.push(loader);
    }

    return filtered;
  }

  statusChange(obj) {
    if(this.filterStatus('complete').length == this.loaders.length) {
      this.fire('loaded');
    }
  }

  addLoader(loader) {
    this.loaders.push(loader);

    loader.on('status-change', this.statusChangeCallback);
  }

}

exports.Loader = Loader;
exports.JSONLoader = JSONLoader;
exports.GeometryLoader = GeometryLoader;
exports.ImageLoader = ImageLoader;
exports.TextureLoader = TextureLoader;
exports.MultiLoader = MultiLoader;

