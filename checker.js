"use strict";

var db = require('../database').mysql;

var Local = require('./stream_api/local');

let Module = {
	afreeca: require('./stream_api/afreeca'),
	azubu: require('./stream_api/azubu'),
	twitch: require('./stream_api/twitch'),
	tvpot: require('./stream_api/tvpot')
};

var streams = { local: [], external: [] };

const DEFAULT_SENSITIVITY = 5;

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
const streamWrapper = (stream) => {
	return {
		stream,
		sensitivity: DEFAULT_SENSITIVITY
	};
};

exports.update = function() {
	
	// Local stream
	db.query('SELECT * FROM user', (err, result) => {
		let users = result;

		updateStream('local');

		// Local
		//let localStreams = [];
		let localUsers = users.filter(e => e.broadcast_class === 'local');
		Local.update(localUsers, (s) => {
			addStream('local', s);
			//localStreams.push(s);
		});

		// External
		let externalUsers = users.filter((e) => {
			return e.broadcast_class !== 'local';
		});

		externalUsers.forEach((user) => {
			
			let getInfoCallback = (info) => {
				if(!info.result) return;
				info = patchFromExternalToLocalInfo(info, user);
				addStream('local', info);
				//localStreams.push(info);
			};

			let platform = user.broadcast_class;
			
			let keyids = {
				afreeca: 'afreeca_id',
				twitch: 'twitch_id',
				tvpot: 'daumpot_id'
			};

			let keyid = keyids[platform];
			if(!keyid) return;
			
			Module[platform].getInfo(user[keyid], getInfoCallback);
			
		});

		//streams.local = localStreams;
	});

	// External Stream
	let externalQuery = 'SELECT stream.*, (SELECT count(*) FROM stream_alarm WHERE stream.idx=stream_alarm.stream_idx) alarm_count FROM stream ';
	db.query(externalQuery,	(err, result) => {
		
		updateStream('external');

		result.forEach((stream) => {

			let getInfoCallback = (info) => {
				if(!info || !info.result) return;
				if(!info.onair) return;
				info.alarm = stream.alarm_count;
				addStream('external', info);
			};

			let platform = stream.platform;
			Module[platform].getInfo(stream.keyid, getInfoCallback);

		});
	});
};


/**
 * updateStream
 * @param  {stirng} type - 타입 {'local', 'external'}
 */
let updateStream = (type) => {
	streams[type] = streams[type].map(e => {
		e.sensitivity--;
		return e;
	}).filter(e => e.sensitivity > 0);
};

/**
 * addStream
 * @param  {stirng} type - 타입 {'local', 'external'}
 * @param  {streamInfo} info - 스트림 정보
 */
let addStream = (type, info) => {
	let newStream = streamWrapper(info);
	let isUpdate = false;
	streams[type] = streams[type].map(e => {
		let s = e.stream;
		if(s.keyid === info.keyid && s.platform === info.platform){
			isUpdate = true;
			return newStream;
		}
		return e;
	});

	if(!isUpdate) streams[type].push(newStream);

};


exports.getStreams = function() {
	
	let local = streams.local
			.map(e => e.stream)
			.sort((a, b) => {
				return a.nickname < b.nickname ? -1 : 1;
			});
	
	let external = streams.external
			.map(e => e.stream)
			.sort((a, b) => {
				if(a.platform < b.platform) return -1;
				if(a.platform > b.platform) return 1;
				return a.keyid < b.keyid ? -1 : 1;
			});
	
	return { local, external };
};


var patchFromExternalToLocalInfo = (streamInfo, user) => {
	streamInfo.keyid = user.id;
	streamInfo.nickname = user.nickname;
	streamInfo.icon = user.icon;
	streamInfo.description += '@'+user.nickname+'의 외부방송';
	return streamInfo;
};