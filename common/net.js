'use strict'

const util = require('./util.js');
const events = require('./events.js');

class Net extends events.Events {

  constructor() {
    super();
    
    this.generateGUID();

    this.where = 'client';

    if(typeof window == 'undefined') this.where = 'server';
  }

  generateGUID() {
    var S4 = function() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    
    this.id = (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }

  init() {
    var init = this.initServer;
    if(this.where == 'client') init = this.initClient;

    util.withScope(this, init)();
  }

  initServer() {
  }

  initClient() {
  }

  pack() {
    return {
      id: this.id
    };
  }

  unpack(d) {
    this.id = d.id;
  }

}

exports.Net = Net;


