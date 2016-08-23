"use strict";

/**
 * @typedef streamInfo
 * @type {object}
 * @property {boolean} result - 검색결과
 * @property {string} platorm - 플랫폼
 * @property {string} keyid - 방송 유니크 키
 * @property {string} icon - 방송 대표 아이콘
 * @property {string} nickname - 방장
 * @property {string} description - 방송 설명
 * @property {string} url - 방송 url
 * @property {string} thumbnail - 방송 썸네일
 * @property {boolean} onair - 방송중 여부
 * @property {value} viewer - 시청자 수
 * @property {string} err - 실패 시 에러메세지
 */

var db = require('../database').mysql;

var Local = require('./stream_api/local');
var Afreeca = require('./stream_api/afreeca');
var Azubu = require('./stream_api/azubu');
var Tvpot = require('./stream_api/tvpot');
var Twitch = require('./stream_api/twitch');


var streams = { local: [], external: [] };


exports.update = function() {
	
	// Local stream
	streams.local = [];
	db.query('SELECT * FROM user', (err, result) => {
		let users = result;

		// Local
		let localUsers = users.filter((e) => {
			return e.broadcast_class === 'local';
		});
		Local.update(localUsers, (s) => { streams.local.push(s); });

		// External
		let externalUsers = users.filter((e) => {
			return e.broadcast_class !== 'local';
		});

		externalUsers.forEach((user) => {
			
			let getInfoCallback = (info) => {
				if(!info.result) return;
				info = patchFromExternalToLocalInfo(info, user);
				streams.local.push(info);
			};

			switch(user.broadcast_class) {
				case 'afreeca':
					Afreeca.getInfo(user.afreeca_id, getInfoCallback);
					break;
				case 'twitch':
					Twitch.getInfo(user.twitch_id, getInfoCallback);
					break;
				case 'tvpot':
					Tvpot.getInfo(user.daumpot_id, getInfoCallback);
					break;
				default:
					break;
			}
		});
	});

	// External Stream
	streams.external = [];
	db.query('SELECT * FROM stream', (err, result) => {
		let afreecaIds = [];
		let azubuIds = [];
		let twitchIds = [];
		let tvpotIds = [];

		// Get Ids
		result.forEach((e) => {
			if(e.platform === 'afreeca') afreecaIds.push(e.keyid);
			if(e.platform === 'azubu') azubuIds.push(e.keyid);
			if(e.platform === 'twitch') twitchIds.push(e.keyid);
			if(e.platform === 'tvpot') tvpotIds.push(e.keyid);
		});

		// Stream Update
		Afreeca.update(afreecaIds, (s) => { streams.external.push(s); });
		Azubu.update(azubuIds, (s) => { streams.external.push(s); });
		Twitch.update(twitchIds, (s) => { streams.external.push(s); });
		Tvpot.update(tvpotIds, (s) => { streams.external.push(s); });
	});
};


exports.getStream = function() {
	streams.local.sort((a, b) => {
		return a.nickname < b.nickname ? -1 : 1;
	});

	streams.external.sort((a, b) => {
		if(a.platform < b.platform) return -1;
		if(a.platform > b.platform) return 1;
		return a.keyid < b.keyid ? -1 : 1;
	});

	return streams;
};


var patchFromExternalToLocalInfo = (streamInfo, user) => {
	streamInfo.nickname = user.nickname;
	streamInfo.icon = user.icon;
	streamInfo.description += '@'+user.nickname+'의 외부방송';
	return streamInfo;
};