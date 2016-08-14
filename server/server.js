'use strict'

const express = require('express');
const eapp = express();
const server = require('http').Server(eapp);
const io = require('socket.io')(server);

const path = require('path');

const app = require('./app.js');

// setup

const PORT = 8080;

var a = new app.App();

eapp.use(express.static(__dirname + '/../build/'));

server.listen(PORT, function() {
  console.log('listening at ' + PORT);
});

io.on('connection', function(socket) {
  a.newConnection(socket);
});

