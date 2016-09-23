"use strict";

var SERVER_PORT = require('../port').STREAM_CHECKER_PORT;

// Global Module
var app = require('express')();
var http = require('http').Server(app);


// Module
var Checker = require('./checker');
var Sockets = require('./sockets');

// Http
app.get('/stream/', function (req, res) {
	var streams = Checker.getStreams();
	res.json(streams);
});

app.get('/local/', function (req, res) {
	var streams = Checker.getStreams().local;
	res.json(streams);
});

app.get('/external/', function (req, res) {
	var streams = Checker.getStreams().external;
	res.json(streams);
});

app.get('/azubu/', function (req, res) {
	var streams = Checker.getStreams().external.filter(function(e){
		return e.platform === 'azubu';
	});
	res.json(streams);
});

app.get('/twitch/', function (req, res) {
	var streams = Checker.getStreams().external.filter(function(e){
		return e.platform === 'twitch';
	});
	res.json(streams);
});


http.listen(SERVER_PORT, function() {
	console.log('Stream Checker started..');
});

// Socket
Sockets.init(http, Checker);



Checker.update();
Sockets.refreshStreams(Checker.getStreams());
setInterval(function() {
	Checker.update();
	Sockets.refreshStreams(Checker.getStreams());
}, 20000);
