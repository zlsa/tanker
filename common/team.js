
const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

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

class Team extends events.Events {

  constructor(team) {
    super();
    
    this.team = null;
    this.name = null;
    this.view = null;
    this.color = null;

    this.setTeam(team);
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
