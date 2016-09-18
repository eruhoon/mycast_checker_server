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
 * @property {value} alarm - 알람 수
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
	db.query('SELECT * FROM user', (err, result) => {
		let users = result;

		// Local
		let localStreams = [];
		let localUsers = users.filter((e) => {
			return e.broadcast_class === 'local';
		});
		Local.update(localUsers, (s) => { localStreams.push(s); });

		// External
		let externalUsers = users.filter((e) => {
			return e.broadcast_class !== 'local';
		});

		externalUsers.forEach((user) => {
			
			let getInfoCallback = (info) => {
				if(!info.result) return;
				info = patchFromExternalToLocalInfo(info, user);
				localStreams.push(info);
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

		streams.local = localStreams;
	});

	// External Stream
	let externalQuery = 'SELECT stream.*, (SELECT count(*) FROM stream_alarm WHERE stream.idx=stream_alarm.stream_idx) alarm_count FROM stream ';
	db.query(externalQuery,	(err, result) => {
		
		let externals = [];

		result.forEach((stream) => {

			let getInfoCallback = (info) => {
				if(!info || !info.result) return;
				if(!info.onair) return;
				info.alarm = stream.alarm_count;
				externals.push(info);
			};

			switch(stream.platform) {
				case 'afreeca':
					Afreeca.getInfo(stream.keyid, getInfoCallback);
					break;
				case 'azubu':
					Azubu.getInfo(stream.keyid, getInfoCallback);
					break;
				case 'twitch':
					Twitch.getInfo(stream.keyid, getInfoCallback);
					break;
				case 'tvpot':
					Tvpot.getInfo(stream.keyid, getInfoCallback);
					break;
				default:
					break;
			}
		});

		streams.external = externals;

	});
};


exports.getStreams = function() {
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