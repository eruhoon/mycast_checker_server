"use strict";

/** @constant {string} */
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/embed/';
const CHANNEL_URL = 'https://www.googleapis.com/youtube/v3/channels';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const API_KEY = 'AIzaSyCoWq0V1vZGTUiBJt4jVCjvCQwG-J9xblg';
const TIMEOUT = 3000;

/**
 * @typedef youtubeInfo
 * @type {object}
 * @property {boolean} result - 검색결과
 * @property {string} platorm - 플랫폼
 * @property {string} keyid - 방송 유니크 키
 * @property {string} icon - 방송 대표 아이콘
 * @property {string} nickname - 방장 이름
 * @property {string} title - 방송 제목
 * @property {string} description - 방송 설명
 * @property {string} url - 방송 url
 * @property {string} thumbnail - 방송 썸네일
 * @property {boolean} onair - 방송중 여부
 * @property {value} viewer - 시청자 수
 * @property {string} err - 실패 시 에러메세지
 */
const DEFAULT_YOUTUBE_INFO = () => {
	return {
		result: false,
		platform: 'youtube',
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

/** @module */
let request = require('request');
let querystring = require('querystring');

let init = () => new Promise((resolve) => { resolve(DEFAULT_YOUTUBE_INFO()); });

let fillUserToInfo = (id, info) => new Promise((resolve) => {

	let query = querystring.stringify({
		part: 'snippet',
		id: id,
		key: API_KEY
	});

	let opt = {
		url: CHANNEL_URL + '?' + query,
		timeout: TIMEOUT,
		json: true
	};

	request(opt, (err, res, body) => {
		if (err || res.statusCode !== 200) return;
		if (!body || body === undefined) return;
		if (body.pageInfo.totalResults < 1) return;
		
		info.keyid = id;
		info.icon = body.items[0].snippet.thumbnails.medium.url;
		info.nickname = body.items[0].snippet.title;
		resolve(info);
	});

});

/**
 * fillStreamToInfo
 * Youtube Channel ID를 이용하여 Live정보를 읽어, 내용을 info에 채웁니다.
 * @param {string} id
 * @param {youtubeInfo} info - 이전 Youtube 방송 정보를 Callback받아옵니다.
 */
let fillStreamToInfo = (id, info) => new Promise((resolve) => {
	
	let query = querystring.stringify({
		part: 'snippet',
		channelId: id,
		eventType: 'live',
		type: 'video',
		key: API_KEY
	});

	let opt = {
		url: SEARCH_URL + '?' + query,
		timeout: TIMEOUT,
		json: true
	};

	request(opt, (err, res, body) => {
		if (err || res.statusCode !== 200) return;
		if (!body || body === undefined) return;
		if (body.pageInfo.totalResults < 1) return;

		let snippet = body.items[0].snippet;
		let videoId = body.items[0].id.videoId;
		
		info.title = snippet.title;
		info.description = snippet.description;
		info.url = YOUTUBE_VIDEO_URL + videoId + '?autoplay=1';
		info.thumbnail = snippet.thumbnails.medium.url;
		info.onair = true;
		resolve(info);
	});

});

/**
 * Exports.getInfo
 * Youtube Channel ID를 이용해서 방송정보를 읽습니다.
 * @param {string} id - Youtube Channel ID
 * @param {getInfoCallback} callback
 */
/**
 * @callback getInfoCallback
 * @param {youtubeInfo} info - 방송정보
 */
exports.getInfo = (id, callback) => {
	if(!callback) callback = () => {};
	if(!id) return;

	init()
	.then((info) => fillUserToInfo(id, info))
	.then((info) => fillStreamToInfo(id, info))
	.then((info) => {
		info.result = true;
		if(!info.onair) return;
		callback(info);
	})
};