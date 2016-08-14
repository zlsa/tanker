'use strict'

const util = require('./util.js');
const events = require('./events.js');
const merge = require('merge');

const TEAMS = {
  
  spectator: {
    name: 'Spectator',
    enemy: [],
    view: ['tank'],
    color: '#ffffff'
  },
  
  red: {
    name: 'Red',
    enemy: ['blue', 'neutral'],
    view: ['tank'],
    color: '#ffaa99'
  },
  
  blue: {
    name: 'Blue',
    enemy: ['red', 'neutral'],
    view: ['tank'],
    color: '#7788ff'
  },
  
  neutral: {
    name: 'Neutral',
    enemy: ['neutral', 'red', 'blue'],
    view: ['tank'],
    color: '#666666'
  }

};

const net = require('./net.js');

class Team extends net.Net {

  constructor(team) {
    super();
    
    this.team = null;
    this.name = null;
    this.view = null;
    this.color = null;

    this.setTeam(team);
  }

  pack() {
    var p = {
      team: this.team,
      name: this.name,
      view: this.view,
      color: this.color
    }

    return merge(super.pack(), p);
  }

  unpack(d) {
    super.unpack(d);

    this.team = d.team;
    this.name = d.name;
    this.view = d.view;
    this.color = d.color;

    return this;
  }

  setTeam(team) {
    this.team = team;
    this.name = TEAMS[team].name;
    this.view = TEAMS[team].view;
    this.color = TEAMS[team].color;
  }

}

exports.TEAMS = TEAMS;
exports.Team = Team;
