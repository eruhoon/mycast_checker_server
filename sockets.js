"use strict";

/** @module */
var io = null;

/** @module */
var User = require('./user');

/** @constructor */
exports.init = (http, Checker) => {
	io = require('socket.io')(http);
	io.on('connection', (socket) => {
		var keyHash = socket.handshake.query.keyhash;
		
		// Abnormal Connection
		if(!keyHash) socket.disconnect();
		User.searchUserByHash(keyHash, (userInfo) => {
			if(!userInfo) { socket.disconnect(); }
		});
		// Init
		socket.emit('refresh_streams', Checker.getStreams());
	});
};


exports.refreshStreams = (streams) => {
	io.emit('refresh_streams', streams);
};