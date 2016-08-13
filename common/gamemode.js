
const async = require('async');
const util = require('./util.js');
const events = require('./events.js');

const team = require('./team.js');

class GameMode extends events.Events {

  constructor(game) {
    super();

    this.game = game;

    this.teams = {
    };

    this.autoselect = null;
  }

  autoSelectTeam(tank) {
    var tank_number = {};
    var tanks = this.game.getTanks();

    var i, t;

    if(this.autoselect) {
      for(i=0; i<this.autoselect.length; i++) {
        tank_number[i] = 0;
      }
    } else {
      for(i in this.teams) {
        tank_number[i] = 0;
      }
    }

    for(i=0; i<tanks.length; i++) {
      t = tanks[i];
      if(t == tank) continue;

      if(!(t.team.team in tank_number)) continue;
      
      tank_number[t.team.team] += 1;
    }

    // convert tank number object into array

    var tank_number_array = [];

    for(i in tank_number) {
      // [number_of_tanks, team]
      tank_number_array.push([tank_number[i], i]);
    }

    tank_number_array.sort();

    tank.setTeam(this.teams[tank_number_array[0][1]]);
  }

  addTeam(team) {
    this.teams[team.team] = team;
  }

  tick(elapsed) {
    
  }

}

class DeathmatchGameMode extends GameMode {

  constructor(game) {
    super(game);

    this.addTeam(new team.Team('neutral'));
    this.addTeam(new team.Team('red'));
    this.addTeam(new team.Team('blue'));
  }

}

exports.GameMode = GameMode;
exports.DeathmatchGameMode = DeathmatchGameMode;
