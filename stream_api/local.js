"use strict";

// Load Module
var request = require('request');
var xmlParser = require('xml2js').parseString;
var shop = require('../model/shop');

// Constants
var URL = 'http://mycast.xyz:8086/connectioncounts?';
var SERVER_ID = 'eruhoon';
var SERVER_PW = 'eruhoon';
var VIEW_URL = 'http://mycast.xyz/home/stream/local/';

exports.update = function(users, callback) {

	request({
		url: URL,
		auth: {
			user: SERVER_ID,
			pass: SERVER_PW,
			sendImmediately: false
		},
		timeout: 10000,
		qs: { flat: true }
	}, function(err, res, body) {
		if(err) return;
		if(res.statusCode !== 200) return;
		updateInfo(body, users, callback);
	});
	
};


var updateInfo = function(body, users, callback) { try {
	xmlParser(body, (err, result) => {
		if(!result) return;
		let wowzaServer = result.WowzaMediaServer || result.WowzaStreamingEngine;
		if(!wowzaServer) return;
		let streams = wowzaServer.Stream;
		if(!streams) return;

		streams.forEach(function(e) {
			let stream = e.$;
			let streamName = stream.streamName;
			let viewer = parseInt(stream.sessionsTotal);

			let user = users.find((e) => { return e.id === streamName; });
			if(!user) return;

			let ret = {
				result: true,
				platform: 'local',
				keyid: user.idx,
				icon: user.icon,
				nickname: user.nickname,
				title: user.nickname,
				description: user.nickname+'의 방송[공용채널]',
				url: VIEW_URL+user.idx,
				thumbnail: user.broadcast_bgimg,
				onair: true,
				viewer: viewer
			};

			shop.rewardStream(user.hash, viewer, () => {});

			if(callback) callback(ret);

		});
	});
} catch(e) {
	console.log(e+'@local.js parseInfo');
}};

