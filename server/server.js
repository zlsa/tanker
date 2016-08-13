'use strict'

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const path = require('path');

app.use(express.static(__dirname + '/../build/'));

server.listen(8080);

io.on('connection', function(socket) {
  console.log('foobar');
});

