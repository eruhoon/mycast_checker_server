"use strict";

// Load Module
var request = require('request');
var xmlParser = require('xml2js').parseString;

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
		parseInfo(body, users, callback);
	});
	
};


var parseInfo = function(body, users, callback) { try {
	xmlParser(body, function(err, result){
		if(!result) return;
		var wowzaServer = result.WowzaMediaServer || result.WowzaStreamingEngine;
		if(!wowzaServer) return;
		var streams = wowzaServer.Stream;
		if(!streams) return;

		streams.forEach(function(e) {
			var stream = e.$;
			var streamName = stream.streamName;
			var viewer = stream.sessionsTotal;

			var userEntry = users.find(function(e){
				return e.id === streamName;
			});
			if(!userEntry) return;

			var ret = {
				result: true,
				platform: 'local',
				keyid: userEntry.idx,
				icon: userEntry.icon,
				nickname: userEntry.nickname,
				title: userEntry.nickname,
				description: userEntry.nickname+'의 방송[공용채널]',
				url: VIEW_URL+userEntry.idx,
				thumbnail: userEntry.broadcast_bgimg,
				onair: true,
				viewer: parseInt(viewer)
			};

			if(callback) callback(ret);

		});
	});
} catch(e) {
	console.log(e+'@local.js parseInfo');
}};

