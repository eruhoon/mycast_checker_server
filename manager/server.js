"use strict";

// Global Module
const express = require('express');
const http = require('http');

// Constants
const DEFAULT_PORT = require('../config/default').port;

// Variable
let app = null;
let server = null;

const init = () => {
	app = express();
	server = require('http').Server(app);

	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', 'http://mycast.xyz');
		next();
	});
};

const start = (port) => {
	if (!port) port = DEFAULT_PORT;
	if (!server) return;

	server.listen(port, () => {
		console.log('Stream Checker started..');
	});
};

const get = (path, func) => {
	if (!app) return;
	app.get(path, func);
};

const getServer = () => server;

module.exports = {
	init,
	start,
	getServer,
	get
};