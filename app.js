var SERVER_PORT = require('../port.js').STREAM_CHECKER_PORT;

// Global Module
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Module
var Checker = require('./checker.js');


// Http
app.get('/', function (req, res) {
	var streams = Checker.getStream();
	res.json(streams);
	console.log('GET /');
});

app.get('/local/', function (req, res) {
	var streams = Checker.getStream().local;
	res.json(streams);
});

app.get('/external/', function (req, res) {
	var streams = Checker.getStream().external;
	res.json(streams);
});

app.get('/azubu/', function (req, res) {
	var streams = Checker.getStream().external.filter(function(e){
		return e.platform === 'azubu';
	});
	res.json(streams);
});

app.get('/afreeca/:id', function (req, res) {
	var aid = req.params.id;
	var afreeca = require('./stream_api/afreeca.js');
	afreeca.getInfo(aid, function(err, info) {
		res.send(info);	
	});
});


app.listen(SERVER_PORT, function() {
	console.log('Stream Checker started..');
});

Checker.update();
setInterval(function() {
	Checker.update();
}, 60000);

