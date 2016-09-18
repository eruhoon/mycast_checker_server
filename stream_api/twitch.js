"use strict";

/**
 * @typedef twitchInfo
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


/** @constant {string} */
const USER_URL = 'https://api.twitch.tv/kraken/users/';
const STREAM_URL = 'https://api.twitch.tv/kraken/streams/';


// Load Module
var request = require('request');


/**
 * Exports.update
 * 방송목록 업데이트
 * @param {array<string>} ids - 트위치 아이디 목록
 * @param {updateCallback} callback
 */
/**
 * @callback updateCallback
 * @param {twitchInfo} result - 트위치 방송정보
 */
exports.update = (ids, callback) => {

	if(!callback) callback = () => {};

	ids.forEach((id) => {
		this.getInfo(id, (info) => {
			if(!info.onair) return;
			callback(info);
		});
	});
};


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
exports.getInfo = (id, callback) => { try {

	if(!callback) callback = () => {};

	let opt = {
		url: USER_URL+id,
		headers: { 'Client-ID': CLIENT_ID },
		timeout: 5000
	};
	request(opt, (err, res, body) => {
		if(err || res.statusCode !== 200) return;

		let result = parseUserInfo(body);
		if(!result.result) return;

		getStreamInfo(id, (err, streamInfo) => {
			if(err) return;
			result.title = streamInfo.title;
			result.description = streamInfo.description;
			result.url = streamInfo.url;
			result.thumbnail = streamInfo.thumbnail;
			result.onair = streamInfo.onair;
			result.viewer = streamInfo.viewer;
			callback(result);
		});
	});
} catch (e) {
	console.log('Error : '+e+'@getInfo() #stream_api/twitch');
}};


/**
 * getStreamInfo
 * 방송정보 RawData를 가공합니다.
 * @param {string} id - 트위치 ID
 * @param {geStreamInfoCallback} callback
 */
/**
 * @callback getStreamInfoCallback
 * @param {null|string} err - 성공시 null, 에러시 메세지
 * @param {twitchInfo} info - 방송정보
 */
var getStreamInfo = (id, callback) => { try {
	if(!callback) callback = () => {};

	let opt = {
		url: STREAM_URL+id,
		headers: { 'Client-ID': CLIENT_ID },
		timeout: 5000
	};
	request(opt, (err, res, body) => {
		if(err || res.statusCode !== 200) return;
		
		let info = JSON.parse(body).stream;
		if(!info) return;
		let result = {
			title: info.channel.display_name,
			description: info.channel.status,
			url: 'https://player.twitch.tv/?channel='+id,
			thumbnail: info.preview.large+'?'+new Date().getTime(),
			onair: true,
			viewer: parseInt(info.viewers)
		};
		callback(null, result);
	});
} catch (e) {
	console.log('Error : '+e+'@getStreamInfo() #stream_api/twitch');
}}; 


/**
 * parseUserInfo
 * 방송유저정보 RawData를 가공합니다.
 * @param {string} body - RawData
 * @return {twitchInfo}
 */
var parseUserInfo = (body) => { try {
	
	let info = JSON.parse(body);
	if(!info) return { return: false, err: 'Parse Error' };
	
	return {
		result: true,
		platform: 'twitch',
		keyid: info.name,
		icon: info.logo,
		nickname: info.display_name,
		title: null,
		description: null,
		url: null,
		thumbnail: null,
		onair: null,
		viewer: null
	};

} catch(e) {
	console.log('Error : '+e+'@parseUserInfo() #stream_api/twitch');
	return { result: false, err: e };
}};
