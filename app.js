"use strict";

//var SERVER_PORT = require('../port').STREAM_CHECKER_PORT;
const SERVER_PORT = require('./config/default').port;

// Global Module
//var app = require('express')();
//var http = require('http').Server(app);

// Module
var Checker = require('./checker');
var Sockets = require('./sockets');
const ServerManager = require('./manager/server');

ServerManager.init();
ServerManager.get('/stream/', function (req, res) {
	var streams = Checker.getStreams();
	res.json(streams);
});

ServerManager.get('/local/', function (req, res) {
	var streams = Checker.getStreams().local;
	res.json(streams);
});

ServerManager.get('/external/', function (req, res) {
	var streams = Checker.getStreams().external;
	res.json(streams);
});

ServerManager.get('/azubu/', function (req, res) {
	var streams = Checker.getStreams().external.filter(function (e) {
		return e.platform === 'azubu';
	});
	res.json(streams);
});

ServerManager.get('/twitch/', function (req, res) {
	var streams = Checker.getStreams().external.filter(function (e) {
		return e.platform === 'twitch';
	});
	res.json(streams);
});

ServerManager.start(9000);

// Socket
Sockets.init(ServerManager.getServer(), Checker);

Checker.update();
Sockets.refreshStreams(Checker.getStreams());
setInterval(function () {
	Checker.update();
	Sockets.refreshStreams(Checker.getStreams());
}, 20000);