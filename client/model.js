
const async = require('async');
const util = require('../common/util.js');
const events = require('../common/events.js');

const THREE = require('three');

const loader = require('./loader.js');

class Model extends events.Events {

  constructor(scene, url) {
    super();

    this.scene = scene;
    this.loader = new loader.GeometryLoader(url);

    this.scene.loader.addLoader(this.loader);

    this.loader.on('loaded', util.withScope(this, this.loaded));
  }

  loaded() {
    this.geometry = this.loader.data;
  }

}

exports.Model = Model;


