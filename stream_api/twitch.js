"use strict";

/** @constant {string} */
const USER_URL = 'https://api.twitch.tv/kraken/users/';
const STREAM_URL = 'https://api.twitch.tv/kraken/streams/';
const CLIENT_ID = 'sos9dle7u1v02i5glmv4pgm1ua83mcl';


/**
 * @typedef twitchInfo
 * @type {object}
 * @property {boolean} result - 검색결과
 * @property {string} platorm - 플랫폼
 * @property {string} keyid - 방송 유니크 키
 * @property {string} icon - 방송 대표 아이콘
 * @property {string} nickname - 방장
 * @property {string} title - 방송 제목
 * @property {string} description - 방송 설명
 * @property {string} url - 방송 url
 * @property {string} thumbnail - 방송 썸네일
 * @property {boolean} onair - 방송중 여부
 * @property {value} viewer - 시청자 수
 * @property {string} err - 실패 시 에러메세지
 */
const DEFAULT_TWITCH_INFO = () => {
	return {
		result: false,
		platform: 'twitch',
		keyid: null,
		icon: null,
		nickname: null,
		title: null,
		description: null,
		url: null,
		thumbnail: null,
		onair: false,
		viewer: 0,
		err: null
	};
};

// Load Module
var request = require('request');

let init = () => new Promise((resolve) => { resolve(DEFAULT_TWITCH_INFO()); });

let fillUserToInfo = (id, info) => new Promise((resolve, reject) => {

	let opt = {
		url: USER_URL+id,
		headers: { 'Client-ID': CLIENT_ID },
		timeout: 5000,
		json: true
	};
	
	request(opt, (err, res, body) => { try {
		if(err || res.statusCode !== 200) return;
		if(!body || body === undefined) return;
		if(body.error) reject(body.message);

		info.keyid = id;
		info.icon = body.logo;
		info.nickname = body.display_name;
		resolve(info);

	} catch(e) {
		reject(e);
	}});
});

let fillStreamToInfo = (id, info) => new Promise((resolve, reject) => {

	let opt = {
		url: STREAM_URL+id,
		headers: { 'Client-ID': CLIENT_ID },
		timeout: 5000,
		json: true
	};
	
	request(opt, (err, res, body) => { try {
		if(err || res.statusCode !== 200) return;
		if(!body || body === undefined) return;
		
		let result = body.stream;
		if(!result) {
			info.onair = false;
			resolve(info);
			return;
		}

		info.title = result.channel.display_name;
		info.description = result.channel.status;
		info.url = 'https://player.twitch.tv/?channel='+id;
		info.thumbnail = result.preview.large+'?'+new Date().getTime();
		info.onair = true;
		info.viewer = parseInt(result.viewers);
		resolve(info);

	} catch(e) {
		reject(e);
	}});
});


/**
 * Exports.getInfo
 * 트위치 ID의 방송정보를 읽습니다.
 * @param {string} id - 트위치 ID
 * @param {getInfoCallback} callback
 */
/**
 * @callback getInfoCallback
 * @param {twitchInfo} info - 방송정보
 */
exports.getInfo = (id, callback) => {
	if(!callback) callback = () => {};

	init().then(
		(info) => fillUserToInfo(id, info),
		(err) => { console.log('Error : '+err+' #stream_api/twitch'); }
	).then(
		(info) => fillStreamToInfo(id, info),
		(err) => { console.log('Error : '+err+' #stream_api/twitch'); }
	).then((info) => {
		info.result = true;
		if(!info.onair) return;
		callback(info);
	});
};