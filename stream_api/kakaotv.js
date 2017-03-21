"use strict";

/** @constant {string} */
const URL_HOST = 'http://web-tv.kakao.com';
const TIMEOUT = 5000;

/** @constant {function} */
const CHANNEL_URL = (cid) => URL_HOST + '/channel/' + cid;
const VIDEO_URL = (vid) => URL_HOST + '/api/v1/app/livelinks/' + vid + '/impress?fulllevels=liveLink&player=monet_flash&section=home&dteType=PC&service=kakao_tv&fields=ccuCount,thumbnailUri';
const EMBED_URL = (vid) => URL_HOST + '/embed/player/livelink/' + vid;


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
 * @property {int} viewer - 시청자 수
 * @property {string} err - 실패 시 에러메세지
 */
const DEFAULT_STREAM_INFO = () => {
	return {
		result: false,
		platform: 'kakaotv',
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
var request = require('request');

const init = () => new Promise((resolve) => {resolve(DEFAULT_STREAM_INFO());});

/**
 * fillUserToInfo
 * 채널정보를 받아 Info에 씌우는 작업
 * @param {string} cid - KakaoTV Channel Id
 * @param {streamInfo} info - 콜백받은 streaminfo
 */
const fillUserToInfo = (cid, info) => new Promise((resolve) => {

	let opt = {
		url: CHANNEL_URL(cid),
		timeout: TIMEOUT
	};

	request(opt, (err, res, body) => {
		if (err || res.statusCode !== 200) return;
		
		let path = res.request.uri.pathname;
		let isLive = path.indexOf('livelink') !== -1;
		if(!isLive) return;

		let matched = path.match(/livelink\/(.*)/);
		if(!matched) return;
		let videoId = matched[1];

		let icon = body.match(/\<meta.*og\:image.*content=\"(.*)\"\>/)[1];
		
		info.keyid = videoId;
		info.icon = icon;
		resolve(info);
	});
});

/**
 * fillStreamToInfo
 * KakaoTV Live Video Id를 받아 info에 덮어씁니다.
 * @param {string} vid - 
 */
const fillStreamToInfo = (info) => new Promise((resolve) => {

	const vid = info.keyid;
	let opt = {
		url: VIDEO_URL(vid),
		timeout: TIMEOUT,
		json: true
	};

	request (opt, (err, res, body) => {
		if(err || res.statusCode !== 200) return;

		if(!body || !body.liveLink) return;

		let channel = body.liveLink.channel;
		let live = body.liveLink.live;

		let isOnAir = (live.status === "ONAIR");
		if(!isOnAir) return;
		
		info.nickname = channel.name;
		info.title = channel.name;
		info.description = live.title;
		info.url = EMBED_URL(vid);
		info.thumbnail = live.thumbnailUri;
		info.onair = true;
		info.viewer = live.ccuCount;

		resolve(info);
	});

});

/**
 * @callback getInfoCallback
 * @param {streamInfo} info - 방송정보
 */
/**
 * KakaoTV Channel ID를 이용해서 방송정보를 읽습니다.
 * @param {string} id - KakaoTV Channel ID
 * @param {getInfoCallback} callback
 */
exports.getInfo = (id, callback) => {
	if(!callback) callback = () => {};
	if(!id) return;

	init()
	.then((info) => fillUserToInfo(id, info))
	.then((info) => fillStreamToInfo(info))
	.then((info) => {
		info.result = true;
		if(!info.onair) return;
		callback(info);
	})
};